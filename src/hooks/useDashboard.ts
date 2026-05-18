import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS, DEMO_CLIENTS, DEMO_PROFILES } from "@/demo/demoData";
import type { DashboardData } from "@/lib/types";

/**
 * Dashboard data via single RPC call.
 * In demo mode, returns mock data instead.
 */
export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard-data", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          interactions: DEMO_INTERACTIONS as any,
          clients: DEMO_CLIENTS as any,
          profiles: DEMO_PROFILES as any,
        } as DashboardData;
      }

      const { data, error } = await supabase.rpc("get_dashboard_data");
      if (error) throw error;

      return (data as unknown as DashboardData) ?? {
        interactions: [],
        clients: [],
        profiles: [],
      };
    },
  });
}
