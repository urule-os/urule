import { describe, it, expect } from 'vitest';
import { getUruleScaffolderActions } from '../src/scaffolder/actions.js';

describe('ScaffolderActions', () => {
  it('returns all expected actions', () => {
    const actions = getUruleScaffolderActions();
    const ids = actions.map((a) => a.id);

    expect(ids).toContain('urule:workspace:create');
    expect(ids).toContain('urule:agent:register');
    expect(ids).toContain('urule:package:install');
    expect(ids).toContain('urule:mcp:bind');
    expect(actions).toHaveLength(4);
  });

  it('all actions have valid schema', () => {
    const actions = getUruleScaffolderActions();

    for (const action of actions) {
      expect(action.id).toBeTruthy();
      expect(action.description).toBeTruthy();
      expect(action.schema.input).toBeTruthy();
      expect(action.schema.output).toBeTruthy();
    }
  });
});
