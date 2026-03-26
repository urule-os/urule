export interface PackageInstallRequest {
  workspaceId: string;
  packageName: string;
  version?: string;
  source?: string;
  config?: Record<string, unknown>;
}

export interface InstalledPackage {
  id: string;
  workspaceId: string;
  packageName: string;
  version: string;
  type: string;
  status: 'pending' | 'installing' | 'installed' | 'failed' | 'removing';
  installedAt: string;
  config: Record<string, unknown>;
}

export interface PackageManifest {
  name: string;
  version: string;
  type: string;
  description: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface ResolvedDeps {
  toInstall: Array<{ name: string; version: string }>;
  toUpgrade: Array<{ name: string; from: string; to: string }>;
  conflicts: Array<{ name: string; required: string; installed: string }>;
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Array<{ name: string; required: string; installed: string }>;
}
