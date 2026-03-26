import type { FastifyInstance } from "fastify";
import type { GovernanceService } from "../services/governance.js";
import type { PolicyEngine } from "../services/policy-engine.js";
import type { AuthzEngine } from "../services/authz-engine.js";
import type {
  AuthzCheckInput,
  GovernanceRequest,
  PolicyInput,
} from "../types.js";

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
      return reply.send(decision);
    },
  );

  app.post<{ Body: PolicyInput }>(
    "/api/v1/governance/policy/evaluate",
    async (request, reply) => {
      const result = await deps.policy.evaluate(request.body);
      return reply.send(result);
    },
  );

  app.post<{ Body: AuthzCheckInput }>(
    "/api/v1/governance/authz/check",
    async (request, reply) => {
      const result = await deps.authz.check(request.body);
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
