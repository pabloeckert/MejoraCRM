import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_CLIENTS } from "@/demo/demoData";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const PAGE_SIZE = 50;

export function useClientsPaginated() {
  const queryClient = useQueryClient();

  const query = useQuery<Client[]>({
    queryKey: ["clients", "paginated", DEMO_MODE ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (DEMO_MODE) return DEMO_CLIENTS as any[];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name")
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
      queryKey: ["clients", "paginated"],
      queryFn: async () => {
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("name")
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      },
    });
  };

  return { ...query, loadMore };
}

export function useAllClients() {
  return useQuery<Client[]>({
    queryKey: ["clients", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_CLIENTS as any[];
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientsMinimal() {
  return useQuery({
    queryKey: ["clients-min", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_CLIENTS.map((c) => ({ id: c.id, name: c.name }));
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
