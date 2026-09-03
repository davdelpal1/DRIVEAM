import { describe, expect, it } from "vitest";

import { barWidth, scoreTone, weightPercent } from "./score-format";

describe("scoreTone", () => {
  it("asigna las bandas como el backend", () => {
    expect(scoreTone(90)).toBe("great");
    expect(scoreTone(85)).toBe("great");
    expect(scoreTone(84)).toBe("good");
    expect(scoreTone(70)).toBe("good");
    expect(scoreTone(60)).toBe("ok");
    expect(scoreTone(49)).toBe("weak");
    expect(scoreTone(null)).toBe("none");
  });
});

describe("barWidth", () => {
  it("recorta al rango 0-100", () => {
    expect(barWidth(42)).toBe("42%");
    expect(barWidth(-5)).toBe("0%");
    expect(barWidth(140)).toBe("100%");
  });
});

describe("weightPercent", () => {
  it("convierte el peso normalizado a porcentaje entero", () => {
    expect(weightPercent("0.31")).toBe("31 %");
    expect(weightPercent("1")).toBe("100 %");
    expect(weightPercent("x")).toBe("");
  });
});
