import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ShoppingCart, Clock, AlertCircle, X, Search, LayoutGrid, List } from "lucide-react";
import { isBefore, differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ListSkeleton } from "@/components/skeletons";
import { useInteractionsPaginated } from "@/hooks/useInteractions";

type Result = "presupuesto" | "venta" | "seguimiento" | "sin_respuesta" | "no_interesado";

const COLUMNS: { key: Result; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { key: "presupuesto", label: "Presupuestos", icon: FileText, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  { key: "seguimiento", label: "Seguimientos", icon: Clock, color: "text-accent-foreground", bg: "bg-accent/5", border: "border-accent/20" },
  { key: "venta", label: "Ventas", icon: ShoppingCart, color: "text-success", bg: "bg-success/5", border: "border-success/20" },
  { key: "sin_respuesta", label: "Sin respuesta", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border" },
  { key: "no_interesado", label: "No interesado", icon: X, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const { data: interactions = [], isLoading } = useInteractionsPaginated();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const filtered = useMemo(() => {
    if (!search) return interactions;
    return interactions.filter((i: any) =>
      i.clients?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [interactions, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    COLUMNS.forEach((c) => (groups[c.key] = []));
    filtered.forEach((i: any) => {
      if (groups[i.result]) groups[i.result].push(i);
    });
    // Sort each group by date desc
    Object.values(groups).forEach((arr) =>
      arr.sort((a: any, b: any) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())
    );
    return groups;
  }, [filtered]);

  const totalByColumn = useMemo(() => {
    const totals: Record<string, number> = {};
    COLUMNS.forEach((c) => {
      totals[c.key] = grouped[c.key]?.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0) || 0;
    });
    return totals;
  }, [grouped]);

  if (isLoading) return <ListSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pipeline de ventas</h1>
          <p className="text-sm text-muted-foreground">{interactions.length} interacciones en el pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "kanban" ? "default" : "outline"} size="sm" className="h-9" onClick={() => setView("kanban")}>
            <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" className="h-9" onClick={() => setView("list")}>
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = grouped[col.key] || [];
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className={`rounded-lg border ${col.border} ${col.bg} p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${col.color}`} />
                      <h3 className="text-sm font-semibold">{col.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                      {totalByColumn[col.key] > 0 && (
                        <span className="text-xs font-medium text-muted-foreground">
                          ${totalByColumn[col.key].toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Sin interacciones</p>
                    ) : (
                      items.map((i: any) => (
                        <KanbanCard key={i.id} interaction={i} onClick={() => navigate("/interactions")} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = grouped[col.key] || [];
            if (items.length === 0) return null;
            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${col.color}`} />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  {totalByColumn[col.key] > 0 && (
                    <span className="text-xs text-muted-foreground">${totalByColumn[col.key].toLocaleString()}</span>
                  )}
                </div>
                <div className="space-y-1 mb-4">
                  {items.map((i: any) => (
                    <KanbanCard key={i.id} interaction={i} onClick={() => navigate("/interactions")} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KanbanCard({ interaction: i, onClick }: { interaction: any; onClick: () => void }) {
  const isOverdue = i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date());
  const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date)) : 0;

  return (
    <Card
      className={`cursor-pointer hover:shadow-sm transition-all border-border/50 ${isOverdue ? "border-l-2 border-l-destructive" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{i.clients?.name || "—"}</p>
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] shrink-0 ml-1">{daysOverdue}d</Badge>
          )}
        </div>
        {i.total_amount && (
          <p className="text-xs font-semibold">{i.currency} {Number(i.total_amount).toLocaleString()}</p>
        )}
        {i.interaction_lines?.length > 0 && (
          <p className="text-[10px] text-muted-foreground truncate">
            {i.interaction_lines.map((l: any) => l.products?.name).filter(Boolean).join(", ")}
          </p>
        )}
        {i.next_step && <p className="text-xs text-muted-foreground truncate">→ {i.next_step}</p>}
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(i.interaction_date), "dd MMM", { locale: es })}
          {i.follow_up_date && ` · Seg: ${i.follow_up_date}`}
        </p>
      </CardContent>
    </Card>
  );
}
