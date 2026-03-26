import { describe, it, expect } from "vitest";
import { GovernanceService } from "../src/services/governance.js";
import { InMemoryPolicyEngine } from "../src/services/policy-engine.js";
import { InMemoryAuthzEngine } from "../src/services/authz-engine.js";
import type { GovernanceRequest } from "../src/types.js";

function makeRequest(action: string): GovernanceRequest {
  return {
    action,
    resource: { type: "document", id: "doc-1" },
    subject: { type: "user", id: "alice" },
  };
}

describe("GovernanceService", () => {
  it("should allow when both policy and authz pass", async () => {
    const policy = new InMemoryPolicyEngine();
    policy.addRule("read", true, "Read allowed by policy");

    const authz = new InMemoryAuthzEngine();
    authz.addTuple("user:alice", "read", "document:doc-1");

    const governance = new GovernanceService(policy, authz);
    const decision = await governance.decide(makeRequest("read"));

    expect(decision.allowed).toBe(true);
    expect(decision.policyResult.allowed).toBe(true);
    expect(decision.authzResult.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);
  });

  it("should deny when policy denies", async () => {
    const policy = new InMemoryPolicyEngine();
    policy.addRule("delete", false, "Deletion not permitted");

    const authz = new InMemoryAuthzEngine();
    authz.addTuple("user:alice", "delete", "document:doc-1");

    const governance = new GovernanceService(policy, authz);
    const decision = await governance.decide(makeRequest("delete"));

    expect(decision.allowed).toBe(false);
    expect(decision.policyResult.allowed).toBe(false);
    expect(decision.authzResult.allowed).toBe(true);
  });

  it("should deny when authz denies", async () => {
    const policy = new InMemoryPolicyEngine();
    policy.addRule("write", true, "Write allowed by policy");

    const authz = new InMemoryAuthzEngine();
    // No tuple added for this user/action/object

    const governance = new GovernanceService(policy, authz);
    const decision = await governance.decide(makeRequest("write"));

    expect(decision.allowed).toBe(false);
    expect(decision.policyResult.allowed).toBe(true);
    expect(decision.authzResult.allowed).toBe(false);
  });

  it("should flag requiresApproval when policy has obligations", async () => {
    const policy = new InMemoryPolicyEngine();
    policy.addRule("deploy", true, "obligation:manager-approval-required");

    const authz = new InMemoryAuthzEngine();
    authz.addTuple("user:alice", "deploy", "document:doc-1");

    const governance = new GovernanceService(policy, authz);
    const decision = await governance.decide(makeRequest("deploy"));

    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
    expect(decision.approvalReason).toBe("manager-approval-required");
  });
});
