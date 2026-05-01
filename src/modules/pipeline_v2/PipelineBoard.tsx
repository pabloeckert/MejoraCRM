/**
 * PipelineBoard — Contenedor principal del pipeline v2.
 *
 * Arquitectura:
 * ┌─────────────────────────────────────────────────────┐
 * │  PipelineBoard                                      │
 * │  ├── Header (título, toggle vista)                  │
 * │  └── PipelineColumn × N (una por etapa del funnel)  │
 * │      └── PipelineCard × N (cada oportunidad)        │
 * └─────────────────────────────────────────────────────┘
 */

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { usePipelineStore } from "./usePipelineStore";
import PipelineColumn from "./PipelineColumn";

const PipelineBoard: FC = () => {
  const { stages, grouped, view, setView } = usePipelineStore();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pipeline v2</h1>
          <p className="text-sm text-muted-foreground">
            {stages.length} etapas · En construcción
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
  );
};

export default PipelineBoard;
