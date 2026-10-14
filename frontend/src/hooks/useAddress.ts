import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  listMyAddresses,
  removeAddress,
  setDefaultAddress,
  updateAddress,
} from "../service/address.service";
import type { AddressInput } from "../types/address";
import { isLoggedIn } from "../utils/auth";

export const addressQueryKey = ["addresses"] as const;

export default function useAddress() {
  const queryClient = useQueryClient();
  const addressesQuery = useQuery({
    queryKey: addressQueryKey,
    queryFn: listMyAddresses,
    enabled: isLoggedIn(),
  });

  const refreshAddresses = () => queryClient.invalidateQueries({ queryKey: addressQueryKey });

  const createMutation = useMutation({ mutationFn: createAddress, onSuccess: refreshAddresses });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AddressInput }) => updateAddress(id, input),
    onSuccess: refreshAddresses,
  });
  const defaultMutation = useMutation({ mutationFn: setDefaultAddress, onSuccess: refreshAddresses });
  const removeMutation = useMutation({ mutationFn: removeAddress, onSuccess: refreshAddresses });

  return {
    addresses: addressesQuery.data ?? [],
    loading: addressesQuery.isLoading,
    error: addressesQuery.error instanceof Error ? addressesQuery.error.message : null,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    setDefaultAddress: defaultMutation.mutateAsync,
    removeAddress: removeMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      defaultMutation.isPending ||
      removeMutation.isPending,
  };
}
