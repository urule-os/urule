export interface PolicyInput {
  action: string;
  resource: {
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
  };
  subject: {
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
}

export interface PolicyResult {
  allowed: boolean;
  reasons: string[];
  obligations?: string[];
}

export interface AuthzCheckInput {
  user: string;
  relation: string;
  object: string;
}

export interface AuthzCheckResult {
  allowed: boolean;
}

export interface GovernanceDecision {
  allowed: boolean;
  policyResult: PolicyResult;
  authzResult: AuthzCheckResult;
  requiresApproval: boolean;
  approvalReason?: string;
}

export interface GovernanceRequest {
  action: string;
  resource: {
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
  };
  subject: {
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
}
