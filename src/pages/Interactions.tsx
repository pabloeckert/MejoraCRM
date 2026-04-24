import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Phone, Mail, MessageCircle, Globe, Video, AlertCircle,
  FileText, ShoppingCart, Clock, X, Trash2, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { isBefore, differenceInDays } from "date-fns";
import { ListSkeleton } from "@/components/skeletons";
import { useInteractionsPaginated } from "@/hooks/useInteractions";
import { useClientsMinimal } from "@/hooks/useClients";
import { useActiveProducts } from "@/hooks/useProducts";
import { useClientPresupuestos } from "@/hooks/useInteractions";

type Result = "presupuesto" | "venta" | "seguimiento" | "sin_respuesta" | "no_interesado";
type Medium = (typeof Constants.public.Enums.interaction_medium)[number];

const MEDIUM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  email: "Email",
  reunion_presencial: "Reunión presencial",
  reunion_virtual: "Reunión virtual",
  md_instagram: "MD Instagram",
  md_facebook: "MD Facebook",
  md_linkedin: "MD LinkedIn",
  visita_campo: "Visita a campo",
};

const MEDIUM_ICONS: Record<string, any> = {
  whatsapp: MessageCircle,
  llamada: Phone,
  email: Mail,
  reunion_presencial: Video,
  reunion_virtual: Video,
  md_instagram: Globe,
  md_facebook: Globe,
  md_linkedin: Globe,
  visita_campo: Globe,
};

const RESULT_LABELS: Record<Result, string> = {
  presupuesto: "Envié un presupuesto",
  venta: "Cerré una venta",
  seguimiento: "Hice un seguimiento",
  sin_respuesta: "Sin respuesta",
  no_interesado: "No le interesó",
};

const RESULT_STYLES: Record<Result, string> = {
  presupuesto: "bg-primary/10 text-primary border-primary/20",
  venta: "bg-success/10 text-success border-success/20",
  seguimiento: "bg-accent/20 text-accent-foreground border-accent/30",
  sin_respuesta: "bg-muted text-muted-foreground border-border",
  no_interesado: "bg-destructive/10 text-destructive border-destructive/20",
};

const RESULT_ICONS: Record<Result, any> = {
  presupuesto: FileText,
  venta: ShoppingCart,
  seguimiento: Clock,
  sin_respuesta: AlertCircle,
  no_interesado: X,
};

const NEGOTIATION_LABELS: Record<string, string> = {
  con_interes: "Con interés",
  sin_respuesta: "Sin respuesta",
  revisando: "Está revisando",
  pidio_cambios: "Pidió cambios",
};

const FOLLOWUP_SCENARIOS: Record<string, string> = {
  vinculado: "Sobre presupuesto cargado",
  independiente: "Seguimiento independiente",
  historico: "Sobre presupuesto histórico (no cargado)",
};

interface LineDraft {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function Interactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");

  const [form, setForm] = useState<any>({});
  const [lines, setLines] = useState<LineDraft[]>([]);

