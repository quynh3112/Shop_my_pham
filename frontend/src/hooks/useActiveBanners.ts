import { useQuery } from "@tanstack/react-query";
import { bannerActive } from "../service/banner.service";
import type { Banner } from "../types/banner";

const normalizeBanners = (payload: unknown): Banner[] => {
  if (Array.isArray(payload)) return payload as Banner[];
  const nested = (payload as { data?: unknown; items?: unknown } | null)?.data ??
    (payload as { items?: unknown } | null)?.items;
  return Array.isArray(nested) ? (nested as Banner[]) : [];
};

/** Banner đang bật, dùng làm "Tin tức" cho khách hàng */
export default function useActiveBanners() {
  const query = useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => normalizeBanners(await bannerActive()),
    staleTime: 5 * 60 * 1000,
  });

  return {
    banners: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
