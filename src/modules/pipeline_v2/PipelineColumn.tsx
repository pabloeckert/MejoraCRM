/**
 * PipelineColumn — Representa una etapa/estado del funnel de ventas.
 *
 * Renderiza el header de la etapa + lista de PipelineCards.
 * Drag & drop se agregará en una micro-misión futura.
 */

import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { PipelineOpportunity } from "./usePipelineStore";

interface PipelineColumnProps {
  stageId: string;
  stageName: string;
  stageColor: string;
  opportunities: PipelineOpportunity[];
}

const PipelineColumn: FC<PipelineColumnProps> = ({ stageName, stageColor, opportunities }) => {
  const totalAmount = opportunities.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="flex-shrink-0 w-72">
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${stageColor.replace("text-", "bg-")}`} />
            <h3 className="text-sm font-semibold">{stageName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{opportunities.length}</Badge>
            {totalAmount > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                ${totalAmount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-2 min-h-[80px] max-h-[calc(100vh-280px)] overflow-y-auto">
          {opportunities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              0 oportunidades
            </p>
          ) : (
            opportunities.map((o) => (
              <div
                key={o.id}
                className="rounded-md border border-border/50 bg-card p-3 space-y-1 cursor-pointer hover:shadow-sm transition-all"
              >
                <p className="text-sm font-medium truncate">{o.clientName}</p>
                {o.amount > 0 && (
                  <p className="text-xs font-semibold">
                    {o.currency} {o.amount.toLocaleString()}
                  </p>
                )}
                {o.nextStep && (
                  <p className="text-xs text-muted-foreground truncate">→ {o.nextStep}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineColumn;
