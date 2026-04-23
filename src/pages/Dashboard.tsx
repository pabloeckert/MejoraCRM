import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, FileText, Clock, Users, Trophy, AlertCircle,
  ChevronRight, Target, Calendar, ShoppingCart, Plus,
} from "lucide-react";
import { isBefore, isToday, differenceInDays, startOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "hsl(214,58%,41%)",
  "hsl(45,74%,60%)",
  "hsl(142,60%,40%)",
  "hsl(2,52%,53%)",
  "hsl(280,40%,50%)",
  "hsl(0,0%,40%)",
];

const RESULT_LABELS: Record<string, string> = {
  presupuesto: "Envié un presupuesto",
  venta: "Cerré una venta",
  seguimiento: "Hice un seguimiento",
  sin_respuesta: "Sin respuesta",
  no_interesado: "No le interesó",
};

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const navigate = useNavigate();

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions", "dashboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("interactions")
        .select("*, clients(name), interaction_lines(quantity, unit_price, line_total, products(name, unit_label))")
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "dashboard"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*");
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

  const isOwner = role === "admin" || role === "supervisor";

  if (isOwner) {
    return <OwnerView interactions={interactions} clients={clients} profiles={profiles} navigate={navigate} />;
  }
  return (
    <SellerView
      interactions={interactions.filter((i: any) => i.user_id === user?.id)}
      myClients={clients.filter((c: any) => c.assigned_to === user?.id)}
      sellerName={profile?.full_name || "Vendedor"}
      navigate={navigate}
    />
  );
}

/* ============================================================
 *                     OWNER VIEW (Dueño)
 * ============================================================ */

