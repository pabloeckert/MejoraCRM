import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { DollarSign, TrendingDown, Clock, TrendingUp } from "lucide-react";

const BRAND = {
  blue: "hsl(222,33%,43%)",
  gold: "hsl(45,74%,60%)",
  red: "hsl(2,52%,53%)",
  green: "hsl(142,60%,40%)",
  gray: "hsl(0,0%,40%)",
  purple: "hsl(280,40%,50%)",
};

const COLORS = [BRAND.blue, BRAND.gold, BRAND.red, BRAND.green, BRAND.gray, BRAND.purple];

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

  const won = opportunities.filter((o: any) => o.stage === "cerrado_ganado");
  const lost = opportunities.filter((o: any) => o.stage === "cerrado_perdido");
  const active = opportunities.filter((o: any) => !o.stage.startsWith("cerrado"));
  const totalWon = won.reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0);
  const totalLost = lost.reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0);
  const totalActive = active.reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0);

  const overdue = interactions.filter(
    (i: any) => i.follow_up_date && new Date(i.follow_up_date) < new Date()
  );

  // Sales by product
  const salesByProduct: Record<string, number> = {};
  won.forEach((o: any) => {
    const key = o.products?.name || "Sin producto";
    salesByProduct[key] = (salesByProduct[key] || 0) + (o.estimated_amount || 0);
  });
  const salesByProductData = Object.entries(salesByProduct)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Sales by location
  const salesByLocation: Record<string, number> = {};
  won.forEach((o: any) => {
    const key = o.clients?.location || "Sin ubicación";
    salesByLocation[key] = (salesByLocation[key] || 0) + (o.estimated_amount || 0);
  });
  const salesByLocationData = Object.entries(salesByLocation).map(([name, value]) => ({ name, value }));

  // Conversion by seller
  const oppsBySeller: Record<string, { total: number; won: number }> = {};
  opportunities.forEach((o: any) => {
    const key = profileMap[o.assigned_to] || "Vendedor";
    if (!oppsBySeller[key]) oppsBySeller[key] = { total: 0, won: 0 };
    oppsBySeller[key].total++;
    if (o.stage === "cerrado_ganado") oppsBySeller[key].won++;
  });
  const conversionData = Object.entries(oppsBySeller).map(([name, v]) => ({
    name,
    rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
  }));

  // Loss reasons
  const lossReasons: Record<string, number> = {};
  lost.forEach((o: any) => { const r = o.loss_reason || "Sin motivo"; lossReasons[r] = (lossReasons[r] || 0) + 1; });
  const lossData = Object.entries(lossReasons).map(([name, value]) => ({ name, value }));

  // Segment distribution
  const segmentData: Record<string, number> = {};
  opportunities.forEach((o: any) => {
    const seg = o.clients?.segment || "Sin segmento";
    segmentData[seg] = (segmentData[seg] || 0) + (o.estimated_amount || 0);
  });
  const segmentChartData = Object.entries(segmentData).map(([name, value]) => ({ name, value }));

  const kpis = [
    { label: "Ventas cerradas", value: `$${totalWon.toLocaleString()}`, sub: `${won.length} oportunidades`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Pipeline activo", value: `$${totalActive.toLocaleString()}`, sub: `${active.length} en curso`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Ventas perdidas", value: `$${totalLost.toLocaleString()}`, sub: `${lost.length} oportunidades`, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Seguimientos vencidos", value: overdue.length.toString(), sub: "requieren atención", icon: Clock, color: "text-accent", bg: "bg-accent/10" },
  ];

  const tooltipStyle = {
    background: "hsl(0,0%,100%)",
    border: "1px solid hsl(40,15%,88%)",
    borderRadius: "8px",
    fontSize: 12,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={kpi.label} className={`animate-slide-up stagger-${i + 1} opacity-0 border-border/50`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up stagger-5 opacity-0 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por producto</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByProductData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,15%,88%)" />
                <XAxis type="number" tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Ventas"]} />
                <Bar dataKey="value" fill={BRAND.blue} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-slide-up stagger-6 opacity-0 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por zona</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByLocationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,15%,88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Ventas"]} />
                <Bar dataKey="value" fill={BRAND.gold} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-slide-up opacity-0 border-border/50" style={{ animationDelay: "0.35s" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Conversión por vendedor (%)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,15%,88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversión"]} />
                <Bar dataKey="rate" fill={BRAND.green} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-slide-up opacity-0 border-border/50" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle></CardHeader>
          <CardContent className="h-64">
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} strokeWidth={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {lossData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-slide-up opacity-0 border-border/50" style={{ animationDelay: "0.45s" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución por segmento</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {segmentChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Monto"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
