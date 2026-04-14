import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(217,91%,60%)", "hsl(142,76%,36%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(280,70%,50%)", "hsl(180,60%,40%)"];

export default function Reports() {
  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*, clients(name, segment, location), products(name, category)");
      return data || [];
    },
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const { data } = await supabase.from("interactions").select("*, products(name)");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.full_name || "Sin nombre"]));

  // Sales by product
  const won = opportunities.filter((o: any) => o.stage === "cerrado_ganado");
  const salesByProduct: Record<string, number> = {};
  won.forEach((o: any) => {
    const key = o.products?.name || "Sin producto";
    salesByProduct[key] = (salesByProduct[key] || 0) + (o.estimated_amount || 0);
  });
  const salesByProductData = Object.entries(salesByProduct).map(([name, value]) => ({ name, value }));

  // Sales by seller
  const salesBySeller: Record<string, number> = {};
  won.forEach((o: any) => {
    const key = profileMap[o.assigned_to] || "Desconocido";
    salesBySeller[key] = (salesBySeller[key] || 0) + (o.estimated_amount || 0);
  });
  const salesBySellerData = Object.entries(salesBySeller).map(([name, value]) => ({ name, value }));

  // Conversion by seller
  const oppsBySeller: Record<string, { total: number; won: number }> = {};
  opportunities.forEach((o: any) => {
    const key = profileMap[o.assigned_to] || "Desconocido";
    if (!oppsBySeller[key]) oppsBySeller[key] = { total: 0, won: 0 };
    oppsBySeller[key].total++;
    if (o.stage === "cerrado_ganado") oppsBySeller[key].won++;
  });
  const conversionData = Object.entries(oppsBySeller).map(([name, v]) => ({
    name,
    rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
  }));

  // Overdue follow-ups
  const overdue = interactions.filter(
    (i: any) => i.follow_up_date && new Date(i.follow_up_date) < new Date()
  );

  // Lost revenue
  const lost = opportunities.filter((o: any) => o.stage === "cerrado_perdido");
  const lostRevenue = lost.reduce((sum: number, o: any) => sum + (o.estimated_amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ventas totales</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${won.reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0).toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Seguimientos vencidos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{overdue.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ventas perdidas (impacto)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">${lostRevenue.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por producto</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByProductData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: "hsl(220,9%,46%)" }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(220,9%,46%)", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217,91%,60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por vendedor</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySellerData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220,9%,46%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220,9%,46%)" }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(142,76%,36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conversión por vendedor (%)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220,9%,46%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220,9%,46%)" }} />
                <Tooltip />
                <Bar dataKey="rate" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Motivos de pérdida</CardTitle></CardHeader>
          <CardContent className="h-64">
            {(() => {
              const reasons: Record<string, number> = {};
              lost.forEach((o: any) => { const r = o.loss_reason || "Sin motivo"; reasons[r] = (reasons[r] || 0) + 1; });
              const data = Object.entries(reasons).map(([name, value]) => ({ name, value }));
              return data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
