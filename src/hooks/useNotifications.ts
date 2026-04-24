import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Notifications data via single RPC call.
 * Replaces 3 separate queries (interactions + clients + profiles).
 *
 * Returns: { interactions: [...], clients: [...], profiles: [...] }
 */
export function useNotificationsData() {
  return useQuery({
    queryKey: ["notifications-data"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_notifications_data");
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
