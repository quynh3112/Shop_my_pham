import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomer, listCustomers, setCustomerStatus } from "../service/customer.service";
import type { CustomerListQuery } from "../types/customer";

export const customerQueryKey = ["customers"] as const;

export function useCustomerList(query: CustomerListQuery) {
  const listQuery = useQuery({
    queryKey: [...customerQueryKey, "list", query],
    queryFn: () => listCustomers(query),
    placeholderData: keepPreviousData,
  });
  return {
    customers: listQuery.data?.items ?? [],
    pagination: listQuery.data?.pagination,
    loading: listQuery.isLoading,
    fetching: listQuery.isFetching,
    error: listQuery.error instanceof Error ? listQuery.error.message : null,
  };
}

export function useCustomerDetail(id?: number) {
  const detailQuery = useQuery({
    queryKey: [...customerQueryKey, "detail", id],
    queryFn: () => getCustomer(id!),
    enabled: id !== undefined,
  });
  return { customer: detailQuery.data, loading: detailQuery.isLoading, error: detailQuery.error };
}

export function useCustomerStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setCustomerStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerQueryKey }),
  });
  return { setStatus: mutation.mutateAsync, updating: mutation.isPending };
}
