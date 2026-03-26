import { describe, it, expect } from "vitest";
import { InMemoryAuthzEngine } from "../src/services/authz-engine.js";

describe("AuthzEngine", () => {
  it("should allow when a matching tuple exists", async () => {
    const engine = new InMemoryAuthzEngine();
    engine.addTuple("user:alice", "viewer", "document:doc-1");

    const result = await engine.check({
      user: "user:alice",
      relation: "viewer",
      object: "document:doc-1",
    });

    expect(result.allowed).toBe(true);
  });

  it("should deny when no matching tuple exists", async () => {
    const engine = new InMemoryAuthzEngine();
    engine.addTuple("user:alice", "viewer", "document:doc-1");

    const result = await engine.check({
      user: "user:bob",
      relation: "viewer",
      object: "document:doc-1",
    });

    expect(result.allowed).toBe(false);
  });

  it("should handle batch check with mixed results", async () => {
    const engine = new InMemoryAuthzEngine();
    engine.addTuple("user:alice", "viewer", "document:doc-1");
    engine.addTuple("user:alice", "editor", "document:doc-2");

    const results = await engine.batchCheck([
      { user: "user:alice", relation: "viewer", object: "document:doc-1" },
      { user: "user:alice", relation: "editor", object: "document:doc-1" },
      { user: "user:alice", relation: "editor", object: "document:doc-2" },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(false);
    expect(results[2].allowed).toBe(true);
  });
});
