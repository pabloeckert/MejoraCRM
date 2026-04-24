import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { interactionSchema, type InteractionFormData, type LineFormData } from "@/lib/schemas";

const NEGOTIATION_LABELS: Record<string, string> = {
  con_interes: "Con interés", sin_respuesta: "Sin respuesta", revisando: "Está revisando", pidio_cambios: "Pidió cambios",
};

const FOLLOWUP_SCENARIOS: Record<string, string> = {
  vinculado: "Sobre presupuesto cargado", independiente: "Seguimiento independiente", historico: "Sobre presupuesto histórico (no cargado)",
};

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
  const [lines, setLines] = useState<LineFormData[]>([]);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      client_id: "", medium: undefined as any, result: undefined as any,
      quote_path: "catalogo", currency: "ARS", total_amount: null, attachment_url: null,
      reference_quote_id: null, followup_scenario: null, followup_motive: null,
      negotiation_state: null, historic_quote_amount: null, historic_quote_date: null,
      loss_reason: null, estimated_loss: null, next_step: null, follow_up_date: null, notes: null,
    },
  });

  const result = watch("result");
  const quotePath = watch("quote_path");
  const followupScenario = watch("followup_scenario");

  const createMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const payload: any = {
        client_id: data.client_id, user_id: user?.id, medium: data.medium, result: data.result,
        notes: data.notes || null, next_step: data.next_step || null, follow_up_date: data.follow_up_date || null,
      };

      if (data.result === "presupuesto") {
        payload.quote_path = data.quote_path || "catalogo";
        payload.currency = data.currency || "ARS";
        payload.total_amount = total || data.total_amount || null;
        if (data.quote_path === "adjunto") payload.attachment_url = data.attachment_url || null;
      }
      if (data.result === "venta") {
        payload.currency = data.currency || "ARS";
        payload.total_amount = total || data.total_amount || null;
        payload.reference_quote_id = data.reference_quote_id || null;
      }
      if (data.result === "seguimiento") {
        payload.followup_scenario = data.followup_scenario || "independiente";
        payload.followup_motive = data.followup_motive || null;
        payload.negotiation_state = data.negotiation_state || null;
        if (data.followup_scenario === "vinculado") payload.reference_quote_id = data.reference_quote_id || null;
        if (data.followup_scenario === "historico") {
          payload.historic_quote_amount = data.historic_quote_amount || null;
          payload.historic_quote_date = data.historic_quote_date || null;
          payload.currency = data.currency || "ARS";
        }
      }
      if (data.result === "no_interesado") {
        payload.loss_reason = data.loss_reason || null;
        payload.estimated_loss = data.estimated_loss || null;
        payload.currency = data.currency || "ARS";
      }

      const { data: created, error } = await supabase.from("interactions").insert(payload).select("id").single();
      if (error) throw error;

      if ((data.result === "presupuesto" || data.result === "venta") && lines.length > 0 && created) {
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
      reset();
      setLines([]);
      toast.success("Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (data: InteractionFormData) => createMutation.mutate(data);

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineFormData>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { product_id: productId, unit_price: p?.price ? Number(p.price) : 0 });
  };

  const linesTotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0), [lines]);

  const handleOpenChange = (v: boolean) => {
    if (!v) { reset(); setLines([]); }
    onOpenChange(v);
  };

  const ErrorMessage = ({ field }: { field?: string }) => {
    if (!field) return null;
    const msg = (errors as any)[field]?.message;
    return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar interacción</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <Controller name="client_id" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              <ErrorMessage field="client_id" />
            </div>
            <div>
              <Label>Medio de Contacto *</Label>
              <Controller name="medium" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{Constants.public.Enums.interaction_medium.map((m) => <SelectItem key={m} value={m}>{MEDIUM_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              <ErrorMessage field="medium" />
            </div>
          </div>

          <div>
            <Label>¿Qué pasó? *</Label>
            <Controller name="result" control={control} render={({ field }) => (
              <div className="grid grid-cols-5 gap-2 mt-1">
                {(Constants.public.Enums.interaction_result as readonly Result[]).map((r) => {
                  const Icon = RESULT_ICONS[r];
                  const active = field.value === r;
                  return (
                    <button key={r} type="button" onClick={() => field.onChange(r)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${active ? RESULT_STYLES[r] + " ring-2 ring-primary/20" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-medium leading-tight text-center">{RESULT_LABELS[r]}</span>
                    </button>
                  );
                })}
              </div>
            )} />
            <ErrorMessage field="result" />
          </div>

          {result === "presupuesto" && (
            <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div>
                <Label>Origen del presupuesto</Label>
                <Controller name="quote_path" control={control} render={({ field }) => (
                  <Select value={field.value || "catalogo"} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catalogo">Productos del catálogo</SelectItem>
                      <SelectItem value="adjunto">Documento adjunto</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              {(quotePath || "catalogo") === "catalogo" ? (
                <ProductLines lines={lines} products={products} addLine={addLine} removeLine={removeLine} updateLine={updateLine} onProductPick={onProductPick} total={linesTotal} currency={watch("currency") || "ARS"} onCurrencyChange={(c) => {}} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Moneda</Label><Controller name="currency" control={control} render={({ field }) => (<Select value={field.value || "ARS"} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} /></div>
                  <div><Label>Monto total</Label><Controller name="total_amount" control={control} render={({ field }) => (<Input type="number" value={field.value || ""} onChange={(e) => field.onChange(Number(e.target.value) || null)} />)} /></div>
                  <div className="col-span-2"><Label>URL del adjunto (opcional)</Label><Controller name="attachment_url" control={control} render={({ field }) => (<Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." />)} /></div>
                </div>
              )}
            </div>
          )}

          {result === "venta" && (
            <div className="space-y-3 p-3 bg-success/5 rounded-lg border border-success/10">
              <div>
                <Label>Vincular presupuesto previo (opcional)</Label>
                <Controller name="reference_quote_id" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger><SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} /></SelectTrigger>
                    <SelectContent>{presupuestos.map((p: any) => <SelectItem key={p.id} value={p.id}>{new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <ProductLines lines={lines} products={products} addLine={addLine} removeLine={removeLine} updateLine={updateLine} onProductPick={onProductPick} total={linesTotal} currency={watch("currency") || "ARS"} onCurrencyChange={(c) => {}} />
            </div>
          )}

          {result === "seguimiento" && (
            <div className="space-y-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
              <div>
                <Label>Tipo de seguimiento *</Label>
                <Controller name="followup_scenario" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{Object.entries(FOLLOWUP_SCENARIOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                <ErrorMessage field="followup_scenario" />
              </div>
              {followupScenario === "vinculado" && (
                <div>
                  <Label>Presupuesto previo</Label>
                  <Controller name="reference_quote_id" control={control} render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} /></SelectTrigger>
                      <SelectContent>{presupuestos.map((p: any) => <SelectItem key={p.id} value={p.id}>{new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
              )}
              {followupScenario === "historico" && (
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Moneda</Label><Controller name="currency" control={control} render={({ field }) => (<Select value={field.value || "ARS"} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} /></div>
                  <div><Label>Monto histórico</Label><Controller name="historic_quote_amount" control={control} render={({ field }) => (<Input type="number" value={field.value || ""} onChange={(e) => field.onChange(Number(e.target.value) || null)} />)} /></div>
                  <div><Label>Fecha</Label><Controller name="historic_quote_date" control={control} render={({ field }) => (<Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />)} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estado de la negociación</Label><Controller name="negotiation_state" control={control} render={({ field }) => (<Select value={field.value || ""} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{Object.entries(NEGOTIATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>)} /></div>
                <div><Label>Motivo</Label><Controller name="followup_motive" control={control} render={({ field }) => (<Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: confirmar precio" />)} /></div>
              </div>
            </div>
          )}

          {result === "no_interesado" && (
            <div className="space-y-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              <div>
                <Label>Motivo de rechazo *</Label>
                <Controller name="loss_reason" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )} />
                <ErrorMessage field="loss_reason" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Moneda</Label><Controller name="currency" control={control} render={({ field }) => (<Select value={field.value || "ARS"} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} /></div>
                <div><Label>Pérdida estimada</Label><Controller name="estimated_loss" control={control} render={({ field }) => (<Input type="number" value={field.value || ""} onChange={(e) => field.onChange(Number(e.target.value) || null)} />)} /></div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Próximo paso</Label><Controller name="next_step" control={control} render={({ field }) => (<Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: enviar muestra" />)} /></div>
                <div><Label>Fecha de seguimiento</Label><Controller name="follow_up_date" control={control} render={({ field }) => (<Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />)} /></div>
              </div>
              <div><Label>Observaciones</Label><Controller name="notes" control={control} render={({ field }) => (<Textarea value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={2} />)} /></div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}><Check className="h-4 w-4 mr-1" /> Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
