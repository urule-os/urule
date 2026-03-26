import * as semver from 'semver';
import type { PackageManifest, InstalledPackage, ResolvedDeps, ConflictResult } from '../types.js';

export class DependencyResolver {
  async resolve(manifest: PackageManifest, installed: InstalledPackage[]): Promise<ResolvedDeps> {
    const result: ResolvedDeps = {
      toInstall: [],
      toUpgrade: [],
      conflicts: [],
    };

    const deps = manifest.dependencies ?? {};

    for (const [name, requiredRange] of Object.entries(deps)) {
      const existing = installed.find((pkg) => pkg.packageName === name);

      if (!existing) {
        const resolved = semver.minVersion(requiredRange);
        result.toInstall.push({
          name,
          version: resolved?.version ?? requiredRange,
        });
        continue;
      }

      if (semver.satisfies(existing.version, requiredRange)) {
        // Already satisfied, nothing to do
        continue;
      }

      const existingParsed = semver.parse(existing.version);
      const minRequired = semver.minVersion(requiredRange);

      if (existingParsed && minRequired && semver.gt(minRequired, existingParsed)) {
        result.toUpgrade.push({
          name,
          from: existing.version,
          to: minRequired.version,
        });
      } else {
        result.conflicts.push({
          name,
          required: requiredRange,
          installed: existing.version,
        });
      }
    }

    return result;
  }

  checkConflicts(manifest: PackageManifest, installed: InstalledPackage[]): ConflictResult {
    const conflicts: ConflictResult['conflicts'] = [];
    const deps = manifest.dependencies ?? {};

    for (const [name, requiredRange] of Object.entries(deps)) {
      const existing = installed.find((pkg) => pkg.packageName === name);

      if (existing && !semver.satisfies(existing.version, requiredRange)) {
        conflicts.push({
          name,
          required: requiredRange,
          installed: existing.version,
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }
}