function OwnerView({ interactions, clients, profiles, navigate }: any) {
  const [period, setPeriod] = useState("mes");
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p.full_name || "Sin nombre"]));

  // Calcular fecha de inicio según período seleccionado
  const now = new Date();
  let periodStart: Date;
  let periodLabel: string;
  switch (period) {
    case "hoy":
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodLabel = "Hoy";
      break;
    case "semana":
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodLabel = "Últimos 7 días";
      break;
    case "trimestre":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      periodLabel = "Último trimestre";
      break;
    case "semestre":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      periodLabel = "Último semestre";
      break;
    case "año":
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodLabel = format(now, "yyyy");
      break;
    default: // mes
      periodStart = startOfMonth(now);
      periodLabel = format(startOfMonth(now), "MMMM yyyy", { locale: es });
  }

  const periodInts = interactions.filter((i: any) => new Date(i.interaction_date) >= periodStart);
  const ventas = periodInts.filter((i: any) => i.result === "venta");
  const presupuestos = periodInts.filter((i: any) => i.result === "presupuesto");
  const seguimientos = periodInts.filter((i: any) => i.result === "seguimiento");
  const noInteresado = periodInts.filter((i: any) => i.result === "no_interesado");

  const totalVentas = ventas.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalPresup = presupuestos.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const conversion = presupuestos.length > 0 ? Math.round((ventas.length / presupuestos.length) * 100) : 0;

  const overdue = interactions.filter(
    (i: any) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  );

  // Result distribution
  const resultData = Object.entries(
    periodInts.reduce((acc: Record<string, number>, i: any) => {
      acc[i.result] = (acc[i.result] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: RESULT_LABELS[name] || name, value: value as number }));

  // Seller ranking (this month)
  const sellerStats: Record<string, { ventas: number; presup: number; segs: number; ingresos: number }> = {};
  periodInts.forEach((i: any) => {
    const key = i.user_id;
    if (!sellerStats[key]) sellerStats[key] = { ventas: 0, presup: 0, segs: 0, ingresos: 0 };
    if (i.result === "venta") {
      sellerStats[key].ventas++;
      sellerStats[key].ingresos += Number(i.total_amount) || 0;
    }
    if (i.result === "presupuesto") sellerStats[key].presup++;
    if (i.result === "seguimiento") sellerStats[key].segs++;
  });
  const ranking = Object.entries(sellerStats)
    .map(([uid, v]) => ({ name: profileMap[uid] || "—", ...v }))
    .sort((a, b) => b.ingresos - a.ingresos);

  // Inactive sellers (>3 días sin actividad)
  const lastSellerActivity: Record<string, Date> = {};
  interactions.forEach((i: any) => {
    const d = new Date(i.interaction_date);
    if (!lastSellerActivity[i.user_id] || d > lastSellerActivity[i.user_id]) {
      lastSellerActivity[i.user_id] = d;
    }
  });
  const inactiveSellers = profiles.filter((p: any) => {
    const last = lastSellerActivity[p.user_id];
    return !last || differenceInDays(new Date(), last) > 3;
  });

  // Lost amount (no_interesado month)
  const lostAmount = noInteresado.reduce((s: number, i: any) => s + (Number(i.estimated_loss) || 0), 0);

  // Ventas no concretadas
  const totalPerdido = noInteresado.reduce((s: number, i: any) => s + (Number(i.estimated_loss) || 0), 0);

  const kpis = [
    {
      label: "Ventas logradas",
      value: `$${totalVentas.toLocaleString()}`,
      sub: `${ventas.length} ventas`,
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
      onClick: () => navigate("/interactions"),
    },
    {
      label: "Ventas en curso",
      value: `$${totalPresup.toLocaleString()}`,
      sub: `${presupuestos.length} presupuestos`,
      icon: FileText,
      color: "text-warning",
      bg: "bg-warning/10",
      onClick: () => navigate("/interactions"),
    },
    {
      label: "Ventas no concretadas",
      value: `$${totalPerdido.toLocaleString()}`,
      sub: `${noInteresado.length} rechazos`,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      onClick: () => navigate("/interactions"),
    },
    {
      label: "Éxito de ventas",
      value: `${conversion}%`,
      sub: `${ventas.length} de ${presupuestos.length}`,
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/20",
      onClick: () => navigate("/interactions"),
    },
    {
      label: "Contactos sin seguimiento",
      value: overdue.length.toString(),
      sub: lostAmount > 0 ? `$${lostAmount.toLocaleString()} perdidos` : "todo al día",
      icon: Clock,
      color: overdue.length > 0 ? "text-destructive" : "text-success",
      bg: overdue.length > 0 ? "bg-destructive/10" : "bg-success/10",
      onClick: () => navigate("/interactions"),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Vista General · Dueño</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de {periodLabel}
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            { key: "hoy", label: "Hoy" },
            { key: "semana", label: "Semana" },
            { key: "mes", label: "Mes" },
            { key: "trimestre", label: "Trimestre" },
            { key: "semestre", label: "Semestre" },
            { key: "año", label: "Año" },
          ].map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              Ranking de vendedores · {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin actividad este mes</p>
            ) : (
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={i === 0 ? "default" : "secondary"} className="shrink-0 w-6 h-6 p-0 justify-center">
                        {i + 1}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.ventas} ventas · {r.presup} presup · {r.segs} seg
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums">${r.ingresos.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución de resultados</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {resultData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={36}
                    strokeWidth={2}
                  >
                    {resultData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Sin datos este mes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Seguimientos vencidos
            </CardTitle>
            <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
          </CardHeader>
          <CardContent>
            {overdue.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {overdue.slice(0, 6).map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer"
                    onClick={() => navigate("/interactions")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profileMap[i.user_id] || ""} · {i.next_step || "Pendiente"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">
                      {differenceInDays(new Date(), new Date(i.follow_up_date))}d
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">🎉 No hay seguimientos vencidos</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Vendedores sin actividad reciente
            </CardTitle>
            <Badge className="text-xs bg-accent text-accent-foreground">{inactiveSellers.length}</Badge>
          </CardHeader>
          <CardContent>
            {inactiveSellers.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inactiveSellers.map((p: any) => {
                  const last = lastSellerActivity[p.user_id];
                  return (
                    <div key={p.user_id} className="p-2.5 rounded-lg bg-accent/5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.full_name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">
                          {last
                            ? `Última: ${format(last, "dd MMM", { locale: es })}`
                            : "Sin actividad"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                ✅ Todos los vendedores activos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloque 3: Análisis y Estrategia */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Análisis y Estrategia
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motivos de pérdida */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {(() => {
                const lossData = Object.entries(
                  noInteresado.reduce((acc: Record<string, number>, i: any) => {
                    const reason = i.loss_reason || "Sin especificar";
                    acc[reason] = (acc[reason] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value: value as number }));
                return lossData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>
                        {lossData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RTooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sin rechazos en el período
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Ventas por producto */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ventas por producto</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {(() => {
                const productSales: Record<string, number> = {};
                ventas.forEach((v: any) => {
                  if (v.interaction_lines) {
                    v.interaction_lines.forEach((l: any) => {
                      const name = l.products?.name || "Sin nombre";
                      productSales[name] = (productSales[name] || 0) + (l.line_total || l.quantity * l.unit_price || 0);
                    });
                  }
                });
                const productData = Object.entries(productSales)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6);
                return productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} />
                      <YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} />
                      <RTooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                      <Bar dataKey="value" fill="hsl(214,58%,41%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sin ventas con productos en el período
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Ventas por zona */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ventas por zona</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {(() => {
                const clientMap = Object.fromEntries(clients.map((c: any) => [c.id, c]));
                const zoneSales: Record<string, number> = {};
                ventas.forEach((v: any) => {
                  const prov = clientMap[v.client_id]?.province || "Sin provincia";
                  zoneSales[prov] = (zoneSales[prov] || 0) + (Number(v.total_amount) || 0);
                });
                const zoneData = Object.entries(zoneSales)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6);
                return zoneData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} />
                      <YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} />
                      <RTooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                      <Bar dataKey="value" fill="hsl(142,60%,40%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sin ventas por zona en el período
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Distribución por rubro */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribución por rubro</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {(() => {
                const clientMap = Object.fromEntries(clients.map((c: any) => [c.id, c]));
                const rubroSales: Record<string, number> = {};
                ventas.forEach((v: any) => {
                  const rubro = clientMap[v.client_id]?.segment || "Sin rubro";
                  rubroSales[rubro] = (rubroSales[rubro] || 0) + (Number(v.total_amount) || 0);
                });
                const rubroData = Object.entries(rubroSales)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value);
                return rubroData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rubroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>
                        {rubroData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Sin ventas por rubro en el período
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

function SellerView({ interactions, myClients, sellerName, navigate }: any) {
  const monthStart = startOfMonth(new Date());
  const monthInts = interactions.filter((i: any) => new Date(i.interaction_date) >= monthStart);

  const ventas = monthInts.filter((i: any) => i.result === "venta");
  const presupuestos = monthInts.filter((i: any) => i.result === "presupuesto");
  const seguimientos = monthInts.filter((i: any) => i.result === "seguimiento");
  const noInteresado = monthInts.filter((i: any) => i.result === "no_interesado");

  const totalVentas = ventas.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalPresup = presupuestos.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalPerdido = noInteresado.reduce((s: number, i: any) => s + (Number(i.estimated_loss) || 0), 0);

  const today = interactions.filter((i: any) => i.follow_up_date && isToday(new Date(i.follow_up_date)));
  const overdue = interactions.filter(
    (i: any) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date()) && !isToday(new Date(i.follow_up_date))
  );
  const upcoming = interactions
    .filter((i: any) => i.follow_up_date && new Date(i.follow_up_date) > new Date())
    .sort((a: any, b: any) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime())
    .slice(0, 5);

  const recentActivity = interactions.slice(0, 6);

  // Mensaje motivacional según actividad del día (v2)
  const todayInteractions = interactions.filter((i: any) => isToday(new Date(i.interaction_date)));
  let motivationalMsg = "";
  if (todayInteractions.length === 0 && today.length > 0) {
    motivationalMsg = `Tenés ${today.length} seguimiento${today.length > 1 ? "s" : ""} para hoy. ¡Empecemos!`;
  } else if (todayInteractions.length > 0 && today.length === 0) {
    motivationalMsg = "Ya registraste tus interacciones del día 👏";
  } else if (overdue.length > 0) {
    motivationalMsg = `Hay ${overdue.length} seguimiento${overdue.length > 1 ? "s" : ""} vencido${overdue.length > 1 ? "s" : ""}. ¿Los revisamos?`;
  } else if (ventas.some((v: any) => isToday(new Date(v.interaction_date)))) {
    motivationalMsg = "¡Venta registrada hoy! Buen trabajo 💪";
  } else if (monthInts.length > 10) {
    motivationalMsg = "Buen ritmo este mes. ¡Seguí así! 👍";
  }

  const kpis = [
    {
      label: "Ventas logradas",
      value: `$${totalVentas.toLocaleString()}`,
      sub: `${ventas.length} este mes`,
      icon: ShoppingCart,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Ventas en curso",
      value: `$${totalPresup.toLocaleString()}`,
      sub: `${presupuestos.length} presupuestos`,
      icon: FileText,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Ventas no concretadas",
      value: `$${totalPerdido.toLocaleString()}`,
      sub: `${noInteresado.length} rechazos`,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Seguimientos hoy",
      value: today.length.toString(),
      sub: `${overdue.length} vencidos`,
      icon: Calendar,
      color: today.length > 0 ? "text-accent" : "text-muted-foreground",
      bg: today.length > 0 ? "bg-accent/20" : "bg-muted",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Hola {sellerName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Tu actividad de {format(monthStart, "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button onClick={() => navigate("/interactions")} className="h-10 px-5 text-sm font-semibold shadow-md">
          <Plus className="h-4 w-4 mr-1.5" />
          Registrar interacción
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card
            key={kpi.label}
            className={`animate-slide-up stagger-${i + 1} opacity-0 hover:shadow-md transition-all border-border/50`}
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Seguimientos del día
            </CardTitle>
            <Badge variant="outline" className="text-xs">{today.length}</Badge>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin seguimientos para hoy 👌</p>
            ) : (
              <div className="space-y-2">
                {today.map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => navigate("/interactions")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "—"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Seguimientos vencidos
            </CardTitle>
            <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">🎉 Todo al día</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {overdue.slice(0, 6).map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer"
                    onClick={() => navigate("/interactions")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "Pendiente"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">
                      {differenceInDays(new Date(), new Date(i.follow_up_date))}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Próximos seguimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin seguimientos programados</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate("/interactions")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(i.follow_up_date), "dd MMM", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Última actividad</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad reciente</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{i.clients?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {RESULT_LABELS[i.result]} · {new Date(i.interaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {motivationalMsg && (
        <Card className="border-border/50 bg-primary/5 border-primary/10">
          <CardContent className="py-4 px-5 flex items-center gap-3">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary">{motivationalMsg}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
