import { describe, it, expect } from 'vitest';
import { DependencyResolver } from '../src/services/dependency-resolver.js';
import type { PackageManifest, InstalledPackage } from '../src/types.js';

function makeManifest(overrides: Partial<PackageManifest> = {}): PackageManifest {
  return {
    name: 'test-package',
    version: '1.0.0',
    type: 'agent',
    description: 'A test package',
    ...overrides,
  };
}

function makeInstalled(overrides: Partial<InstalledPackage> = {}): InstalledPackage {
  return {
    id: 'inst-1',
    workspaceId: 'ws-1',
    packageName: 'dep-a',
    version: '1.0.0',
    type: 'library',
    status: 'installed',
    installedAt: new Date().toISOString(),
    config: {},
    ...overrides,
  };
}

describe('DependencyResolver', () => {
  const resolver = new DependencyResolver();

  describe('resolve', () => {
    it('should return empty results when manifest has no dependencies', async () => {
      const manifest = makeManifest();
      const result = await resolver.resolve(manifest, []);

      expect(result.toInstall).toEqual([]);
      expect(result.toUpgrade).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('should mark uninstalled dependencies for installation', async () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^1.0.0', 'dep-b': '^2.0.0' },
      });

      const result = await resolver.resolve(manifest, []);

      expect(result.toInstall).toHaveLength(2);
      expect(result.toInstall).toContainEqual({ name: 'dep-a', version: '1.0.0' });
      expect(result.toInstall).toContainEqual({ name: 'dep-b', version: '2.0.0' });
    });

    it('should skip dependencies that are already satisfied', async () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^1.0.0' },
      });
      const installed = [makeInstalled({ packageName: 'dep-a', version: '1.2.3' })];

      const result = await resolver.resolve(manifest, installed);

      expect(result.toInstall).toHaveLength(0);
      expect(result.toUpgrade).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect when an upgrade is needed', async () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^2.0.0' },
      });
      const installed = [makeInstalled({ packageName: 'dep-a', version: '1.5.0' })];

      const result = await resolver.resolve(manifest, installed);

      expect(result.toUpgrade).toHaveLength(1);
      expect(result.toUpgrade[0]).toEqual({
        name: 'dep-a',
        from: '1.5.0',
        to: '2.0.0',
      });
    });

    it('should detect conflicts when installed version is newer than required range', async () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '~1.0.0' },
      });
      const installed = [makeInstalled({ packageName: 'dep-a', version: '2.0.0' })];

      const result = await resolver.resolve(manifest, installed);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual({
        name: 'dep-a',
        required: '~1.0.0',
        installed: '2.0.0',
      });
    });
  });

  describe('checkConflicts', () => {
    it('should report no conflicts when all deps are satisfied', () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^1.0.0' },
      });
      const installed = [makeInstalled({ packageName: 'dep-a', version: '1.3.0' })];

      const result = resolver.checkConflicts(manifest, installed);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should report conflicts for unsatisfied versions', () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^3.0.0' },
      });
      const installed = [makeInstalled({ packageName: 'dep-a', version: '2.1.0' })];

      const result = resolver.checkConflicts(manifest, installed);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual({
        name: 'dep-a',
        required: '^3.0.0',
        installed: '2.1.0',
      });
    });

    it('should ignore dependencies that are not installed', () => {
      const manifest = makeManifest({
        dependencies: { 'dep-a': '^1.0.0' },
      });

      const result = resolver.checkConflicts(manifest, []);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });
});
