import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { DEMO_PRODUCTS } from "@/demo/demoData";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_PRODUCTS as any[];
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ["products-active", DEMO_MODE ? "demo" : "live"],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_PRODUCTS.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, unit_label: p.unit, currency: p.currency, price: p.price }));
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_label, currency, price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
