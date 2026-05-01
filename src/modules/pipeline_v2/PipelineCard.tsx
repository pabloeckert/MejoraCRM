/**
 * PipelineCard — Draggable opportunity card.
 *
 * Uses @dnd-kit/useDraggable for native drag & drop.
 */

import { FC } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PipelineOpportunity } from "./usePipelineStore";

interface PipelineCardProps {
  opportunity: PipelineOpportunity;
  isOverlay?: boolean;
}

const PipelineCard: FC<PipelineCardProps> = ({ opportunity, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-md border border-border/50 bg-card p-3 space-y-1 transition-shadow ${
        isDragging ? "shadow-lg z-50" : "hover:shadow-sm"
      } ${isOverlay ? "shadow-xl rotate-2" : ""}`}
    >
      <p className="text-sm font-medium truncate">{opportunity.clientName}</p>
      {opportunity.amount > 0 && (
        <p className="text-xs font-semibold">
          {opportunity.currency} {opportunity.amount.toLocaleString()}
        </p>
      )}
      {opportunity.products.length > 0 && (
        <p className="text-[10px] text-muted-foreground truncate">
          {opportunity.products.join(", ")}
        </p>
      )}
      {opportunity.nextStep && (
        <p className="text-xs text-muted-foreground truncate">→ {opportunity.nextStep}</p>
      )}
    </div>
  );
};

export default PipelineCard;
