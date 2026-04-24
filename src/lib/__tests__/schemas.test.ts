import { describe, it, expect } from "vitest";
import { interactionSchema, lineSchema } from "../schemas";

describe("interactionSchema", () => {
  const validBase = {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    medium: "whatsapp" as const,
    result: "presupuesto" as const,
  };

  it("accepts valid presupuesto", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      quote_path: "catalogo",
      currency: "ARS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing client_id", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      client_id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("client_id"))).toBe(true);
    }
  });

  it("rejects missing medium", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      medium: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing result", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("requires loss_reason for no_interesado", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "no_interesado",
      loss_reason: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("loss_reason"))).toBe(true);
    }
  });

  it("accepts no_interesado with loss_reason", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "no_interesado",
      loss_reason: "Precio",
    });
    expect(result.success).toBe(true);
  });

  it("requires followup_scenario for seguimiento", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "seguimiento",
      followup_scenario: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("followup_scenario"))).toBe(true);
    }
  });

  it("accepts seguimiento with followup_scenario", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "seguimiento",
      followup_scenario: "independiente",
    });
    expect(result.success).toBe(true);
  });

  it("accepts venta with optional reference_quote_id", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "venta",
      currency: "ARS",
      total_amount: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid mediums", () => {
    const mediums = ["whatsapp", "llamada", "email", "reunion_presencial", "reunion_virtual", "md_instagram", "md_facebook", "md_linkedin", "visita_campo"];
    for (const m of mediums) {
      const result = interactionSchema.safeParse({ ...validBase, medium: m });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid medium", () => {
    const result = interactionSchema.safeParse({ ...validBase, medium: "telepathy" });
    expect(result.success).toBe(false);
  });
});

describe("lineSchema", () => {
  it("accepts valid line", () => {
    const result = lineSchema.safeParse({ product_id: "abc", quantity: 5, unit_price: 100 });
    expect(result.success).toBe(true);
  });

  it("rejects negative quantity", () => {
    const result = lineSchema.safeParse({ product_id: "abc", quantity: -1, unit_price: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts zero quantity", () => {
    const result = lineSchema.safeParse({ product_id: "abc", quantity: 0, unit_price: 100 });
    expect(result.success).toBe(true);
  });
});
