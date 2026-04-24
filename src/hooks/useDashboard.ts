import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dashboard data via single RPC call.
 * Replaces 3 separate queries (interactions + clients + profiles).
 *
 * Returns: { interactions: [...], clients: [...], profiles: [...] }
 * Each interaction includes: client object, interaction_lines with product details.
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_data");
      if (error) throw error;

      const result = data as {
        interactions: any[];
        clients: any[];
        profiles: any[];
      };

      return {
        interactions: result?.interactions ?? [],
        clients: result?.clients ?? [],
        profiles: result?.profiles ?? [],
      };
    },
  });
}
