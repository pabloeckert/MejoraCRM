/**
 * PipelineBoard — Contenedor principal del pipeline v2.
 *
 * Integra:
 * - usePipelineData() para cargar datos reales de Supabase
 * - usePipelineFilters() para filtrado client-side
 * - DndContext con persistencia de drag & drop a Supabase
 * - Barra de filtros avanzados
 */

import { FC, useState, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Search, X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePipelineStore, PipelineOpportunity } from "./usePipelineStore";
import { usePipelineData } from "./usePipelineData";
import { usePipelineFilters } from "./usePipelineFilters";
import PipelineColumn from "./PipelineColumn";
import PipelineCard from "./PipelineCard";

/** Reverse mapping: stageId → interaction_result for Supabase persistence */
const STAGE_TO_RESULT: Record<string, string> = {
  new: "sin_respuesta",
  contacted: "seguimiento",
  qualified: "seguimiento", // no direct match, map to seguimiento
  proposal: "presupuesto",
  won: "venta",
  lost: "no_interesado",
};

const PipelineBoard: FC = () => {
  const { stages, grouped, view, setView, moveOpportunity, opportunities } = usePipelineStore();
  const { isLoading, isError, invalidate } = usePipelineData();
  const {
    filters,
    setSearch,
    setStageFilter,
    setAmountRange,
    setDateRange,
    clearFilters,
    applyFilters,
    hasActiveFilters,
  } = usePipelineFilters();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Apply filters before grouping
  const filteredOpportunities = useMemo(
    () => applyFilters(opportunities),
    [opportunities, applyFilters]
  );

  const filteredGrouped = useMemo(() => {
    const groups: Record<string, PipelineOpportunity[]> = {};
    stages.forEach((s) => (groups[s.id] = []));
    filteredOpportunities.forEach((o) => {
      if (groups[o.stageId]) groups[o.stageId].push(o);
    });
    return groups;
  }, [stages, filteredOpportunities]);

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
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const cardId = active.id as string;
      const targetStageId = over.id as string;
      const currentStageId = findStageByCardId(cardId);

      if (!currentStageId || currentStageId === targetStageId) return;

      // 1. Optimistic local update
      moveOpportunity(cardId, targetStageId);

      // 2. Persist to Supabase
      const newResult = STAGE_TO_RESULT[targetStageId];
      if (!newResult) return;

      setSaving(true);
      try {
        const { error } = await supabase
          .from("interactions")
          .update({ result: newResult })
          .eq("id", cardId);

        if (error) throw error;

        toast.success("Oportunidad movida", {
          description: `Etapa actualizada a "${stages.find((s) => s.id === targetStageId)?.name}"`,
        });

        // Invalidate to keep cache fresh
        invalidate();
      } catch (err: any) {
        toast.error("Error al guardar", {
          description: err.message || "No se pudo persistir el cambio de etapa",
        });
        // Revert: reload from server
        invalidate();
      } finally {
        setSaving(false);
      }
    },
    [findStageByCardId, moveOpportunity, stages, invalidate]
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
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              {opportunities.length} oportunidades
              {hasActiveFilters && ` · ${filteredOpportunities.length} filtradas`}
              {saving && " · Guardando..."}
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

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-9 h-9"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Stage filter */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filters.stageFilter || ""}
            onChange={(e) => setStageFilter(e.target.value || null)}
          >
            <option value="">Todas las etapas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Amount range */}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Min $"
              className="h-9 w-24"
              value={filters.minAmount ?? ""}
              onChange={(e) =>
                setAmountRange(e.target.value ? Number(e.target.value) : null, filters.maxAmount)
              }
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="number"
              placeholder="Max $"
              className="h-9 w-24"
              value={filters.maxAmount ?? ""}
              onChange={(e) =>
                setAmountRange(filters.minAmount, e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="h-9 w-36"
              value={filters.dateFrom || ""}
              onChange={(e) => setDateRange(e.target.value || null, filters.dateTo)}
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="date"
              className="h-9 w-36"
              value={filters.dateTo || ""}
              onChange={(e) => setDateRange(filters.dateFrom, e.target.value || null)}
            />
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Error al cargar datos</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => invalidate()}>
              Reintentar
            </Button>
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stageId={stage.id}
                stageName={stage.name}
                stageColor={stage.color}
                opportunities={filteredGrouped[stage.id] || []}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => {
              const items = filteredGrouped[stage.id] || [];
              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${stage.color.replace("text-", "bg-")}`} />
                    <h3 className="text-sm font-semibold">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
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

      {/* Drag overlay */}
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
