import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const PAGE_SIZE = 50;

/**
 * Paginated clients list. Returns the first PAGE_SIZE clients ordered by name.
 * Call `loadMore()` to fetch the next page (appends to the existing data).
 */
export function useClientsPaginated() {
  const queryClient = useQueryClient();

  const query = useQuery<Client[]>({
    queryKey: ["clients", "paginated"],
    queryFn: async ({ pageParam = 0 }) => {
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
    const current = query.data ?? [];
    if (current.length % PAGE_SIZE !== 0) return; // already at end
    const nextPage = Math.floor(current.length / PAGE_SIZE);
    // Prefetch next page
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

/** Full client list (no pagination) — used when you need ALL clients (e.g. filters, counts). */
export function useAllClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Minimal client list (id + name) for pickers/dropdowns. */
export function useClientsMinimal() {
  return useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
