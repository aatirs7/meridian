import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NonNegotiable,
  CreateNonNegotiableBody,
  UpdateNonNegotiableBody,
  ReorderBody,
} from "@meridian/shared";
import { useApi } from "../useApi";

/** Query keys touched by Branch A. Mutations invalidate both lists + today. */
export const NN_KEY = ["non-negotiables"] as const;
export const TODAY_KEY = ["today"] as const;

export function useMyNonNegotiables() {
  const call = useApi();
  return useQuery({
    queryKey: NN_KEY,
    queryFn: () => call<NonNegotiable[]>("/api/non-negotiables"),
  });
}

export function useCreateNonNegotiable() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNonNegotiableBody) =>
      call<NonNegotiable>("/api/non-negotiables", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NN_KEY });
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}

export function useUpdateNonNegotiable() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNonNegotiableBody }) =>
      call<NonNegotiable>(`/api/non-negotiables/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NN_KEY });
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}

export function useArchiveNonNegotiable() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      call<NonNegotiable>(`/api/non-negotiables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NN_KEY });
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}

export function useReorderNonNegotiables() {
  const call = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReorderBody) =>
      call<NonNegotiable[]>("/api/non-negotiables/reorder", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (rows) => {
      qc.setQueryData(NN_KEY, rows);
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}
