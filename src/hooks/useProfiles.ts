import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** All profiles (user_id + full_name). Used by Dashboard for seller ranking. */
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
