import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Interaction = Database["public"]["Tables"]["interactions"]["Row"];

const PAGE_SIZE = 50;

const INTERACTIONS_SELECT =
  "*, clients(name), interaction_lines(quantity, unit_price, line_total, products(name, unit_label))";

/**
 * Paginated interactions list (most recent first).
 * Returns PAGE_SIZE interactions. Use `loadMore()` for next page.
 */
export function useInteractionsPaginated() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["interactions", "paginated"],
    queryFn: async ({ pageParam = 0 }) => {
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
    initialData: [],
  });

  const loadMore = () => {
    const current = query.data ?? [];
    if (current.length % PAGE_SIZE !== 0) return;
    const nextPage = Math.floor(current.length / PAGE_SIZE);
    queryClient.prefetchQuery({
      queryKey: ["interactions", "paginated"],
      queryFn: async () => {
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from("interactions")
          .select(INTERACTIONS_SELECT)
          .order("interaction_date", { ascending: false })
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      },
    });
  };

  return { ...query, loadMore };
}

/** Full interactions list (no pagination) — used by Dashboard and NotificationsPanel. */
export function useAllInteractions() {
  return useQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Presupuestos for a specific client (used by Interactions form). */
export function useClientPresupuestos(clientId: string | undefined) {
  return useQuery({
    queryKey: ["interactions-presupuestos", clientId],
    enabled: !!clientId,
    queryFn: async () => {
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
