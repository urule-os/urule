import type { PolicyInput, PolicyResult } from "../types.js";

export class PolicyEngine {
  constructor(protected opaUrl: string) {}

  async evaluate(input: PolicyInput): Promise<PolicyResult> {
    const policyPath = `v1/data/governance/${input.action}`;
    return this.evaluatePolicy(policyPath, { input });
  }

  async evaluatePolicy(
    policyPath: string,
    input: Record<string, unknown>,
  ): Promise<PolicyResult> {
    const url = `${this.opaUrl}/${policyPath}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return {
        allowed: false,
        reasons: [`OPA request failed: ${response.status} ${response.statusText}`],
      };
    }

    const data = (await response.json()) as {
      result?: {
        allow?: boolean;
        reasons?: string[];
        obligations?: string[];
      };
    };

    const result = data.result;

    return {
      allowed: result?.allow ?? false,
      reasons: result?.reasons ?? [],
      obligations: result?.obligations,
    };
  }
}

interface Rule {
  pattern: string;
  allowed: boolean;
  reason: string;
}

export class InMemoryPolicyEngine extends PolicyEngine {
  private rules: Rule[] = [];

  constructor() {
    super("in-memory");
  }

  addRule(pattern: string, allowed: boolean, reason: string): void {
    this.rules.push({ pattern, allowed, reason });
  }

  override async evaluate(input: PolicyInput): Promise<PolicyResult> {
    const matchingRules = this.rules.filter((rule) =>
      input.action.includes(rule.pattern) || rule.pattern === "*",
    );

    if (matchingRules.length === 0) {
      return {
        allowed: false,
        reasons: ["No matching policy rule found — default deny"],
      };
    }

    const allowed = matchingRules.every((rule) => rule.allowed);
    const reasons = matchingRules.map((rule) => rule.reason);
    const obligations: string[] = [];

    for (const rule of matchingRules) {
      if (rule.reason.startsWith("obligation:")) {
        obligations.push(rule.reason.replace("obligation:", "").trim());
      }
    }

    return {
      allowed,
      reasons,
      obligations: obligations.length > 0 ? obligations : undefined,
    };
  }

  override async evaluatePolicy(
    _policyPath: string,
    input: Record<string, unknown>,
  ): Promise<PolicyResult> {
    const policyInput = input.input as PolicyInput | undefined;
    if (policyInput) {
      return this.evaluate(policyInput);
    }
    return {
      allowed: false,
      reasons: ["No input provided"],
    };
  }
}
