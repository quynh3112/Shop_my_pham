import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  allBanner,
  createBanner,
  deleteBanner,
  updateBanner,
  updateStatus,
} from "../service/banner.service";
import type { Banner, CreateBanner } from "../types/banner";

export const bannerQueryKey = ["banners"] as const;

const normalizeBanners = (payload: unknown): Banner[] => {
  if (Array.isArray(payload)) return payload as Banner[];
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nested = data.data ?? data.items ?? data.banners ?? data.result;
  return Array.isArray(nested) ? nested as Banner[] : [];
};

export default function useBanner() {
  const queryClient = useQueryClient();
  const bannersQuery = useQuery({
    queryKey: bannerQueryKey,
    queryFn: async () => normalizeBanners(await allBanner()),
  });

  const refreshBanners = () => queryClient.invalidateQueries({ queryKey: bannerQueryKey });
  const createMutation = useMutation({ mutationFn: createBanner, onSuccess: refreshBanners });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBanner> }) => updateBanner(id, payload),
    onSuccess: refreshBanners,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateStatus(id, isActive),
    onSuccess: refreshBanners,
  });
  const deleteMutation = useMutation({ mutationFn: deleteBanner, onSuccess: refreshBanners });

  return {
    banners: bannersQuery.data ?? [],
    loading: bannersQuery.isLoading,
    error: bannersQuery.error instanceof Error ? bannersQuery.error.message : null,
    fetchBanners: bannersQuery.refetch,
    createBanner: createMutation.mutateAsync,
    updateBanner: updateMutation.mutateAsync,
    updateStatus: statusMutation.mutateAsync,
    deleteBanner: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || statusMutation.isPending || deleteMutation.isPending,
  };
}
