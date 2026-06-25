import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BucketItem,
  CreateBucketItemBody,
  UpdateBucketItemBody,
  UpdateBucketProgressBody,
} from "@meridian/shared";
import { useApi } from "../useApi";

export const BUCKET_KEY = ["bucket"] as const;

export function useBucket() {
  const call = useApi();
  return useQuery({
    queryKey: BUCKET_KEY,
    queryFn: () => call<BucketItem[]>("/api/bucket"),
    refetchOnWindowFocus: true,
  });
}

export function useCreateBucketItem() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBucketItemBody) =>
      call<BucketItem>("/api/bucket", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function useUpdateBucketItem() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBucketItemBody }) =>
      call<BucketItem>(`/api/bucket/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function useDeleteBucketItem() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => call<{ ok: true }>(`/api/bucket/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function useUpdateProgress() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBucketProgressBody }) =>
      call<BucketItem>(`/api/bucket/${id}/progress`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (updated) => {
      // Patch the single item in the list cache so the change shows immediately.
      qc.setQueryData<BucketItem[]>(BUCKET_KEY, (prev) =>
        prev ? prev.map((it) => (it.id === updated.id ? updated : it)) : prev
      );
      qc.invalidateQueries({ queryKey: BUCKET_KEY });
    },
  });
}
