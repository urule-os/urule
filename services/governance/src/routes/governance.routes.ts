import type { FastifyInstance } from "fastify";
import type { GovernanceService } from "../services/governance.js";
import type { PolicyEngine } from "../services/policy-engine.js";
import type { AuthzEngine } from "../services/authz-engine.js";
import type {
  AuthzCheckInput,
  GovernanceRequest,
  PolicyInput,
} from "../types.js";
import { AuditLogger } from "@urule/events";

const audit = new AuditLogger("governance", (topic, data) => {
  console.log(JSON.stringify({ audit: true, topic, ...data as Record<string, unknown> }));
});

interface Dependencies {
  governance: GovernanceService;
  policy: PolicyEngine;
  authz: AuthzEngine;
}

export async function governanceRoutes(
  app: FastifyInstance,
  deps: Dependencies,
): Promise<void> {
  app.post<{ Body: GovernanceRequest }>(
    "/api/v1/governance/decide",
    async (request, reply) => {
      const decision = await deps.governance.decide(request.body);

      const body = request.body;
      const user = (request as any).uruleUser;
      audit.configChanged(
        { id: user?.id ?? body.agentId ?? "system", username: user?.username ?? "system" },
        "governance-decision", body.agentId ?? "unknown",
        `Governance decision: ${(decision as any).decision ?? "evaluated"}`,
        { workspaceId: body.workspaceId, metadata: { action: body.action, decision } },
      ).catch(() => {});

      return reply.send(decision);
    },
  );

  app.post<{ Body: PolicyInput }>(
    "/api/v1/governance/policy/evaluate",
    async (request, reply) => {
      const result = await deps.policy.evaluate(request.body);

      const body = request.body;
      const user = (request as any).uruleUser;
      audit.configChanged(
        { id: user?.id ?? "system", username: user?.username ?? "system" },
        "policy", body.policyId ?? "unknown",
        `Policy evaluated: ${(result as any).allowed ? "allowed" : "denied"}`,
        { metadata: { input: body, result } },
      ).catch(() => {});

      return reply.send(result);
    },
  );

  app.post<{ Body: AuthzCheckInput }>(
    "/api/v1/governance/authz/check",
    async (request, reply) => {
      const result = await deps.authz.check(request.body);

      const body = request.body;
      if (!(result as any).allowed) {
        audit.accessDenied(
          { id: body.subjectId ?? "unknown", username: body.subjectId ?? "unknown" },
          body.resourceType ?? "resource", body.resourceId ?? "unknown",
          `Access denied: ${body.action ?? "unknown action"} on ${body.resourceType ?? "resource"}`,
          { metadata: { input: body, result } },
        ).catch(() => {});
      }

      return reply.send(result);
    },
  );

  app.post<{ Body: AuthzCheckInput[] }>(
    "/api/v1/governance/authz/batch-check",
    async (request, reply) => {
      const results = await deps.authz.batchCheck(request.body);
      return reply.send(results);
    },
  );
}
