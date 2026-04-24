import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { ProductLines } from "./ProductLines";
import { RESULT_LABELS, RESULT_STYLES, RESULT_ICONS, MEDIUM_LABELS, type Result } from "./InteractionCard";

const NEGOTIATION_LABELS: Record<string, string> = {
  con_interes: "Con interés", sin_respuesta: "Sin respuesta", revisando: "Está revisando", pidio_cambios: "Pidió cambios",
};

const FOLLOWUP_SCENARIOS: Record<string, string> = {
  vinculado: "Sobre presupuesto cargado", independiente: "Seguimiento independiente", historico: "Sobre presupuesto histórico (no cargado)",
};

interface LineDraft { product_id: string; quantity: number; unit_price: number; }

interface InteractionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  products: any[];
  presupuestos: any[];
}

export function InteractionForm({ open, onOpenChange, clients, products, presupuestos }: InteractionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [lines, setLines] = useState<LineDraft[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const payload: any = {
        client_id: form.client_id, user_id: user?.id, medium: form.medium, result: form.result,
        notes: form.notes || null, next_step: form.next_step || null, follow_up_date: form.follow_up_date || null,
      };

      if (form.result === "presupuesto") {
        payload.quote_path = form.quote_path || "catalogo";
        payload.currency = form.currency || "ARS";
        payload.total_amount = total || form.total_amount || null;
        if (form.quote_path === "adjunto") payload.attachment_url = form.attachment_url || null;
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
        if (form.followup_scenario === "vinculado") payload.reference_quote_id = form.reference_quote_id || null;
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

      if ((form.result === "presupuesto" || form.result === "venta") && lines.length > 0 && created) {
        const linesPayload = lines.filter((l) => l.product_id && l.quantity > 0).map((l) => ({
          interaction_id: created.id, product_id: l.product_id, quantity: l.quantity,
          unit_price: l.unit_price, line_total: l.quantity * l.unit_price,
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
      onOpenChange(false);
      setForm({});
      setLines([]);
      toast.success("Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.client_id) return toast.error("Seleccioná un cliente");
    if (!form.medium) return toast.error("Seleccioná un medio");
    if (!form.result) return toast.error("Seleccioná un resultado");
    if (form.result === "no_interesado" && !form.loss_reason) return toast.error("Indicá el motivo de pérdida");
    if (form.result === "seguimiento" && !form.followup_scenario) return toast.error("Seleccioná el tipo de seguimiento");
    createMutation.mutate();
  };

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineDraft>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { product_id: productId, unit_price: p?.price ? Number(p.price) : 0 });
  };

  const linesTotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0), [lines]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar interacción</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medio de Contacto *</Label>
              <Select value={form.medium || ""} onValueChange={(v) => setForm({ ...form, medium: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{Constants.public.Enums.interaction_medium.map((m) => <SelectItem key={m} value={m}>{MEDIUM_LABELS[m]}</SelectItem>)}</SelectContent>
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
                  <button key={r} type="button" onClick={() => setForm({ ...form, result: r })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${active ? RESULT_STYLES[r] + " ring-2 ring-primary/20" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-tight text-center">{RESULT_LABELS[r]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {form.result === "presupuesto" && (
            <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div>
                <Label>Origen del presupuesto</Label>
                <Select value={form.quote_path || "catalogo"} onValueChange={(v) => setForm({ ...form, quote_path: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="catalogo">Productos del catálogo</SelectItem>
                    <SelectItem value="adjunto">Documento adjunto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.quote_path || "catalogo") === "catalogo" ? (
                <ProductLines lines={lines} products={products} addLine={addLine} removeLine={removeLine} updateLine={updateLine} onProductPick={onProductPick} total={linesTotal} currency={form.currency || "ARS"} onCurrencyChange={(c) => setForm({ ...form, currency: c })} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Moneda</Label><Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Monto total</Label><Input type="number" value={form.total_amount || ""} onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })} /></div>
                  <div className="col-span-2"><Label>URL del adjunto (opcional)</Label><Input value={form.attachment_url || ""} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} placeholder="https://..." /></div>
                </div>
              )}
            </div>
          )}

          {form.result === "venta" && (
            <div className="space-y-3 p-3 bg-success/5 rounded-lg border border-success/10">
              <div>
                <Label>Vincular presupuesto previo (opcional)</Label>
                <Select value={form.reference_quote_id || ""} onValueChange={(v) => setForm({ ...form, reference_quote_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} /></SelectTrigger>
                  <SelectContent>{presupuestos.map((p: any) => <SelectItem key={p.id} value={p.id}>{new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ProductLines lines={lines} products={products} addLine={addLine} removeLine={removeLine} updateLine={updateLine} onProductPick={onProductPick} total={linesTotal} currency={form.currency || "ARS"} onCurrencyChange={(c) => setForm({ ...form, currency: c })} />
            </div>
          )}

          {form.result === "seguimiento" && (
            <div className="space-y-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
              <div>
                <Label>Tipo de seguimiento *</Label>
                <Select value={form.followup_scenario || ""} onValueChange={(v) => setForm({ ...form, followup_scenario: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{Object.entries(FOLLOWUP_SCENARIOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.followup_scenario === "vinculado" && (
                <div>
                  <Label>Presupuesto previo</Label>
                  <Select value={form.reference_quote_id || ""} onValueChange={(v) => setForm({ ...form, reference_quote_id: v })}>
                    <SelectTrigger><SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} /></SelectTrigger>
                    <SelectContent>{presupuestos.map((p: any) => <SelectItem key={p.id} value={p.id}>{new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {form.followup_scenario === "historico" && (
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Moneda</Label><Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Monto histórico</Label><Input type="number" value={form.historic_quote_amount || ""} onChange={(e) => setForm({ ...form, historic_quote_amount: Number(e.target.value) })} /></div>
                  <div><Label>Fecha</Label><Input type="date" value={form.historic_quote_date || ""} onChange={(e) => setForm({ ...form, historic_quote_date: e.target.value })} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estado de la negociación</Label><Select value={form.negotiation_state || ""} onValueChange={(v) => setForm({ ...form, negotiation_state: v })}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{Object.entries(NEGOTIATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Motivo</Label><Input value={form.followup_motive || ""} onChange={(e) => setForm({ ...form, followup_motive: e.target.value })} placeholder="Ej: confirmar precio" /></div>
              </div>
            </div>
          )}

          {form.result === "no_interesado" && (
            <div className="space-y-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              <div>
                <Label>Motivo de rechazo *</Label>
                <Select value={form.loss_reason || ""} onValueChange={(v) => setForm({ ...form, loss_reason: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
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
                <div><Label>Moneda</Label><Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Pérdida estimada</Label><Input type="number" value={form.estimated_loss || ""} onChange={(e) => setForm({ ...form, estimated_loss: Number(e.target.value) })} /></div>
              </div>
            </div>
          )}

          {form.result && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Próximo paso</Label><Input value={form.next_step || ""} onChange={(e) => setForm({ ...form, next_step: e.target.value })} placeholder="Ej: enviar muestra" /></div>
                <div><Label>Fecha de seguimiento</Label><Input type="date" value={form.follow_up_date || ""} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
              </div>
              <div><Label>Observaciones</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}><Check className="h-4 w-4 mr-1" /> Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
