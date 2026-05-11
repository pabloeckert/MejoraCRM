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
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
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

type WizardStep = "cliente" | "resultado" | "detalles" | "medio";

const STEP_ORDER: WizardStep[] = ["cliente", "resultado", "detalles", "medio"];
const STEP_LABELS: Record<WizardStep, string> = {
  cliente: "Cliente",
  resultado: "Resultado",
  detalles: "Detalles",
  medio: "Contacto",
};

export function InteractionForm({ open, onOpenChange, clients, products, presupuestos }: InteractionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<LineFormData[]>([]);
  const [step, setStep] = useState<WizardStep>("cliente");
  const [searchClient, setSearchClient] = useState("");

  const { control, handleSubmit, watch, reset, trigger, formState: { errors } } = useForm<InteractionFormData>({
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
  const clientId = watch("client_id");
  const quotePath = watch("quote_path");
  const followupScenario = watch("followup_scenario");

  const filteredClients = useMemo(() => {
    if (!searchClient) return clients;
    const q = searchClient.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q));
  }, [clients, searchClient]);

  const selectedClient = clients.find((c) => c.id === clientId);

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
      setStep("cliente");
      setSearchClient("");
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
    if (!v) { reset(); setLines([]); setStep("cliente"); setSearchClient(""); }
    onOpenChange(v);
  };

  const ErrorMessage = ({ field }: { field?: string }) => {
    if (!field) return null;
    const msg = (errors as any)[field]?.message;
    return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
  };

  const currentStepIdx = STEP_ORDER.indexOf(step);
  const canGoNext = () => {
    if (step === "cliente") return !!clientId;
    if (step === "resultado") return !!result;
    if (step === "detalles") return true;
    return false;
  };

  const goNext = async () => {
    if (step === "cliente") {
      if (!clientId) { toast.error("Seleccioná un cliente"); return; }
      setStep("resultado");
    } else if (step === "resultado") {
      if (!result) { toast.error("Seleccioná un resultado"); return; }
      setStep("detalles");
    } else if (step === "detalles") {
      // Validate result-specific fields
      if (result === "no_interesado") {
        const valid = await trigger("loss_reason");
        if (!valid) return;
      }
      if (result === "seguimiento") {
        const valid = await trigger("followup_scenario");
        if (!valid) return;
      }
      setStep("medio");
    }
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar interacción</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentStepIdx ? "bg-primary" : i === currentStepIdx ? "bg-primary/60" : "bg-muted"
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEP_ORDER.map((s, i) => (
              <span key={s} className={`text-[10px] ${
                i === currentStepIdx ? "text-primary font-semibold" : "text-muted-foreground"
              }`}>{STEP_LABELS[s]}</span>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* STEP 1: Cliente */}
          {step === "cliente" && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-base font-semibold">¿A quién visitaste o contactaste?</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar cliente..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="mb-2"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { control._formValues.client_id = c.id; trigger("client_id"); }}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      clientId === c.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      clientId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                    </div>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
                )}
              </div>
              <ErrorMessage field="client_id" />
            </div>
          )}

          {/* STEP 2: Resultado */}
          {step === "resultado" && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-base font-semibold">¿Qué pasó con {selectedClient?.name}?</Label>
              <Controller name="result" control={control} render={({ field }) => (
                <div className="grid grid-cols-1 gap-2">
                  {(Constants.public.Enums.interaction_result as readonly Result[]).map((r) => {
                    const Icon = RESULT_ICONS[r];
                    const active = field.value === r;
                    return (
                      <button key={r} type="button" onClick={() => field.onChange(r)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                          active
                            ? RESULT_STYLES[r] + " ring-2 ring-primary/20 shadow-sm"
                            : "border-border bg-card hover:bg-muted/20 hover:border-muted-foreground/20"
                        }`}>
                        <div className={`p-2.5 rounded-lg ${active ? "bg-white/50" : "bg-muted/50"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold">{RESULT_LABELS[r]}</span>
                      </button>
                    );
                  })}
                </div>
              )} />
              <ErrorMessage field="result" />
            </div>
          )}

          {/* STEP 3: Detalles según resultado */}
          {step === "detalles" && (
            <div className="space-y-4 animate-fade-in">
              <Label className="text-base font-semibold">Detalles</Label>

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

              {result === "sin_respuesta" && (
                <div className="p-3 bg-muted/30 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Sin datos adicionales requeridos.</p>
                  <p className="text-xs text-muted-foreground mt-1">Podés agregar observaciones en el paso siguiente.</p>
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
            </div>
          )}

          {/* STEP 4: Medio + Observaciones */}
          {step === "medio" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-base font-semibold">¿Cómo lo contactaste?</Label>
                <Controller name="medium" control={control} render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Constants.public.Enums.interaction_medium.map((m) => {
                      const active = field.value === m;
                      return (
                        <button key={m} type="button" onClick={() => field.onChange(m)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                            active ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                          }`}>
                          <span className="text-[11px] font-medium text-center leading-tight">{MEDIUM_LABELS[m]}</span>
                        </button>
                      );
                    })}
                  </div>
                )} />
                <ErrorMessage field="medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Próximo paso</Label><Controller name="next_step" control={control} render={({ field }) => (<Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: enviar muestra" />)} /></div>
                <div><Label>Fecha de seguimiento</Label><Controller name="follow_up_date" control={control} render={({ field }) => (<Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />)} /></div>
              </div>
              <div><Label>Observaciones</Label><Controller name="notes" control={control} render={({ field }) => (<Textarea value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={3} placeholder="Detalles adicionales..." />)} /></div>
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStepIdx > 0 && (
              <Button variant="ghost" type="button" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Cancelar</Button>
            {step === "medio" ? (
              <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
                <Check className="h-4 w-4 mr-1" /> Registrar
              </Button>
            ) : (
              <Button type="button" onClick={goNext} disabled={!canGoNext()}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
