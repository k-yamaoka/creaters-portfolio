import { describe, expect, it } from "vitest";
import {
  CLIENT_TEMPLATES,
  CREATOR_TEMPLATES,
  templatesFor,
} from "@/lib/message-templates";

describe("message-templates: 基本形", () => {
  it("creator テンプレは 1+ 個", () => {
    expect(CREATOR_TEMPLATES.length).toBeGreaterThan(0);
  });
  it("client テンプレは 1+ 個", () => {
    expect(CLIENT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("各テンプレは id / category / title / body 必須", () => {
    for (const t of [...CREATOR_TEMPLATES, ...CLIENT_TEMPLATES]) {
      expect(t.id).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.body).toBeTruthy();
      expect(t.body.length).toBeGreaterThan(10);
    }
  });

  it("id は全体で unique", () => {
    const all = [...CREATOR_TEMPLATES, ...CLIENT_TEMPLATES];
    const ids = all.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("message-templates: templatesFor(role) の分岐", () => {
  it("creator → CREATOR_TEMPLATES", () => {
    expect(templatesFor("creator")).toBe(CREATOR_TEMPLATES);
  });
  it("client → CLIENT_TEMPLATES", () => {
    expect(templatesFor("client")).toBe(CLIENT_TEMPLATES);
  });
  it("admin → CREATOR_TEMPLATES (fallback)", () => {
    expect(templatesFor("admin")).toBe(CREATOR_TEMPLATES);
  });
  it("undefined → CREATOR_TEMPLATES (fallback)", () => {
    expect(templatesFor(undefined)).toBe(CREATOR_TEMPLATES);
  });
});
