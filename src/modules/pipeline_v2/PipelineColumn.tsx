/**
 * PipelineColumn — Droppable stage column.
 *
 * Uses @dnd-kit/useDroppable to accept dragged cards.
 */

import { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { PipelineOpportunity } from "./usePipelineStore";
import PipelineCard from "./PipelineCard";

interface PipelineColumnProps {
  stageId: string;
  stageName: string;
  stageColor: string;
  opportunities: PipelineOpportunity[];
}

const PipelineColumn: FC<PipelineColumnProps> = ({ stageId, stageName, stageColor, opportunities }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const totalAmount = opportunities.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className={`rounded-lg border p-3 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border/50 bg-muted/30"
        }`}
      >
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

        {/* Cards — droppable zone */}
        <div
          ref={setNodeRef}
          className="space-y-2 min-h-[80px] max-h-[calc(100vh-280px)] overflow-y-auto"
        >
          {opportunities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              0 oportunidades
            </p>
          ) : (
            opportunities.map((o) => <PipelineCard key={o.id} opportunity={o} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineColumn;
