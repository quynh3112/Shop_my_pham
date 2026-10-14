import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  analyzeSkin,
  deleteMySkinAnalysis,
  getMySkinAnalysis,
  getMySkinAnalysisImage,
  listMySkinAnalyses,
} from "../service/skinAnalysis.service";
import { isLoggedIn } from "../utils/auth";

export const skinAnalysisKey = ["skin-analysis"] as const;

/** Gửi ảnh đi phân tích; kết quả được lưu sẵn vào cache chi tiết */
export function useAnalyzeSkin() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: analyzeSkin,
    onSuccess: (analysis) => {
      queryClient.setQueryData([...skinAnalysisKey, "detail", analysis.id], analysis);
      void queryClient.invalidateQueries({ queryKey: [...skinAnalysisKey, "list"] });
    },
  });
  return { analyze: mutation.mutateAsync, analyzing: mutation.isPending, reset: mutation.reset };
}

export function useSkinAnalysisHistory(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: [...skinAnalysisKey, "list", page, limit],
    queryFn: () => listMySkinAnalyses(page, limit),
    enabled: isLoggedIn(),
    placeholderData: keepPreviousData,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    loading: query.isLoading,
  };
}

export function useSkinAnalysisDetail(id?: number) {
  const query = useQuery({
    queryKey: [...skinAnalysisKey, "detail", id],
    queryFn: () => getMySkinAnalysis(id!),
    enabled: id !== undefined && isLoggedIn(),
  });
  return { analysis: query.data, loading: query.isLoading, error: query.error };
}

/** Ảnh khuôn mặt đã lưu của 1 kết quả -> object URL (tự thu hồi khi rời trang) */
export function useSkinAnalysisImage(id?: number, enabled = true) {
  const [url, setUrl] = useState<string>();
  const query = useQuery({
    queryKey: [...skinAnalysisKey, "image", id],
    queryFn: () => getMySkinAnalysisImage(id!),
    enabled: enabled && id !== undefined && isLoggedIn(),
    // Không giữ ảnh khuôn mặt trong bộ nhớ đệm lâu hơn cần thiết
    gcTime: 0,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!query.data) return;
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [query.data]);

  return { url, loading: query.isLoading, error: query.error };
}

export function useDeleteSkinAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteMySkinAnalysis,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skinAnalysisKey }),
  });
  return { remove: mutation.mutateAsync, removing: mutation.isPending };
}
