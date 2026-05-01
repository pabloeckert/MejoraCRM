/**
 * Pipeline v2 — Módulo de pipeline de ventas rediseñado.
 *
 * Este barrel exporta todos los componentes del módulo.
 *
 * Uso:
 *   import { PipelineBoard } from "@/modules/pipeline_v2";
 */

export { default as PipelineBoard } from "./PipelineBoard";
export { default as PipelineColumn } from "./PipelineColumn";
export { default as PipelineCard } from "./PipelineCard";
export { usePipelineStore } from "./usePipelineStore";
export { usePipelineData } from "./usePipelineData";
export { usePipelineFilters } from "./usePipelineFilters";
export type { PipelineStage, PipelineOpportunity } from "./usePipelineStore";
export type { PipelineFilters } from "./usePipelineFilters";