  const { data: interactions = [], isLoading } = useInteractionsPaginated();
  const { data: clients = [] } = useClientsMinimal();
  const { data: products = [] } = useActiveProducts();
  const { data: presupuestos = [] } = useClientPresupuestos(
    form.client_id && (form.result === "venta" || form.result === "seguimiento")
      ? form.client_id
      : undefined
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const payload: any = {
        client_id: form.client_id,
        user_id: user?.id,
        medium: form.medium,
        result: form.result,
        notes: form.notes || null,
        next_step: form.next_step || null,
        follow_up_date: form.follow_up_date || null,
      };

      if (form.result === "presupuesto") {
        payload.quote_path = form.quote_path || "catalogo";
        payload.currency = form.currency || "ARS";
        payload.total_amount = total || form.total_amount || null;
        if (form.quote_path === "adjunto") {
          payload.attachment_url = form.attachment_url || null;
        }
      }
      if (form.result === "venta") {
        payload.currency = form.currency || "ARS";
        payload.total_amount = total || form.total_amount || null;
        payload.reference_quote_id = form.reference_quote_id || null;
      }
      if (form.result === "seguimiento") {
        payload.followup_scenario = form.followup_scenario || "independiente";
        payload.followup_motive = form.followup_motive || null;
        payload.negotiation_state = form.negotiation_state || null;
        if (form.followup_scenario === "vinculado") {
          payload.reference_quote_id = form.reference_quote_id || null;
        }
        if (form.followup_scenario === "historico") {
          payload.historic_quote_amount = form.historic_quote_amount || null;
          payload.historic_quote_date = form.historic_quote_date || null;
          payload.currency = form.currency || "ARS";
        }
      }
      if (form.result === "no_interesado") {
        payload.loss_reason = form.loss_reason || null;
        payload.estimated_loss = form.estimated_loss || null;
        payload.currency = form.currency || "ARS";
      }

      const { data: created, error } = await supabase.from("interactions").insert(payload).select("id").single();
      if (error) throw error;

      // Insert lines for presupuesto/venta with selected products
      if ((form.result === "presupuesto" || form.result === "venta") && lines.length > 0 && created) {
        const linesPayload = lines
          .filter((l) => l.product_id && l.quantity > 0)
          .map((l) => ({
            interaction_id: created.id,
            product_id: l.product_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
            line_total: l.quantity * l.unit_price,
          }));
        if (linesPayload.length > 0) {
          const { error: lerr } = await supabase.from("interaction_lines").insert(linesPayload);
          if (lerr) throw lerr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setDialogOpen(false);
      setForm({});
      setLines([]);
      toast.success("Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm({});
    setLines([]);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.client_id) return toast.error("Seleccioná un cliente");
    if (!form.medium) return toast.error("Seleccioná un medio");
    if (!form.result) return toast.error("Seleccioná un resultado");
    if (form.result === "no_interesado" && !form.loss_reason) return toast.error("Indicá el motivo de pérdida");
    if (form.result === "seguimiento" && !form.followup_scenario)
      return toast.error("Seleccioná el tipo de seguimiento");
    createMutation.mutate();
  };

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineDraft>) => {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { product_id: productId, unit_price: p?.price ? Number(p.price) : 0 });
  };

