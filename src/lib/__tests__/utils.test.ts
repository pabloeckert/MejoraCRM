import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name merger)", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("merges multiple classes", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("handles conditional classes", () => {
    const condition = false;
    const result = cn("base", condition && "hidden", "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("deduplicates conflicting tailwind classes", () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("handles undefined and null gracefully", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toContain("base");
    expect(result).toContain("end");
  });

  it("handles arrays", () => {
    const result = cn(["a", "b"], "c");
    expect(result).toContain("a");
    expect(result).toContain("b");
    expect(result).toContain("c");
  });
});
