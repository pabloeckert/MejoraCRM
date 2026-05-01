/**
 * usePipelineStore — Estado central del pipeline v2.
 *
 * Implementación: useReducer + Context (sin deps extra).
 * Evita agregar zustand; ya tenemos @tanstack/query para server state.
 *
 * El store es independiente de useInteractions para permitir
 * que el pipeline evolucione hacia un modelo de "deals/opportunities"
 * separado de las "interacciones" actuales.
 */

import { useReducer, useCallback, useMemo } from "react";

// --- Tipos ---

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

export interface PipelineOpportunity {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  stageId: string;
  products: string[];
  nextStep?: string;
  followUpDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Estado inicial ---

const INITIAL_STAGES: PipelineStage[] = [
  { id: "new", name: "Nuevo", color: "text-blue-500" },
  { id: "contacted", name: "Contactado", color: "text-yellow-500" },
  { id: "qualified", name: "Calificado", color: "text-purple-500" },
  { id: "proposal", name: "Propuesta", color: "text-orange-500" },
  { id: "won", name: "Ganado", color: "text-green-500" },
  { id: "lost", name: "Perdido", color: "text-red-500" },
];

interface PipelineState {
  stages: PipelineStage[];
  opportunities: PipelineOpportunity[];
  view: "kanban" | "list";
}

const MOCK_OPPORTUNITIES: PipelineOpportunity[] = [
  {
    id: "opp-1",
    clientId: "c1",
    clientName: "Tech Solutions SA",
    amount: 15000,
    currency: "USD",
    stageId: "new",
    products: ["CRM Enterprise"],
    nextStep: "Agendar llamada de descubrimiento",
    createdAt: "2026-04-28T10:00:00Z",
    updatedAt: "2026-04-28T10:00:00Z",
  },
  {
    id: "opp-2",
    clientId: "c2",
    clientName: "Distribuidora Norte",
    amount: 8500,
    currency: "USD",
    stageId: "contacted",
    products: ["CRM Pro", "Módulo Inventario"],
    nextStep: "Enviar propuesta técnica",
    createdAt: "2026-04-25T14:00:00Z",
    updatedAt: "2026-04-30T09:00:00Z",
  },
  {
    id: "opp-3",
    clientId: "c3",
    clientName: "Clínica Vida",
    amount: 22000,
    currency: "USD",
    stageId: "qualified",
    products: ["CRM Enterprise", "Módulo Pacientes"],
    nextStep: "Demo personalizada",
    createdAt: "2026-04-20T08:00:00Z",
    updatedAt: "2026-05-01T11:00:00Z",
  },
  {
    id: "opp-4",
    clientId: "c4",
    clientName: "Logística Express",
    amount: 12000,
    currency: "USD",
    stageId: "proposal",
    products: ["CRM Pro"],
    nextStep: "Esperando firma del contrato",
    createdAt: "2026-04-15T16:00:00Z",
    updatedAt: "2026-05-01T15:00:00Z",
  },
  {
    id: "opp-5",
    clientId: "c5",
    clientName: "Retail Group",
    amount: 35000,
    currency: "USD",
    stageId: "won",
    products: ["CRM Enterprise", "Módulo Inventario", "Analytics"],
    nextStep: "Onboarding programado",
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-04-28T17:00:00Z",
  },
];

const initialState: PipelineState = {
  stages: INITIAL_STAGES,
  opportunities: MOCK_OPPORTUNITIES,
  view: "kanban",
};

// --- Reducer ---

type PipelineAction =
  | { type: "SET_VIEW"; view: "kanban" | "list" }
  | { type: "ADD_OPPORTUNITY"; opportunity: PipelineOpportunity }
  | { type: "MOVE_OPPORTUNITY"; id: string; stageId: string }
  | { type: "SET_OPPORTUNITIES"; opportunities: PipelineOpportunity[] };

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "ADD_OPPORTUNITY":
      return { ...state, opportunities: [...state.opportunities, action.opportunity] };
    case "MOVE_OPPORTUNITY":
      return {
        ...state,
        opportunities: state.opportunities.map((o) =>
          o.id === action.id ? { ...o, stageId: action.stageId, updatedAt: new Date().toISOString() } : o
        ),
      };
    case "SET_OPPORTUNITIES":
      return { ...state, opportunities: action.opportunities };
    default:
      return state;
  }
}

// --- Hook ---

export function usePipelineStore() {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);

  const setView = useCallback((view: "kanban" | "list") => {
    dispatch({ type: "SET_VIEW", view });
  }, []);

  const addOpportunity = useCallback((opportunity: PipelineOpportunity) => {
    dispatch({ type: "ADD_OPPORTUNITY", opportunity });
  }, []);

  const moveOpportunity = useCallback((id: string, stageId: string) => {
    dispatch({ type: "MOVE_OPPORTUNITY", id, stageId });
  }, []);

  const setOpportunities = useCallback((opportunities: PipelineOpportunity[]) => {
    dispatch({ type: "SET_OPPORTUNITIES", opportunities });
  }, []);

  /** Devuelve oportunidades agrupadas por stageId */
  const grouped = useMemo(() => {
    const groups: Record<string, PipelineOpportunity[]> = {};
    state.stages.forEach((s) => (groups[s.id] = []));
    state.opportunities.forEach((o) => {
      if (groups[o.stageId]) groups[o.stageId].push(o);
    });
    return groups;
  }, [state.stages, state.opportunities]);

  return {
    ...state,
    grouped,
    setView,
    addOpportunity,
    moveOpportunity,
    setOpportunities,
  };
}