  const linesTotal = useMemo(
    () => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0),
    [lines]
  );

  if (isLoading) return <ListSkeleton />;

  const filtered = interactions.filter((i: any) => {
    const matchSearch = !search || i.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === "all" || i.result === resultFilter;
    return matchSearch && matchResult;
  });

  const overdueCount = interactions.filter(
    (i: any) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date())
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">
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
        <Button onClick={openNew} className="h-9">
          <Plus className="h-4 w-4 mr-1" />
          Nueva interacción
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Resultados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los resultados</SelectItem>
            {Constants.public.Enums.interaction_result.map((r) => (
              <SelectItem key={r} value={r}>
                {RESULT_LABELS[r as Result]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((i: any, idx: number) => {
          const MediumIcon = MEDIUM_ICONS[i.medium] || MessageCircle;
          const ResultIcon = RESULT_ICONS[i.result as Result] || FileText;
          const isOverdue = i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date());
          const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date)) : 0;

          return (
            <Card
              key={i.id}
              className={`border-border/50 hover:shadow-sm transition-all duration-200 animate-fade-in ${
                isOverdue ? "border-l-2 border-l-destructive" : ""
              }`}
              style={{ animationDelay: `${idx * 0.02}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${RESULT_STYLES[i.result as Result]}`}>
                    <ResultIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate("/clients")}
                      >
                        {i.clients?.name}
                      </span>
                      <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result as Result]}`}>
                        {RESULT_LABELS[i.result as Result]}
                      </Badge>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <MediumIcon className="h-3 w-3" />
                        {MEDIUM_LABELS[i.medium]}
                      </span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {daysOverdue}d vencido
                        </Badge>
                      )}
                    </div>
                    {i.total_amount && (
                      <p className="text-sm font-semibold mt-1">
                        {i.currency} {Number(i.total_amount).toLocaleString()}
                      </p>
                    )}
                    {i.interaction_lines?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {i.interaction_lines.length} producto(s):{" "}
                        {i.interaction_lines.map((l: any) => l.products?.name).filter(Boolean).join(", ")}
                      </p>
                    )}
                    {i.followup_motive && <p className="text-xs mt-1 italic">"{i.followup_motive}"</p>}
                    {i.loss_reason && <p className="text-xs text-destructive mt-1 italic">Motivo: {i.loss_reason}</p>}
                    {i.next_step && <p className="text-sm mt-1">→ {i.next_step}</p>}
                    {i.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(i.interaction_date).toLocaleDateString()}
                    </p>
                    {i.follow_up_date && (
                      <p
                        className={`text-xs mt-0.5 ${
                          isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                        }`}
                      >
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

      {/* Wizard dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar interacción</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Cliente, Medio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Medio de Contacto *</Label>
                <Select value={form.medium || ""} onValueChange={(v) => setForm({ ...form, medium: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.interaction_medium.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MEDIUM_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>¿Qué pasó? *</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {(Constants.public.Enums.interaction_result as readonly Result[]).map((r) => {
                  const Icon = RESULT_ICONS[r];
                  const active = form.result === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, result: r })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                        active
                          ? RESULT_STYLES[r] + " ring-2 ring-primary/20"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-medium leading-tight text-center">{RESULT_LABELS[r]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRESUPUESTO */}
            {form.result === "presupuesto" && (
              <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div>
                  <Label>Origen del presupuesto</Label>
                  <Select
                    value={form.quote_path || "catalogo"}
                    onValueChange={(v) => setForm({ ...form, quote_path: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catalogo">Productos del catálogo</SelectItem>
                      <SelectItem value="adjunto">Documento adjunto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.quote_path || "catalogo") === "catalogo" ? (
                  <ProductLines
                    lines={lines}
                    products={products}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                    onProductPick={onProductPick}
                    total={linesTotal}
                    currency={form.currency || "ARS"}
                    onCurrencyChange={(c) => setForm({ ...form, currency: c })}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Moneda</Label>
                      <Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["ARS", "USD", "EUR"].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monto total</Label>
                      <Input
                        type="number"
                        value={form.total_amount || ""}
                        onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>URL del adjunto (opcional)</Label>
                      <Input
                        value={form.attachment_url || ""}
                        onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VENTA */}
            {form.result === "venta" && (
              <div className="space-y-3 p-3 bg-success/5 rounded-lg border border-success/10">
                <div>
                  <Label>Vincular presupuesto previo (opcional)</Label>
                  <Select
                    value={form.reference_quote_id || ""}
                    onValueChange={(v) => setForm({ ...form, reference_quote_id: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {presupuestos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {new Date(p.interaction_date).toLocaleDateString()} —{" "}
                          {p.currency} {Number(p.total_amount || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ProductLines
                  lines={lines}
                  products={products}
                  addLine={addLine}
                  removeLine={removeLine}
                  updateLine={updateLine}
                  onProductPick={onProductPick}
                  total={linesTotal}
                  currency={form.currency || "ARS"}
                  onCurrencyChange={(c) => setForm({ ...form, currency: c })}
                />
              </div>
            )}

            {/* SEGUIMIENTO */}
            {form.result === "seguimiento" && (
              <div className="space-y-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
                <div>
                  <Label>Tipo de seguimiento *</Label>
                  <Select
                    value={form.followup_scenario || ""}
                    onValueChange={(v) => setForm({ ...form, followup_scenario: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FOLLOWUP_SCENARIOS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.followup_scenario === "vinculado" && (
                  <div>
                    <Label>Presupuesto previo</Label>
                    <Select
                      value={form.reference_quote_id || ""}
                      onValueChange={(v) => setForm({ ...form, reference_quote_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} />
                      </SelectTrigger>
                      <SelectContent>
                        {presupuestos.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {new Date(p.interaction_date).toLocaleDateString()} —{" "}
                            {p.currency} {Number(p.total_amount || 0).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.followup_scenario === "historico" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Moneda</Label>
                      <Select
                        value={form.currency || "ARS"}
                        onValueChange={(v) => setForm({ ...form, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["ARS", "USD", "EUR"].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monto histórico</Label>
                      <Input
                        type="number"
                        value={form.historic_quote_amount || ""}
                        onChange={(e) => setForm({ ...form, historic_quote_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={form.historic_quote_date || ""}
                        onChange={(e) => setForm({ ...form, historic_quote_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estado de la negociación</Label>
                    <Select
                      value={form.negotiation_state || ""}
                      onValueChange={(v) => setForm({ ...form, negotiation_state: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(NEGOTIATION_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Input
                      value={form.followup_motive || ""}
                      onChange={(e) => setForm({ ...form, followup_motive: e.target.value })}
                      placeholder="Ej: confirmar precio"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NO INTERESADO */}
            {form.result === "no_interesado" && (
              <div className="space-y-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                <div>
                  <Label>Motivo de rechazo *</Label>
                  <Select value={form.loss_reason || ""} onValueChange={(v) => setForm({ ...form, loss_reason: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Precio">Precio</SelectItem>
                      <SelectItem value="Falta de financiación">Falta de financiación</SelectItem>
                      <SelectItem value="Tiempo de entrega">Tiempo de entrega</SelectItem>
                      <SelectItem value="Logística">Logística</SelectItem>
                      <SelectItem value="Compró a la competencia">Compró a la competencia</SelectItem>
                      <SelectItem value="Necesidad no confirmada">Necesidad no confirmada</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Moneda</Label>
                    <Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["ARS", "USD", "EUR"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pérdida estimada</Label>
                    <Input
                      type="number"
                      value={form.estimated_loss || ""}
                      onChange={(e) => setForm({ ...form, estimated_loss: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common: next step + follow-up + notes */}
            {form.result && (
              <div className="space-y-3 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Próximo paso</Label>
                    <Input
                      value={form.next_step || ""}
                      onChange={(e) => setForm({ ...form, next_step: e.target.value })}
                      placeholder="Ej: enviar muestra"
                    />
                  </div>
                  <div>
                    <Label>Fecha de seguimiento</Label>
                    <Input
                      type="date"
                      value={form.follow_up_date || ""}
                      onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              <Check className="h-4 w-4 mr-1" /> Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductLines({
  lines, products, addLine, removeLine, updateLine, onProductPick, total, currency, onCurrencyChange,
}: {
  lines: LineDraft[];
  products: any[];
  addLine: () => void;
  removeLine: (i: number) => void;
  updateLine: (i: number, p: Partial<LineDraft>) => void;
  onProductPick: (i: number, id: string) => void;
  total: number;
  currency: string;
  onCurrencyChange: (c: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Producto (múltiple)</Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["ARS", "USD", "EUR"].map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {lines.map((l, i) => {
        const p = products.find((x) => x.id === l.product_id);
        return (
          <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
            <div className="col-span-6">
              <Select value={l.product_id} onValueChange={(v) => onProductPick(i, v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.unit_label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              className="col-span-2 h-8 text-xs"
              placeholder="Cant."
              value={l.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
            />
            <Input
              type="number"
              className="col-span-3 h-8 text-xs"
              placeholder="Precio"
              value={l.unit_price}
              onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) || 0 })}
            />
            <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeLine(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
            {p && (
              <p className="col-span-12 text-[10px] text-muted-foreground -mt-1 pl-1">
                Subtotal: {currency} {(l.quantity * l.unit_price).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addLine} className="w-full h-8 text-xs">
        <Plus className="h-3 w-3 mr-1" /> Agregar producto
      </Button>
      <div className="flex justify-between items-center pt-1 border-t">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-sm font-bold">
          {currency} {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
