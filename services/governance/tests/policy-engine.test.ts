import { describe, it, expect } from "vitest";
import { InMemoryPolicyEngine } from "../src/services/policy-engine.js";
import type { PolicyInput } from "../src/types.js";

function makePolicyInput(action: string): PolicyInput {
  return {
    action,
    resource: { type: "document", id: "doc-1" },
    subject: { type: "user", id: "user-1" },
  };
}

describe("PolicyEngine", () => {
  it("should allow when matching rule is allowed", async () => {
    const engine = new InMemoryPolicyEngine();
    engine.addRule("read", true, "Read access granted");

    const result = await engine.evaluate(makePolicyInput("read"));

    expect(result.allowed).toBe(true);
    expect(result.reasons).toContain("Read access granted");
  });

  it("should deny when matching rule is denied", async () => {
    const engine = new InMemoryPolicyEngine();
    engine.addRule("delete", false, "Delete not permitted");

    const result = await engine.evaluate(makePolicyInput("delete"));

    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("Delete not permitted");
  });

  it("should default deny when no matching rule exists", async () => {
    const engine = new InMemoryPolicyEngine();
    engine.addRule("write", true, "Write access granted");

    const result = await engine.evaluate(makePolicyInput("read"));

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual([
      "No matching policy rule found — default deny",
    ]);
  });

  it("should evaluate multiple matching rules — all must allow", async () => {
    const engine = new InMemoryPolicyEngine();
    engine.addRule("read", true, "Basic read allowed");
    engine.addRule("*", true, "Global allow");

    const result = await engine.evaluate(makePolicyInput("read"));

    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(2);
  });

  it("should deny when any matching rule denies", async () => {
    const engine = new InMemoryPolicyEngine();
    engine.addRule("read", true, "Basic read allowed");
    engine.addRule("*", false, "Global deny override");

    const result = await engine.evaluate(makePolicyInput("read"));

    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });
});
