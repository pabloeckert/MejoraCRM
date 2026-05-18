import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_PRODUCTS } from "@/demo/demoData";
import type { Product } from "@/lib/types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_PRODUCTS as Product[];
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return (data as Product[]) ?? [];
    },
  });
}

export function useActiveProducts() {
  return useQuery<{ id: string; name: string; unit_label: string | null; currency: string | null; price: number | null }[]>({
    queryKey: ["products-active", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_PRODUCTS.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, unit_label: p.unit, currency: p.currency, price: p.price }));
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_label, currency, price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data as { id: string; name: string; unit_label: string | null; currency: string | null; price: number | null }[]) ?? [];
    },
  });
}
