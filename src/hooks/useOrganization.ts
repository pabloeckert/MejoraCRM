import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_ORG_ID } from "@/demo/demoData";

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

let MEMORY_DEMO_ORG: Organization = {
  id: DEMO_ORG_ID,
  name: "Mejora Continua (Demo)",
  plan: "free",
};

export function useOrganization() {
  const { organizationId } = useAuth();

  return useQuery<Organization | null>({
    queryKey: ["organization", organizationId ?? "demo"],
    queryFn: async () => {
      if (DEMO_MODE) return { ...MEMORY_DEMO_ORG };
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from("organizations" as never)
        .select("id, name, plan")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    staleTime: 30_000,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (DEMO_MODE) {
        MEMORY_DEMO_ORG = { ...MEMORY_DEMO_ORG, name };
        return;
      }
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase
        .from("organizations" as never)
        .update({ name } as never)
        .eq("id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}
