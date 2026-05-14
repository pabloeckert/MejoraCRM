import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Constants } from "@/integrations/supabase/types";
import { MEDIUM_LABELS } from "../InteractionCard";
import type { InteractionFormData } from "@/lib/schemas";

interface StepMedioProps {
  control: Control<InteractionFormData>;
  error?: string;
}

export function StepMedio({ control, error }: StepMedioProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <Label className="text-base font-semibold">¿Cómo lo contactaste?</Label>
        <Controller
          name="medium"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Constants.public.Enums.interaction_medium.map((m) => {
                const active = field.value === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => field.onChange(m)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-[11px] font-medium text-center leading-tight">{MEDIUM_LABELS[m]}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Próximo paso</Label>
          <Controller name="next_step" control={control} render={({ field }) => (
            <Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: enviar muestra" />
          )} />
        </div>
        <div>
          <Label>Fecha de seguimiento</Label>
          <Controller name="follow_up_date" control={control} render={({ field }) => (
            <Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />
          )} />
        </div>
      </div>

      <div>
        <Label>Observaciones</Label>
        <Controller name="notes" control={control} render={({ field }) => (
          <Textarea value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={3} placeholder="Detalles adicionales..." />
        )} />
      </div>
    </div>
  );
}
