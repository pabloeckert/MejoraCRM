import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Target, TrendingUp, AlertCircle, DollarSign, Users, ArrowRight,
  Clock, ChevronRight,
} from "lucide-react";
import { isBefore, format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const BRAND_COLORS = [
  "hsl(222,33%,43%)", // blue
  "hsl(45,74%,60%)",  // gold
  "hsl(2,52%,53%)",   // red
  "hsl(142,60%,40%)", // green
  "hsl(0,0%,40%)",    // gray
  "hsl(280,40%,50%)", // purple
];

const STAGE_LABELS: Record<string, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  cotizacion: "Cotización",
  negociacion: "Negociación",
  cerrado_ganado: "Ganado",
  cerrado_perdido: "Perdido",
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*, clients(name, segment, location), products(name)");
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
      const { data } = await supabase.from("interactions").select("*, clients(name)");
      return data || [];
    },
  });

  const active = opportunities.filter((o: any) => !o.stage.startsWith("cerrado"));
  const won = opportunities.filter((o: any) => o.stage === "cerrado_ganado");
  const lost = opportunities.filter((o: any) => o.stage === "cerrado_perdido");
  const conversionRate = opportunities.length > 0 ? Math.round((won.length / opportunities.length) * 100) : 0;
  const totalWon = won.reduce((sum: number, o: any) => sum + (o.estimated_amount || 0), 0);
  const totalPipeline = active.reduce((sum: number, o: any) => sum + (o.estimated_amount || 0), 0);

  const overdueFollowups = interactions.filter(
    (i: any) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  );

  const stageData = Object.entries(STAGE_LABELS)
    .filter(([key]) => !key.startsWith("cerrado"))
    .map(([key, label]) => ({
      name: label,
      count: opportunities.filter((o: any) => o.stage === key).length,
      amount: opportunities.filter((o: any) => o.stage === key).reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0),
    }));

  const lossReasons = lost
    .filter((o: any) => o.loss_reason)
    .reduce((acc: Record<string, number>, o: any) => {
      const reason = o.loss_reason || "Sin motivo";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
  const lossData = Object.entries(lossReasons).map(([name, value]) => ({ name, value }));

  const leadsNoContact = clients.filter((c: any) => {
    if (c.status !== "lead") return false;
    const clientInts = interactions.filter((i: any) => i.client_id === c.id);
    if (clientInts.length === 0) return true;
    const lastInt = clientInts.sort((a: any, b: any) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())[0];
    return differenceInDays(new Date(), new Date(lastInt.interaction_date)) > 5;
  });

  const kpis = [
    {
      label: "Pipeline activo",
      value: `$${totalPipeline.toLocaleString()}`,
      sub: `${active.length} oportunidades`,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => navigate("/pipeline"),
    },
    {
      label: "Ventas cerradas",
      value: `$${totalWon.toLocaleString()}`,
      sub: `${won.length} ganadas`,
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
      onClick: () => navigate("/reports"),
    },
    {
      label: "Tasa de conversión",
      value: `${conversionRate}%`,
      sub: `${won.length} de ${opportunities.length}`,
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
      onClick: () => navigate("/reports"),
    },
    {
      label: "Seguimientos vencidos",
      value: overdueFollowups.length.toString(),
      sub: leadsNoContact.length > 0 ? `${leadsNoContact.length} leads sin contacto` : "Todo al día",
      icon: AlertCircle,
      color: overdueFollowups.length > 0 ? "text-destructive" : "text-success",
      bg: overdueFollowups.length > 0 ? "bg-destructive/10" : "bg-success/10",
      onClick: () => navigate("/interactions"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card
            key={kpi.label}
            className={`animate-slide-up stagger-${i + 1} opacity-0 cursor-pointer hover:shadow-md transition-all duration-200 group border-border/50`}
            onClick={kpi.onClick}
          >
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
              <div className="mt-3 flex items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver detalle</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline chart */}
        <Card className="lg:col-span-2 animate-slide-up stagger-5 opacity-0 border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Pipeline por etapa</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/pipeline")}>
              Ver pipeline <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,15%,88%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0,0%,40%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0,0%,100%)",
                    border: "1px solid hsl(40,15%,88%)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    name === "amount" ? `$${value.toLocaleString()}` : value,
                    name === "amount" ? "Monto" : "Cantidad",
                  ]}
                />
                <Bar dataKey="count" fill="hsl(222,33%,43%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Loss reasons */}
        <Card className="animate-slide-up stagger-6 opacity-0 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lossData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    strokeWidth={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {lossData.map((_, i) => (
                      <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
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

      {/* Alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue follow-ups */}
        <Card className="animate-slide-up opacity-0 border-border/50" style={{ animationDelay: "0.35s" }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Seguimientos vencidos
            </CardTitle>
            <Badge variant="destructive" className="text-xs">{overdueFollowups.length}</Badge>
          </CardHeader>
          <CardContent>
            {overdueFollowups.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdueFollowups.slice(0, 5).map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors"
                    onClick={() => navigate("/interactions")}
                  >
                    <div>
                      <p className="text-sm font-medium">{i.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">{i.next_step || "Sin paso siguiente"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                      {differenceInDays(new Date(), new Date(i.follow_up_date))}d vencido
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">🎉 No hay seguimientos vencidos</p>
            )}
          </CardContent>
        </Card>

        {/* Leads sin contacto */}
        <Card className="animate-slide-up opacity-0 border-border/50" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Leads sin contacto reciente
            </CardTitle>
            <Badge className="text-xs bg-accent text-accent-foreground">{leadsNoContact.length}</Badge>
          </CardHeader>
          <CardContent>
            {leadsNoContact.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leadsNoContact.slice(0, 5).map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => navigate("/clients")}
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company || c.segment || "—"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">✅ Todos los leads están contactados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
