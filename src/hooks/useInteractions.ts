import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS } from "@/demo/demoData";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Interaction = Database["public"]["Tables"]["interactions"]["Row"];

const PAGE_SIZE = 50;

const INTERACTIONS_SELECT =
  "*, clients(name), interaction_lines(quantity, unit_price, line_total, products(name, unit_label))";

/**
 * Infinite scroll hook for interactions.
 * Returns: { data (flat array), fetchNextPage, hasNextPage, isFetchingNextPage, ... }
 */
export function useInteractionsInfinite() {
  return useInfiniteQuery({
    queryKey: ["interactions-infinite", DEMO_MODE ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (DEMO_MODE) return DEMO_INTERACTIONS as any[];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (DEMO_MODE) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) return;
      const { error } = await supabase.from("interactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["interactions-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Interacción eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Flatten infinite query pages into a single array.
 */
export function flattenInteractionPages(data: { pages: any[][] } | undefined): any[] {
  if (!data?.pages) return [];
  return data.pages.flat();
}

// Keep existing hooks for compatibility
export { useInteractionsPaginated, useAllInteractions, useClientPresupuestos };

function useInteractionsPaginated() {
  return useInfiniteQuery({
    queryKey: ["interactions-infinite", DEMO_MODE ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (DEMO_MODE) return DEMO_INTERACTIONS as any[];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (DEMO_MODE) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });
}

function useAllInteractions() {
  return useQuery({
    queryKey: ["interactions", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_INTERACTIONS as any[];
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useClientPresupuestos(clientId: string | undefined) {
  return useQuery({
    queryKey: ["interactions-presupuestos", clientId, DEMO_MODE ? "demo" : "live"],
    enabled: !!clientId,
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_INTERACTIONS.filter(
          (i) => i.client_id === clientId && i.result === "presupuesto"
        ).map((i) => ({ id: i.id, interaction_date: i.interaction_date, total_amount: i.total_amount, currency: i.currency }));
      }
      const { data, error } = await supabase
        .from("interactions")
        .select("id, interaction_date, total_amount, currency")
        .eq("client_id", clientId!)
        .eq("result", "presupuesto")
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
