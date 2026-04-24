import { Tables } from "@/integrations/supabase/types";

export type Interaction = Tables<"interactions"> & {
  clients?: { name: string; province?: string; segment?: string } | null;
  interaction_lines?: Array<{
    products?: { name: string } | null;
    quantity: number;
    unit_price: number;
    line_total: number | null;
  }>;
};

export type Client = Tables<"clients">;

export type Profile = Tables<"profiles">;

export type Product = Tables<"products">;

export interface DashboardData {
  interactions: Interaction[];
  clients: Client[];
  profiles: Profile[];
}

export interface SellerStats {
  ventas: number;
  presup: number;
  segs: number;
  ingresos: number;
}

export interface RankingEntry extends SellerStats {
  name: string;
  uid?: string;
}
