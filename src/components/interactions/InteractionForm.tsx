import { useMemo, useState } from "react";
import { addDemoInteraction } from "@/hooks/useInteractions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { interactionSchema, type InteractionFormData, type LineFormData } from "@/lib/schemas";
import type { Result } from "./InteractionCard";
import { StepCliente } from "./steps/StepCliente";
import { StepResultado } from "./steps/StepResultado";
import { StepDetalles } from "./steps/StepDetalles";
import { StepMedio } from "./steps/StepMedio";
import type { Client, Product, Interaction } from "@/lib/types";

type WizardStep = "cliente" | "resultado" | "detalles" | "medio";

const STEP_ORDER: WizardStep[] = ["cliente", "resultado", "detalles", "medio"];
const STEP_LABELS: Record<WizardStep, string> = {
  cliente: "Cliente",
  resultado: "Resultado",
  detalles: "Detalles",
  medio: "Contacto",
};

interface InteractionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  products: Product[];
  presupuestos: Interaction[];
  interaction?: Interaction | null;
}

import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Calendar as CalendarIcon } from "lucide-react";

export function InteractionForm({ open, onOpenChange, clients, products, presupuestos, interaction }: InteractionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!interaction;
  const { isConnected: calendarConnected, createEvent } = useGoogleCalendar();
  const [syncToCalendar, setSyncToCalendar] = useState(false);

  const [step, setStep] = useState<WizardStep>(isEditing ? "resultado" : "cliente");
  const [searchClient, setSearchClient] = useState("");
  const [lines, setLines] = useState<LineFormData[]>([]);
  const [proformaFile, setProformaFile] = useState<File | null>(null);

  const { control, handleSubmit, watch, reset, trigger, setValue, formState: { errors } } =
    useForm<InteractionFormData>({
      resolver: zodResolver(interactionSchema),
      defaultValues: interaction
        ? {
            client_id: interaction.client_id || "",
            medium: (interaction.medium as any) || undefined,
            result: (interaction.result as any) || undefined,
            quote_path: (interaction.quote_path as any) || "catalogo",
            currency: (interaction.currency as any) || "ARS",
            total_amount: interaction.total_amount || null,
            attachment_url: interaction.attachment_url || null,
            reference_quote_id: interaction.reference_quote_id || null,
            followup_scenario: (interaction.followup_scenario as any) || null,
            followup_motive: interaction.followup_motive || null,
            negotiation_state: (interaction.negotiation_state as any) || null,
            historic_quote_amount: interaction.historic_quote_amount || null,
            historic_quote_date: interaction.historic_quote_date || null,
            loss_reason: interaction.loss_reason || null,
            estimated_loss: interaction.estimated_loss || null,
            next_step: interaction.next_step || null,
            follow_up_date: interaction.follow_up_date || null,
            notes: interaction.notes || null,
          }
        : {
            client_id: "", medium: undefined, result: undefined,
            quote_path: "catalogo", currency: "ARS", total_amount: null, attachment_url: null,
            reference_quote_id: null, followup_scenario: null, followup_motive: null,
            negotiation_state: null, historic_quote_amount: null, historic_quote_date: null,
            loss_reason: null, estimated_loss: null, next_step: null, follow_up_date: null, notes: null,
          },
    });

  const resultValue = watch("result") as Result | undefined;
  const clientId = watch("client_id");
  const selectedClient = clients.find((c) => c.id === clientId);

  useMemo(() => {
    if (interaction?.interaction_lines && interaction.interaction_lines.length > 0) {
      setLines(
        interaction.interaction_lines.map((l: any) => ({
          product_id: l.product_id || "",
          quantity: l.quantity || 0,
          unit_price: l.unit_price || 0,
        }))
      );
    }
  }, [interaction]);

  const linesTotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0), [lines]);

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineFormData>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { product_id: productId, unit_price: p?.price ? Number(p.price) : 0 });
  };

  const closeAndReset = () => {
    reset();
    setLines([]);
    setStep(isEditing ? "resultado" : "cliente");
    setSearchClient("");
    setProformaFile(null);
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      if (import.meta.env.VITE_DEMO_MODE !== "false") {
        addDemoInteraction(data as any);
        return;
      }
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

      const linesPayload = (interactionId: string) =>
        lines.filter((l) => l.product_id && l.quantity > 0).map((l) => ({
          interaction_id: interactionId, product_id: l.product_id, quantity: l.quantity,
          unit_price: l.unit_price, line_total: l.quantity * l.unit_price,
        }));

      const needsLines = data.result === "presupuesto" || data.result === "venta";

      if (isEditing && interaction) {
        const { error } = await supabase.from("interactions").update(payload).eq("id", interaction.id);
        if (error) throw error;
        if (needsLines) {
          await supabase.from("interaction_lines").delete().eq("interaction_id", interaction.id);
          const lp = linesPayload(interaction.id);
          if (lp.length > 0) {
            const { error: le } = await supabase.from("interaction_lines").insert(lp);
            if (le) throw le;
          }
        }
      } else {
        const { data: created, error } = await supabase.from("interactions").insert(payload).select("id").single();
        if (error) throw error;
        if (needsLines && created) {
          const lp = linesPayload(created.id);
          if (lp.length > 0) {
            const { error: le } = await supabase.from("interaction_lines").insert(lp);
            if (le) throw le;
          }
        }
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });

      if (syncToCalendar) {
        const clientName = clients.find((c) => c.id === variables.client_id)?.name || "Cliente";
        await createEvent(
          `${RESULT_LABELS[variables.result as Result]} - ${clientName}`,
          variables.notes || `Interacción registrada vía ${MEDIUM_LABELS[variables.medium as string]}`,
          new Date()
        );
      }

      closeAndReset();
      toast.success(isEditing ? "Interacción actualizada" : "Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const effectiveSteps = isEditing ? STEP_ORDER.filter((s) => s !== "cliente") : STEP_ORDER;
  const currentIdx = effectiveSteps.indexOf(step);

  const goNext = async () => {
    if (step === "cliente") {
      if (!clientId) { toast.error("Seleccioná un cliente"); return; }
      setStep("resultado");
    } else if (step === "resultado") {
      if (!resultValue) { toast.error("Seleccioná un resultado"); return; }
      setStep("detalles");
    } else if (step === "detalles") {
      if (resultValue === "no_interesado") { const ok = await trigger("loss_reason"); if (!ok) return; }
      if (resultValue === "seguimiento") { const ok = await trigger("followup_scenario"); if (!ok) return; }
      setStep("medio");
    }
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeAndReset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar interacción" : "Registrar interacción"}</DialogTitle>
          {/* Step progress */}
          <div className="flex items-center gap-1 mt-3">
            {effectiveSteps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${
                  currentIdx > i ? "bg-primary" : currentIdx === i ? "bg-primary/60" : "bg-muted"
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {effectiveSteps.map((s, i) => (
              <span key={s} className={`text-[10px] ${currentIdx === i ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {STEP_LABELS[s]}
              </span>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          {step === "cliente" && (
            <StepCliente
              clients={clients}
              searchClient={searchClient}
              onSearchChange={setSearchClient}
              selectedClientId={clientId}
              onSelectClient={(id) => { setValue("client_id", id); trigger("client_id"); }}
              error={errors.client_id?.message}
            />
          )}

          {step === "resultado" && (
            <StepResultado
              clientName={selectedClient?.name}
              value={resultValue}
              onChange={(r) => setValue("result", r)}
              error={errors.result?.message}
            />
          )}

          {step === "detalles" && resultValue && (
            <StepDetalles
              result={resultValue}
              control={control}
              watch={watch}
              setValue={setValue}
              lines={lines}
              products={products}
              presupuestos={presupuestos}
              linesTotal={linesTotal}
              proformaFile={proformaFile}
              onFileChange={setProformaFile}
              addLine={addLine}
              removeLine={removeLine}
              updateLine={updateLine}
              onProductPick={onProductPick}
              errors={errors}
            />
          )}

          {step === "medio" && (
            <StepMedio
              control={control}
              error={errors.medium?.message}
              calendarConnected={calendarConnected}
              syncToCalendar={syncToCalendar}
              setSyncToCalendar={setSyncToCalendar}
            />
          )}
        </form>

        <DialogFooter className="flex justify-between">
          <div>
            {currentIdx > 0 && (
              <Button variant="ghost" type="button" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={closeAndReset}>Cancelar</Button>
            {step === "medio" ? (
              <Button onClick={handleSubmit((data) => createMutation.mutate(data))} disabled={createMutation.isPending}>
                <Check className="h-4 w-4 mr-1" /> {isEditing ? "Guardar cambios" : "Registrar"}
              </Button>
            ) : (
              <Button type="button" onClick={goNext} disabled={step === "cliente" ? !clientId : step === "resultado" ? !resultValue : false}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
