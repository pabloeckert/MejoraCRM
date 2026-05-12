import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_CLIENTS } from "@/demo/demoData";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const PAGE_SIZE = 50;

/**
 * Infinite scroll hook for clients.
 * Returns: { data (flat array), fetchNextPage, hasNextPage, isFetchingNextPage, ... }
 */
export function useClientsInfinite() {
  return useInfiniteQuery<Client[]>({
    queryKey: ["clients-infinite", DEMO_MODE ? "demo" : "live"],
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
    getNextPageParam: (lastPage, allPages) => {
      if (DEMO_MODE) return undefined; // No pagination in demo
      if (lastPage.length < PAGE_SIZE) return undefined; // No more pages
      return allPages.length; // Next page index
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

/**
 * Flatten infinite query pages into a single array.
 */
export function flattenClientPages(data: { pages: Client[][] } | undefined): Client[] {
  if (!data?.pages) return [];
  return data.pages.flat();
}

// Keep existing hooks for compatibility
export { useClientsPaginated, useAllClients, useClientsMinimal };

function useClientsPaginated() {
  // Legacy — prefer useClientsInfinite
  return useInfiniteQuery<Client[]>({
    queryKey: ["clients-infinite", DEMO_MODE ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (DEMO_MODE) return DEMO_CLIENTS as any[];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase.from("clients").select("*").order("name").range(from, to);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (DEMO_MODE) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });
}

import { useQuery } from "@tanstack/react-query";

function useAllClients() {
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

function useClientsMinimal() {
  return useQuery({
    queryKey: ["clients-min", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_CLIENTS.map((c) => ({ id: c.id, name: c.name }));
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
