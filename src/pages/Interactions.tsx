import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MessageCircle } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { ListSkeleton } from "@/components/skeletons";
import { useInteractionsPaginated } from "@/hooks/useInteractions";
import { useClientsMinimal } from "@/hooks/useClients";
import { useActiveProducts } from "@/hooks/useProducts";
import { useClientPresupuestos } from "@/hooks/useInteractions";
import { InteractionCard, InteractionForm, RESULT_LABELS, type Result } from "@/components/interactions";

export default function Interactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [formClientId, setFormClientId] = useState<string | undefined>();
  const [formResult, setFormResult] = useState<string | undefined>();

  const { data: interactions = [], isLoading } = useInteractionsPaginated();
  const { data: clients = [] } = useClientsMinimal();
  const { data: products = [] } = useActiveProducts();
  const { data: presupuestos = [] } = useClientPresupuestos(
    formClientId && (formResult === "venta" || formResult === "seguimiento") ? formClientId : undefined
  );

  if (isLoading) return <ListSkeleton />;

  const filtered = interactions.filter((i: any) => {
    const matchSearch = !search || i.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === "all" || i.result === resultFilter;
    return matchSearch && matchResult;
  });

  const overdueCount = interactions.filter((i: any) => i.follow_up_date && new Date(i.follow_up_date) < new Date()).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Interacciones</h1>
          <p className="text-sm text-muted-foreground">
            {interactions.length} registros
            {overdueCount > 0 && <span className="text-destructive ml-2 font-medium">• {overdueCount} seguimientos vencidos</span>}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Nueva interacción
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Resultados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los resultados</SelectItem>
            {Constants.public.Enums.interaction_result.map((r) => (
              <SelectItem key={r} value={r}>{RESULT_LABELS[r as Result]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((i: any, idx: number) => (
          <InteractionCard key={i.id} interaction={i} index={idx} onNavigate={navigate} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin interacciones encontradas</p>
          </div>
        )}
      </div>

      <InteractionForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        products={products}
        presupuestos={presupuestos}
      />
    </div>
  );
}
