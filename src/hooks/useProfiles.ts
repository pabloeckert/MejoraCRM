import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_PROFILES } from "@/demo/demoData";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_PROFILES.map((p) => ({ user_id: p.user_id, full_name: p.full_name }));
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
