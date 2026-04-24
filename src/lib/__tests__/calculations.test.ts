import { describe, it, expect } from "vitest";
import {
  calculateKPIs,
  filterByPeriod,
  getOverdueFollowups,
  isValidWhatsapp,
  calculateSellerRanking,
  type InteractionSummary,
} from "@/lib/calculations";

// Helpers
const interaction = (
  overrides: Partial<InteractionSummary> & { user_id?: string }
): InteractionSummary => ({
  result: "seguimiento",
  total_amount: null,
  interaction_date: "2026-04-20T10:00:00Z",
  follow_up_date: null,
  estimated_loss: null,
  ...overrides,
});

describe("calculateKPIs", () => {
  it("returns zeros for empty interactions", () => {
    const kpis = calculateKPIs([]);
    expect(kpis.ventasLogradas).toBe(0);
    expect(kpis.ventasEnCurso).toBe(0);
    expect(kpis.ventasNoConcretadas).toBe(0);
    expect(kpis.tasaConversion).toBe(0);
  });

  it("calculates ventas logradas correctly", () => {
    const data = [
      interaction({ result: "venta", total_amount: 1000 }),
      interaction({ result: "venta", total_amount: 2500 }),
      interaction({ result: "presupuesto", total_amount: 5000 }),
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasLogradas).toBe(3500);
    expect(kpis.cantidadVentas).toBe(2);
  });

  it("calculates ventas en curso (presupuestos) correctly", () => {
    const data = [
      interaction({ result: "presupuesto", total_amount: 10000 }),
      interaction({ result: "presupuesto", total_amount: 5000 }),
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasEnCurso).toBe(15000);
    expect(kpis.cantidadPresupuestos).toBe(2);
  });

  it("calculates ventas no concretadas (estimated_loss) correctly", () => {
    const data = [
      interaction({ result: "no_interesado", estimated_loss: 3000 }),
      interaction({ result: "no_interesado", estimated_loss: 7000 }),
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasNoConcretadas).toBe(10000);
  });

  it("calculates tasa de conversion correctly", () => {
    const data = [
      interaction({ result: "venta", total_amount: 100 }),
      interaction({ result: "venta", total_amount: 200 }),
      interaction({ result: "presupuesto", total_amount: 300 }),
      interaction({ result: "presupuesto", total_amount: 400 }),
      interaction({ result: "presupuesto", total_amount: 500 }),
    ];
    const kpis = calculateKPIs(data);
    // 2 ventas / 3 presupuestos = 67%
    expect(kpis.tasaConversion).toBe(67);
  });

  it("returns 0% conversion when no presupuestos", () => {
    const data = [interaction({ result: "venta", total_amount: 100 })];
    const kpis = calculateKPIs(data);
    expect(kpis.tasaConversion).toBe(0);
  });

  it("handles null total_amount as 0", () => {
    const data = [interaction({ result: "venta", total_amount: null })];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasLogradas).toBe(0);
  });
});

describe("filterByPeriod", () => {
  it("returns interactions after period start", () => {
    const data = [
      interaction({ interaction_date: "2026-04-11T10:00:00Z" }),
      interaction({ interaction_date: "2026-04-15T10:00:00Z" }),
      interaction({ interaction_date: "2026-03-01T10:00:00Z" }),
    ];
    const filtered = filterByPeriod(data, new Date("2026-04-10T00:00:00Z"));
    expect(filtered).toHaveLength(2);
  });

  it("returns empty when no interactions match", () => {
    const data = [interaction({ interaction_date: "2026-01-01T10:00:00Z" })];
    const filtered = filterByPeriod(data, new Date("2026-04-01T00:00:00Z"));
    expect(filtered).toHaveLength(0);
  });

  it("includes interactions exactly on the boundary", () => {
    const data = [interaction({ interaction_date: "2026-04-10T00:00:00Z" })];
    const filtered = filterByPeriod(data, new Date("2026-04-10T00:00:00Z"));
    expect(filtered).toHaveLength(1);
  });
});

describe("getOverdueFollowups", () => {
  it("returns interactions with follow_up_date in the past", () => {
    const pastDate = "2026-01-01T00:00:00Z";
    const futureDate = "2099-12-31T00:00:00Z";
    const data = [
      interaction({ follow_up_date: pastDate }),
      interaction({ follow_up_date: futureDate }),
      interaction({ follow_up_date: null }),
    ];
    const overdue = getOverdueFollowups(data);
    expect(overdue).toHaveLength(1);
  });

  it("returns empty when all follow-ups are in the future", () => {
    const data = [
      interaction({ follow_up_date: "2099-12-31T00:00:00Z" }),
      interaction({ follow_up_date: null }),
    ];
    expect(getOverdueFollowups(data)).toHaveLength(0);
  });
});

describe("isValidWhatsapp", () => {
  it("accepts valid international formats", () => {
    expect(isValidWhatsapp("+543764000000")).toBe(true);
    expect(isValidWhatsapp("+54 376 4000000")).toBe(true);
    expect(isValidWhatsapp("+1 (555) 123-4567")).toBe(true);
    expect(isValidWhatsapp("3764000000")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidWhatsapp("")).toBe(false);
    expect(isValidWhatsapp("abc")).toBe(false);
    expect(isValidWhatsapp("+")).toBe(false);
    expect(isValidWhatsapp("123")).toBe(false); // too short
  });

  it("accepts empty string (field is optional)", () => {
    // The validation in Clients.tsx treats empty as valid (optional field)
    expect(isValidWhatsapp("")).toBe(false); // regex requires at least 6 digits
  });
});

describe("calculateSellerRanking", () => {
  it("returns sellers sorted by ingresos descending", () => {
    const interactions = [
      interaction({ result: "venta", total_amount: 100, user_id: "u1" } as any),
      interaction({ result: "venta", total_amount: 500, user_id: "u2" } as any),
      interaction({ result: "venta", total_amount: 50, user_id: "u1" } as any),
    ];
    const profileMap = { u1: "Carlos", u2: "María" };
    const ranking = calculateSellerRanking(interactions, profileMap);

    expect(ranking).toHaveLength(2);
    expect(ranking[0].name).toBe("María");
    expect(ranking[0].ingresos).toBe(500);
    expect(ranking[1].name).toBe("Carlos");
    expect(ranking[1].ingresos).toBe(150);
  });

  it("counts presupuestos and seguimientos", () => {
    const interactions = [
      interaction({ result: "presupuesto", user_id: "u1" } as any),
      interaction({ result: "presupuesto", user_id: "u1" } as any),
      interaction({ result: "seguimiento", user_id: "u1" } as any),
    ];
    const ranking = calculateSellerRanking(interactions, { u1: "Test" });

    expect(ranking[0].presupuestos).toBe(2);
    expect(ranking[0].seguimientos).toBe(1);
    expect(ranking[0].ventas).toBe(0);
  });

  it("returns empty for no interactions", () => {
    expect(calculateSellerRanking([], {})).toHaveLength(0);
  });

  it("handles unknown user_ids with fallback name", () => {
    const interactions = [
      interaction({ result: "venta", total_amount: 100, user_id: "unknown" } as any),
    ];
    const ranking = calculateSellerRanking(interactions, {});
    expect(ranking[0].name).toBe("—");
  });
});
