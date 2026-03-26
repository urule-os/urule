import type {
  AuthzCheckInput,
  GovernanceDecision,
  GovernanceRequest,
  PolicyInput,
} from "../types.js";
import type { AuthzEngine } from "./authz-engine.js";
import type { PolicyEngine } from "./policy-engine.js";

export class GovernanceService {
  constructor(
    private policy: PolicyEngine,
    private authz: AuthzEngine,
  ) {}

  async decide(request: GovernanceRequest): Promise<GovernanceDecision> {
    const policyInput: PolicyInput = {
      action: request.action,
      resource: request.resource,
      subject: request.subject,
      context: request.context,
    };

    const authzInput: AuthzCheckInput = {
      user: `${request.subject.type}:${request.subject.id}`,
      relation: request.action,
      object: `${request.resource.type}:${request.resource.id}`,
    };

    const [policyResult, authzResult] = await Promise.all([
      this.policy.evaluate(policyInput),
      this.authz.check(authzInput),
    ]);

    const allowed = policyResult.allowed && authzResult.allowed;

    const requiresApproval =
      Array.isArray(policyResult.obligations) &&
      policyResult.obligations.length > 0;

    const approvalReason = requiresApproval
      ? policyResult.obligations!.join("; ")
      : undefined;

    return {
      allowed,
      policyResult,
      authzResult,
      requiresApproval,
      approvalReason,
    };
  }
}
