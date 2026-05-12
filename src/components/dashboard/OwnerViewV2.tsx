import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Clock, Users, Trophy, AlertCircle,
  ChevronRight, UserPlus, UserCheck, BarChart3,
} from "lucide-react";
import { isBefore, differenceInDays, startOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { KPICard } from "./KPICard";
import { RESULT_LABELS, CHART_COLORS } from "@/lib/constants";
import type { Interaction, Client, Profile } from "@/lib/types";

interface OwnerViewV2Props {
  interactions: Interaction[];
  clients: Client[];
  profiles: Profile[];
  navigate: (path: string) => void;
}

export function OwnerViewV2({ interactions, clients, profiles, navigate }: OwnerViewV2Props) {
  const [period, setPeriod] = useState("mes");
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.full_name || "Sin nombre"]));

  const now = new Date();
  let periodStart: Date;
  let prevPeriodStart: Date;
  let periodLabel: string;

  switch (period) {
    case "hoy":
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      periodLabel = "Hoy";
      break;
    case "semana":
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      periodLabel = "Últimos 7 días";
      break;
    case "trimestre":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      periodLabel = "Último trimestre";
      break;
    case "semestre":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      periodLabel = "Último semestre";
      break;
    case "año":
      periodStart = new Date(now.getFullYear(), 0, 1);
      prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
      periodLabel = format(now, "yyyy");
      break;
    default:
      periodStart = startOfMonth(now);
      prevPeriodStart = startOfMonth(subMonths(now, 1));
      periodLabel = format(startOfMonth(now), "MMMM yyyy", { locale: es });
  }

  const periodInts = interactions.filter((i: Interaction) => new Date(i.interaction_date) >= periodStart);
  const prevInts = interactions.filter((i: Interaction) => {
    const d = new Date(i.interaction_date);
    return d >= prevPeriodStart && d < periodStart;
  });

  const ventas = periodInts.filter((i: Interaction) => i.result === "venta");
  const presupuestos = periodInts.filter((i: Interaction) => i.result === "presupuesto");
  const noInteresado = periodInts.filter((i: Interaction) => i.result === "no_interesado");
  const seguimientos = periodInts.filter((i: Interaction) => i.result === "seguimiento");

  const totalVentas = ventas.reduce((s: number, i: Interaction) => s + (Number(i.total_amount) || 0), 0);
  const totalPresup = presupuestos.reduce((s: number, i: Interaction) => s + (Number(i.total_amount) || 0), 0);
  const totalPerdido = noInteresado.reduce((s: number, i: Interaction) => s + (Number(i.estimated_loss) || 0), 0);
  const conversion = presupuestos.length > 0 ? Math.round((ventas.length / presupuestos.length) * 100) : 0;

  // --- Tendencias (vs período anterior) ---
  const prevVentas = prevInts.filter((i: Interaction) => i.result === "venta");
  const prevTotalVentas = prevVentas.reduce((s: number, i: Interaction) => s + (Number(i.total_amount) || 0), 0);
  const prevPresup = prevInts.filter((i: Interaction) => i.result === "presupuesto");
  const prevPerdido = prevInts.filter((i: Interaction) => i.result === "no_interesado");
  const prevTotalPerdido = prevPerdido.reduce((s: number, i: Interaction) => s + (Number(i.estimated_loss) || 0), 0);

  const trendVentas = prevTotalVentas > 0 ? Math.round(((totalVentas - prevTotalVentas) / prevTotalVentas) * 100) : totalVentas > 0 ? 100 : 0;
  const trendPresup = prevPresup.length > 0 ? Math.round(((presupuestos.length - prevPresup.length) / prevPresup.length) * 100) : presupuestos.length > 0 ? 100 : 0;
  const trendPerdido = prevTotalPerdido > 0 ? Math.round(((totalPerdido - prevTotalPerdido) / prevTotalPerdido) * 100) : totalPerdido > 0 ? 100 : 0;

  // --- Seguimientos vencidos ---
  const overdue = interactions.filter(
    (i) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  );

  // --- Contactos nuevos (clientes creados en el período) ---
  const contactosNuevos = clients.filter((c) => c.created_at && new Date(c.created_at) >= periodStart).length;

  // --- Contactos atendidos (clientes con al menos 1 interacción en el período) ---
  const clientesAtendidos = new Set(periodInts.map((i) => i.client_id)).size;

  // --- Contactos sin seguimiento (clientes sin interacciones en el período) ---
  const clientesConActividad = new Set(interactions.filter((i) => new Date(i.interaction_date) >= periodStart).map((i) => i.client_id));
  const contactosSinSeguimiento = clients.filter((c) => !clientesConActividad.has(c.id)).length;

  // --- Ranking vendedores ---
  const sellerStats: Record<string, { ventas: number; presup: number; segs: number; ingresos: number }> = {};
  periodInts.forEach((i: Interaction) => {
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

  // --- Tiempo hasta cerrar (días promedio de presupuesto → venta) ---
  const ventaWithQuote = ventas.filter((v) => v.reference_quote_id);
  const avgDiasCierre = ventaWithQuote.length > 0
    ? Math.round(
        ventaWithQuote.reduce((s: number, v: any) => {
          const quote = interactions.find((q: any) => q.id === v.reference_quote_id);
          if (!quote) return s;
          return s + differenceInDays(new Date(v.interaction_date), new Date(quote.interaction_date));
        }, 0) / ventaWithQuote.length
      )
    : 0;

  // --- Motivos de pérdida ---
  const lossData = Object.entries(
    noInteresado.reduce((acc: Record<string, number>, i: any) => {
      const r = i.loss_reason || "Sin especificar";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  // --- Valor promedio de venta ---
  const valorPromedioVenta = ventas.length > 0 ? Math.round(totalVentas / ventas.length) : 0;

  // --- Ventas por producto ---
  const productSales: Record<string, number> = {};
  ventas.forEach((v) => {
    if (v.interaction_lines) v.interaction_lines.forEach((l) => {
      const name = l.products?.name || "Sin nombre";
      productSales[name] = (productSales[name] || 0) + (l.line_total || l.quantity * l.unit_price || 0);
    });
  });
  const productData = Object.entries(productSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // --- Ventas por zona ---
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const zoneSales: Record<string, number> = {};
  ventas.forEach((v) => {
    const prov = clientMap[v.client_id]?.province || "Sin provincia";
    zoneSales[prov] = (zoneSales[prov] || 0) + (Number(v.total_amount) || 0);
  });
  const zoneData = Object.entries(zoneSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // --- Distribución por rubro ---
  const rubroSales: Record<string, number> = {};
  ventas.forEach((v) => {
    const rubro = clientMap[v.client_id]?.segment || "Sin rubro";
    rubroSales[rubro] = (rubroSales[rubro] || 0) + (Number(v.total_amount) || 0);
  });
  const rubroData = Object.entries(rubroSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // --- Result distribution for pie ---
  const resultData = Object.entries(
    periodInts.reduce((acc: Record<string, number>, i: any) => {
      acc[i.result] = (acc[i.result] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: RESULT_LABELS[name] || name, value: value as number }));

  // --- Trend icon helper ---
  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return null;
  };

  const TrendBadge = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const sign = value > 0 ? "+" : "";
    return (
      <span className={`text-[10px] font-semibold ${value > 0 ? "text-success" : "text-destructive"}`}>
        {sign}{value}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Vista general · Dueño</h1>
          <p className="text-sm text-muted-foreground">Resumen de {periodLabel}</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {[{ key: "hoy", label: "Hoy" }, { key: "semana", label: "Semana" }, { key: "mes", label: "Mes" }, { key: "trimestre", label: "Trimestre" }, { key: "semestre", label: "Semestre" }, { key: "año", label: "Año" }].map((p) => (
            <Button key={p.key} variant={period === p.key ? "default" : "outline"} size="sm" className="h-8 text-xs px-3" onClick={() => setPeriod(p.key)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          BLOQUE 1: Resultados Directos
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Resultados directos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-slide-up stagger-1 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas logradas</p>
                  <p className="text-2xl font-bold tracking-tight text-success">${totalVentas.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{ventas.length} ventas</p>
                    <TrendBadge value={trendVentas} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-2 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas en curso</p>
                  <p className="text-2xl font-bold tracking-tight text-warning">${totalPresup.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{presupuestos.length} presupuestos</p>
                    <TrendBadge value={trendPresup} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-3 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas no concretadas</p>
                  <p className="text-2xl font-bold tracking-tight text-destructive">${totalPerdido.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{noInteresado.length} rechazos</p>
                    <TrendBadge value={trendPerdido} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-4 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Éxito de ventas</p>
                  <p className="text-2xl font-bold tracking-tight text-accent">{conversion}%</p>
                  <p className="text-xs text-muted-foreground">{ventas.length} de {presupuestos.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-accent/20">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          BLOQUE 2: Gestión Comercial + Rendimiento del Equipo
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Gestión comercial y rendimiento del equipo
        </h2>

        {/* Sub-KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Clock className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-lg font-bold">{overdue.length}</p>
                  <p className="text-xs text-muted-foreground">Seguimientos vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{contactosNuevos}</p>
                  <p className="text-xs text-muted-foreground">Contactos nuevos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold">{clientesAtendidos}</p>
                  <p className="text-xs text-muted-foreground">Contactos atendidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-bold">{contactosSinSeguimiento}</p>
                  <p className="text-xs text-muted-foreground">Contactos sin seguimiento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid: Ranking + Éxito + Tiempo cierre */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranking vendedores */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                Ranking de vendedores · {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin actividad en el período</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((r, i) => (
                    <div key={r.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant={i === 0 ? "default" : "secondary"} className="shrink-0 w-6 h-6 p-0 justify-center">{i + 1}</Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.ventas} ventas · {r.presup} presupuestos · {r.segs} seguimientos</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold tabular-nums">${r.ingresos.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Éxito de ventas + Tiempo hasta cerrar */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Éxito de ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-accent">{conversion}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{ventas.length} ventas de {presupuestos.length} presupuestos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Tiempo hasta cerrar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-primary">{avgDiasCierre > 0 ? avgDiasCierre : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{avgDiasCierre > 0 ? "días promedio" : "Sin datos de ciclo"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seguimientos vencidos list */}
        {overdue.length > 0 && (
          <Card className="border-border/50 mt-6">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" /> Seguimientos vencidos
              </CardTitle>
              <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdue.slice(0, 8).map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer" onClick={() => navigate("/interactions")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profileMap[i.user_id] || ""} · {i.next_step || "Pendiente"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">{differenceInDays(new Date(), new Date(i.follow_up_date))}d</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ──────────────────────────────────────────────
          BLOQUE 3: Análisis y Estrategia
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Análisis y estrategia
        </h2>

        {/* KPI resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor promedio de venta</p>
              <p className="text-xl font-bold mt-1">${valorPromedioVenta.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total ventas en período</p>
              <p className="text-xl font-bold mt-1">{ventas.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total interacciones</p>
              <p className="text-xl font-bold mt-1">{periodInts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motivos de pérdida */}
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle></CardHeader>
            <CardContent className="h-64">
              {lossData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>{lossData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RTooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin rechazos en el período</div>}
            </CardContent>
          </Card>

          {/* Ventas por producto */}
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por producto</CardTitle></CardHeader>
            <CardContent className="h-64">
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={productData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} /><YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} /><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Bar dataKey="value" fill="hsl(325,50%,36%)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas con productos</div>}
            </CardContent>
          </Card>

          {/* Ventas por zona */}
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por zona</CardTitle></CardHeader>
            <CardContent className="h-64">
              {zoneData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={zoneData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} /><YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} /><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Bar dataKey="value" fill="hsl(142,60%,40%)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas por zona</div>}
            </CardContent>
          </Card>

          {/* Distribución por rubro */}
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución por rubro</CardTitle></CardHeader>
            <CardContent className="h-64">
              {rubroData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rubroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>{rubroData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas por rubro</div>}
            </CardContent>
          </Card>
        </div>

        {/* Distribución de resultados */}
        <Card className="border-border/50 mt-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución de resultados</CardTitle></CardHeader>
          <CardContent className="h-64">
            {resultData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resultData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>
                    {resultData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <RTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos en el período</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
