import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS, DEMO_CLIENTS, DEMO_PROFILES } from "@/demo/demoData";

/**
 * Dashboard data via single RPC call.
 * In demo mode, returns mock data instead.
 *
 * Returns: { interactions: [...], clients: [...], profiles: [...] }
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          interactions: DEMO_INTERACTIONS as any[],
          clients: DEMO_CLIENTS as any[],
          profiles: DEMO_PROFILES as any[],
        };
      }

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
