/**
 * usePipelineFilters — Client-side filtering for pipeline opportunities.
 *
 * Filters are applied AFTER data is loaded from Supabase,
 * before grouping into columns. Pure client-side, no extra queries.
 */

import { useState, useMemo, useCallback } from "react";
import { PipelineOpportunity } from "./usePipelineStore";

export interface PipelineFilters {
  search: string;
  stageFilter: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  dateFrom: string | null; // ISO date string (YYYY-MM-DD)
  dateTo: string | null;
}

const INITIAL_FILTERS: PipelineFilters = {
  search: "",
  stageFilter: null,
  minAmount: null,
  maxAmount: null,
  dateFrom: null,
  dateTo: null,
};

export function usePipelineFilters() {
  const [filters, setFilters] = useState<PipelineFilters>(INITIAL_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }));
  }, []);

  const setStageFilter = useCallback((stageFilter: string | null) => {
    setFilters((f) => ({ ...f, stageFilter }));
  }, []);

  const setAmountRange = useCallback((min: number | null, max: number | null) => {
    setFilters((f) => ({ ...f, minAmount: min, maxAmount: max }));
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    setFilters((f) => ({ ...f, dateFrom: from, dateTo: to }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const applyFilters = useCallback(
    (opportunities: PipelineOpportunity[]): PipelineOpportunity[] => {
      return opportunities.filter((o) => {
        // Search by client name
        if (filters.search && !o.clientName.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        // Stage filter
        if (filters.stageFilter && o.stageId !== filters.stageFilter) {
          return false;
        }
        // Amount range
        if (filters.minAmount !== null && o.amount < filters.minAmount) {
          return false;
        }
        if (filters.maxAmount !== null && o.amount > filters.maxAmount) {
          return false;
        }
        // Date range (createdAt)
        if (filters.dateFrom && o.createdAt < filters.dateFrom) {
          return false;
        }
        if (filters.dateTo && o.createdAt > filters.dateTo + "T23:59:59Z") {
          return false;
        }
        return true;
      });
    },
    [filters]
  );

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.stageFilter !== null ||
      filters.minAmount !== null ||
      filters.maxAmount !== null ||
      filters.dateFrom !== null ||
      filters.dateTo !== null
    );
  }, [filters]);

  return {
    filters,
    setSearch,
    setStageFilter,
    setAmountRange,
    setDateRange,
    clearFilters,
    applyFilters,
    hasActiveFilters,
  };
}
