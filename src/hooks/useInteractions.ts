import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS } from "@/demo/demoData";
import type { Database } from "@/integrations/supabase/types";

type Interaction = Database["public"]["Tables"]["interactions"]["Row"];

const PAGE_SIZE = 50;

const INTERACTIONS_SELECT =
  "*, clients(name), interaction_lines(quantity, unit_price, line_total, products(name, unit_label))";

export function useInteractionsPaginated() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["interactions", "paginated", DEMO_MODE ? "demo" : "live"],
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
    initialData: [],
  });

  const loadMore = () => {
    if (DEMO_MODE) return;
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

export function useAllInteractions() {
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

export function useClientPresupuestos(clientId: string | undefined) {
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
