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
export { usePipelineStore } from "./usePipelineStore";
export type { PipelineStage, PipelineOpportunity } from "./usePipelineStore";
