import type { AuthzCheckInput, AuthzCheckResult } from "../types.js";

export class AuthzEngine {
  constructor(
    protected openfgaUrl: string,
    protected storeId: string,
  ) {}

  async check(input: AuthzCheckInput): Promise<AuthzCheckResult> {
    const url = `${this.openfgaUrl}/stores/${this.storeId}/check`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tuple_key: {
          user: input.user,
          relation: input.relation,
          object: input.object,
        },
      }),
    });

    if (!response.ok) {
      return { allowed: false };
    }

    const data = (await response.json()) as { allowed?: boolean };
    return { allowed: data.allowed ?? false };
  }

  async batchCheck(inputs: AuthzCheckInput[]): Promise<AuthzCheckResult[]> {
    return Promise.all(inputs.map((input) => this.check(input)));
  }
}

interface Tuple {
  user: string;
  relation: string;
  object: string;
}

export class InMemoryAuthzEngine extends AuthzEngine {
  private tuples: Tuple[] = [];

  constructor() {
    super("in-memory", "in-memory-store");
  }

  addTuple(user: string, relation: string, object: string): void {
    this.tuples.push({ user, relation, object });
  }

  override async check(input: AuthzCheckInput): Promise<AuthzCheckResult> {
    const found = this.tuples.some(
      (tuple) =>
        tuple.user === input.user &&
        tuple.relation === input.relation &&
        tuple.object === input.object,
    );
    return { allowed: found };
  }

  override async batchCheck(
    inputs: AuthzCheckInput[],
  ): Promise<AuthzCheckResult[]> {
    return Promise.all(inputs.map((input) => this.check(input)));
  }
}
