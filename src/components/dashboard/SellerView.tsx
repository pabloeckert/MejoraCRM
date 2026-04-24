import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Clock, Calendar, ShoppingCart, Plus, AlertCircle,
  ChevronRight, Target,
} from "lucide-react";
import { isBefore, isToday, differenceInDays, startOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { KPICard } from "./KPICard";

const RESULT_LABELS: Record<string, string> = {
  presupuesto: "Envié un presupuesto",
  venta: "Cerré una venta",
  seguimiento: "Hice un seguimiento",
  sin_respuesta: "Sin respuesta",
  no_interesado: "No le interesó",
};

interface SellerViewProps {
  interactions: any[];
  myClients: any[];
  sellerName: string;
  navigate: (path: string) => void;
}

export function SellerView({ interactions, myClients, sellerName, navigate }: SellerViewProps) {
  const monthStart = startOfMonth(new Date());
  const monthInts = interactions.filter((i: any) => new Date(i.interaction_date) >= monthStart);

  const ventas = monthInts.filter((i: any) => i.result === "venta");
  const presupuestos = monthInts.filter((i: any) => i.result === "presupuesto");
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
    { label: "Ventas logradas", value: `$${totalVentas.toLocaleString()}`, sub: `${ventas.length} este mes`, icon: ShoppingCart, color: "text-success", bg: "bg-success/10" },
    { label: "Ventas en curso", value: `$${totalPresup.toLocaleString()}`, sub: `${presupuestos.length} presupuestos`, icon: FileText, color: "text-warning", bg: "bg-warning/10" },
    { label: "Ventas no concretadas", value: `$${totalPerdido.toLocaleString()}`, sub: `${noInteresado.length} rechazos`, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Seguimientos hoy", value: today.length.toString(), sub: `${overdue.length} vencidos`, icon: Calendar, color: today.length > 0 ? "text-accent" : "text-muted-foreground", bg: today.length > 0 ? "bg-accent/20" : "bg-muted" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Hola {sellerName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Tu actividad de {format(monthStart, "MMMM yyyy", { locale: es })}</p>
        </div>
        <Button onClick={() => navigate("/interactions")} className="h-10 px-5 text-sm font-semibold shadow-md">
          <Plus className="h-4 w-4 mr-1.5" /> Registrar interacción
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KPICard key={kpi.label} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Seguimientos del día
            </CardTitle>
            <Badge variant="outline" className="text-xs">{today.length}</Badge>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin seguimientos para hoy 👌</p>
            ) : (
              <div className="space-y-2">
                {today.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => navigate("/interactions")}>
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
              <Clock className="h-4 w-4 text-destructive" /> Seguimientos vencidos
            </CardTitle>
            <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">🎉 Todo al día</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {overdue.slice(0, 6).map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer" onClick={() => navigate("/interactions")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "Pendiente"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">{differenceInDays(new Date(), new Date(i.follow_up_date))}d</Badge>
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
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer" onClick={() => navigate("/interactions")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{format(new Date(i.follow_up_date), "dd MMM", { locale: es })}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Última actividad</CardTitle></CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad reciente</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm truncate"><span className="font-medium">{i.clients?.name}</span></p>
                      <p className="text-xs text-muted-foreground">{RESULT_LABELS[i.result]} · {new Date(i.interaction_date).toLocaleDateString()}</p>
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
