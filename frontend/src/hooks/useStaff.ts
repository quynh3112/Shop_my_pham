import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStaff, deleteStaff, listStaff, resetStaffPassword, updateStaff } from "../service/staff.service";
import type { StaffUpdate } from "../types/staff";

export const staffQueryKey = ["staff"] as const;

/** Danh sách nhân viên + các thao tác quản lý (chỉ admin) */
export default function useStaff() {
  const queryClient = useQueryClient();
  const staffQuery = useQuery({ queryKey: staffQueryKey, queryFn: listStaff });
  const refresh = () => queryClient.invalidateQueries({ queryKey: staffQueryKey });

  const createMutation = useMutation({ mutationFn: createStaff, onSuccess: refresh });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffUpdate }) => updateStaff(id, data),
    onSuccess: refresh,
  });
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetStaffPassword(id, password),
  });
  const deleteMutation = useMutation({ mutationFn: deleteStaff, onSuccess: refresh });

  return {
    staff: staffQuery.data ?? [],
    loading: staffQuery.isLoading,
    fetching: staffQuery.isFetching,
    error: staffQuery.error instanceof Error ? staffQuery.error.message : null,
    createStaff: createMutation.mutateAsync,
    updateStaff: updateMutation.mutateAsync,
    resetPassword: passwordMutation.mutateAsync,
    deleteStaff: deleteMutation.mutateAsync,
    saving: createMutation.isPending || updateMutation.isPending,
    resetting: passwordMutation.isPending,
  };
}
