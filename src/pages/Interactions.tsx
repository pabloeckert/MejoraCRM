import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MessageCircle, Globe, Video, AlertCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { isBefore, differenceInDays } from "date-fns";

const MEDIUM_LABELS: Record<string, string> = { whatsapp: "WhatsApp", email: "Email", llamada: "Llamada", redes: "Redes", reunion: "Reunión" };
const TYPE_LABELS: Record<string, string> = { consulta: "Consulta", cotizacion: "Cotización", seguimiento: "Seguimiento", cierre: "Cierre" };
const RESULT_LABELS: Record<string, string> = { interes: "Interés", venta: "Venta", sin_respuesta: "Sin respuesta", rechazo: "Rechazo" };

const MEDIUM_ICONS: Record<string, any> = {
  whatsapp: MessageCircle,
  email: Mail,
  llamada: Phone,
  redes: Globe,
  reunion: Video,
};

const RESULT_STYLES: Record<string, string> = {
  interes: "bg-primary/10 text-primary border-primary/20",
  venta: "bg-success/10 text-success border-success/20",
  sin_respuesta: "bg-muted text-muted-foreground border-border",
  rechazo: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Interactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("interactions")
        .select("*, clients(name), products(name)")
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("active", true).order("name");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (interaction: any) => {
      const { error } = await supabase.from("interactions").insert(interaction);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setDialogOpen(false);
      setForm({});
      toast.success("Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.client_id || !form.medium || !form.type) return toast.error("Completa los campos obligatorios");
    createMutation.mutate({
      ...form,
      user_id: user?.id,
      product_id: form.product_id || null,
      result: form.result || null,
      follow_up_date: form.follow_up_date || null,
    });
  };

  const filtered = interactions.filter((i: any) => {
    const matchSearch = !search || i.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || i.type === typeFilter;
    const matchResult = resultFilter === "all" || i.result === resultFilter;
    return matchSearch && matchType && matchResult;
  });

  const overdueCount = interactions.filter(
    (i: any) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Interacciones</h1>
          <p className="text-sm text-muted-foreground">
            {interactions.length} registros
            {overdueCount > 0 && (
              <span className="text-destructive ml-2 font-medium">• {overdueCount} seguimientos vencidos</span>
            )}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({})} className="h-9">
              <Plus className="h-4 w-4 mr-1" />Nueva interacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar interacción</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Medio *</Label>
                  <Select value={form.medium || ""} onValueChange={(v) => setForm({ ...form, medium: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.interaction_medium.map((m) => (
                        <SelectItem key={m} value={m}>{MEDIUM_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.type || ""} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.interaction_type.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Producto</Label>
                <Select value={form.product_id || ""} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={form.result || ""} onValueChange={(v) => setForm({ ...form, result: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.interaction_result.map((r) => (
                      <SelectItem key={r} value={r}>{RESULT_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Próximo paso</Label><Input value={form.next_step || ""} onChange={(e) => setForm({ ...form, next_step: e.target.value })} placeholder="Ej: Llamar para confirmar" /></div>
              <div><Label>Fecha de seguimiento</Label><Input type="date" value={form.follow_up_date || ""} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
              <div><Label>Observaciones</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Registrar interacción</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Constants.public.Enums.interaction_type.map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Resultado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Constants.public.Enums.interaction_result.map((r) => (
              <SelectItem key={r} value={r}>{RESULT_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interaction list */}
      <div className="space-y-2">
        {filtered.map((i: any, idx: number) => {
          const MediumIcon = MEDIUM_ICONS[i.medium] || MessageCircle;
          const isOverdue = i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date());
          const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date)) : 0;

          return (
            <Card
              key={i.id}
              className={`border-border/50 hover:shadow-sm transition-all duration-200 animate-fade-in ${
                isOverdue ? "border-l-2 border-l-destructive" : ""
              }`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${isOverdue ? "bg-destructive/10" : "bg-primary/10"}`}>
                    <MediumIcon className={`h-4 w-4 ${isOverdue ? "text-destructive" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate("/clients")}
                      >
                        {i.clients?.name}
                      </span>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[i.type]}</Badge>
                      {i.result && (
                        <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result] || ""}`}>
                          {RESULT_LABELS[i.result]}
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />{daysOverdue}d vencido
                        </Badge>
                      )}
                    </div>
                    {i.products?.name && <p className="text-xs text-muted-foreground mt-0.5">Producto: {i.products.name}</p>}
                    {i.next_step && <p className="text-sm mt-1">→ {i.next_step}</p>}
                    {i.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(i.interaction_date).toLocaleDateString()}</p>
                    {i.follow_up_date && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        Seg: {i.follow_up_date}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin interacciones encontradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
