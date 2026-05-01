/**
 * PipelineBoard — Contenedor principal del pipeline v2 con drag & drop.
 *
 * DndContext envuelve todo el board. onDragEnd delega al store
 * para mover oportunidades entre etapas.
 */

import { FC, useState, useCallback } from "react";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { usePipelineStore, PipelineOpportunity } from "./usePipelineStore";
import PipelineColumn from "./PipelineColumn";
import PipelineCard from "./PipelineCard";

const PipelineBoard: FC = () => {
  const { stages, grouped, view, setView, moveOpportunity, opportunities } = usePipelineStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findStageByCardId = useCallback(
    (cardId: string): string | undefined => {
      const opp = opportunities.find((o) => o.id === cardId);
      return opp?.stageId;
    },
    [opportunities]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Future: preview drop position
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const cardId = active.id as string;
      const targetStageId = over.id as string;
      const currentStageId = findStageByCardId(cardId);

      // Only move if dropped on a different stage
      if (currentStageId && currentStageId !== targetStageId) {
        moveOpportunity(cardId, targetStageId);
      }
    },
    [findStageByCardId, moveOpportunity]
  );

  const activeOpportunity = activeId
    ? opportunities.find((o) => o.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Pipeline v2</h1>
            <p className="text-sm text-muted-foreground">
              {stages.length} etapas · {opportunities.length} oportunidades
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "kanban" ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4 mr-1" /> Lista
            </Button>
          </div>
        </div>

        {/* Columns */}
        {view === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stageId={stage.id}
                stageName={stage.name}
                stageColor={stage.color}
                opportunities={grouped[stage.id] || []}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => {
              const items = grouped[stage.id] || [];
              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${stage.color.replace("text-", "bg-")}`} />
                    <h3 className="text-sm font-semibold">{stage.name}</h3>
                    <span className="text-xs text-muted-foreground">{items.length} oportunidades</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-5">Sin oportunidades</p>
                  ) : (
                    <div className="space-y-1 pl-5">
                      {items.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-md border border-border/50 bg-card p-3 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all"
                        >
                          <span className="text-sm font-medium">{o.clientName}</span>
                          {o.amount > 0 && (
                            <span className="text-xs font-semibold">
                              {o.currency} {o.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drag overlay — renders the card being dragged */}
      <DragOverlay>
        {activeOpportunity ? (
          <div className="w-72">
            <PipelineCard opportunity={activeOpportunity} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PipelineBoard;
