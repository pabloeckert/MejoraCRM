/**
 * usePipelineData — Fetches interactions from Supabase and transforms
 * them into PipelineOpportunity objects for the v2 pipeline.
 *
 * Maps interaction_result → stageId:
 *   "sin_respuesta"  → "new"        (unhandled / fresh)
 *   "seguimiento"    → "contacted"  (follow-up in progress)
 *   "presupuesto"    → "proposal"   (quote sent)
 *   "venta"          → "won"        (deal closed)
 *   "no_interesado"  → "lost"       (not interested)
 *
 * "qualified" stage has no direct DB match — stays empty until
 * a "calificado" result is added or manual assignment is implemented.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePipelineStore, PipelineOpportunity } from "./usePipelineStore";

type InteractionRow = {
  id: string;
  client_id: string;
  result: string;
  total_amount: number | null;
  currency: string | null;
  next_step: string | null;
  follow_up_date: string | null;
  interaction_date: string;
  updated_at: string;
  clients: { name: string | null } | null;
};

const RESULT_TO_STAGE: Record<string, string> = {
  sin_respuesta: "new",
  seguimiento: "contacted",
  presupuesto: "proposal",
  venta: "won",
  no_interesado: "lost",
};

function toOpportunity(row: InteractionRow): PipelineOpportunity {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.clients?.name || "Sin nombre",
    amount: row.total_amount || 0,
    currency: row.currency || "USD",
    stageId: RESULT_TO_STAGE[row.result] || "new",
    products: [], // products come from interaction_lines, not fetched here for performance
    nextStep: row.next_step || undefined,
    followUpDate: row.follow_up_date || undefined,
    createdAt: row.interaction_date,
    updatedAt: row.updated_at,
  };
}

export function usePipelineData() {
  const { setOpportunities } = usePipelineStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pipeline-v2-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, client_id, result, total_amount, currency, next_step, follow_up_date, interaction_date, updated_at, clients(name)")
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InteractionRow[];
    },
    staleTime: 30_000,
  });

  // Sync fetched data into the pipeline store
  useEffect(() => {
    if (query.data) {
      const opportunities = query.data.map(toOpportunity);
      setOpportunities(opportunities);
    }
  }, [query.data, setOpportunities]);

  return {
    ...query,
    refetch: query.refetch,
    /** Invalidate cache to force re-fetch after mutations */
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["pipeline-v2-data"] }),
  };
}
