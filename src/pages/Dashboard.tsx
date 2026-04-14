import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Target, TrendingUp, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";

const COLORS = ["hsl(217,91%,60%)", "hsl(142,76%,36%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(280,70%,50%)", "hsl(180,60%,40%)"];

const STAGE_LABELS: Record<string, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  cotizacion: "Cotización",
  negociacion: "Negociación",
  cerrado_ganado: "Ganado",
  cerrado_perdido: "Perdido",
};

export default function Dashboard() {
  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*, clients(name), products(name)");
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*");
      return data || [];
    },
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const { data } = await supabase.from("interactions").select("*");
      return data || [];
    },
  });

  const active = opportunities.filter((o) => !o.stage.startsWith("cerrado"));
  const won = opportunities.filter((o) => o.stage === "cerrado_ganado");
  const lost = opportunities.filter((o) => o.stage === "cerrado_perdido");
  const conversionRate = opportunities.length > 0 ? Math.round((won.length / opportunities.length) * 100) : 0;
  const totalWon = won.reduce((sum, o) => sum + (o.estimated_amount || 0), 0);

  const overdueFollowups = interactions.filter(
    (i) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  );

  const stageData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    name: label,
    count: opportunities.filter((o) => o.stage === key).length,
  }));

  const lossReasons = lost
    .filter((o) => o.loss_reason)
    .reduce((acc: Record<string, number>, o) => {
      const reason = o.loss_reason || "Sin motivo";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

  const lossData = Object.entries(lossReasons).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oportunidades activas</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{active.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas cerradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">${totalWon.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de conversión</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{conversionRate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seguimientos vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{overdueFollowups.length}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline por etapa</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(220,9%,46%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(220,9%,46%)" }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Motivos de pérdida</CardTitle></CardHeader>
          <CardContent className="h-64">
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {lossData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin datos de pérdidas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
