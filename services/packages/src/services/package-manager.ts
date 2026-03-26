import { ulid } from 'ulid';
import type { PackageInstallRequest, InstalledPackage, PackageManifest } from '../types.js';
import type { DependencyResolver } from './dependency-resolver.js';
import type { ManifestLoader } from './manifest-loader.js';

export class PackageManager {
  private installations = new Map<string, InstalledPackage>();

  constructor(
    private resolver: DependencyResolver,
    private loader: ManifestLoader,
  ) {}

  async install(request: PackageInstallRequest): Promise<InstalledPackage> {
    const id = ulid();
    const installation: InstalledPackage = {
      id,
      workspaceId: request.workspaceId,
      packageName: request.packageName,
      version: '',
      type: 'unknown',
      status: 'pending',
      installedAt: new Date().toISOString(),
      config: request.config ?? {},
    };

    this.installations.set(id, installation);

    try {
      installation.status = 'installing';

      const manifest = await this.loadManifest(request);
      const installed = this.listSync(request.workspaceId);

      const resolved = await this.resolver.resolve(manifest, installed);

      if (resolved.conflicts.length > 0) {
        installation.status = 'failed';
        throw new Error(
          `Dependency conflicts: ${resolved.conflicts
            .map((c) => `${c.name} requires ${c.required} but ${c.installed} is installed`)
            .join('; ')}`,
        );
      }

      installation.version = request.version ?? manifest.version;
      installation.type = manifest.type;
      installation.status = 'installed';

      return { ...installation };
    } catch (err) {
      installation.status = 'failed';
      throw err;
    }
  }

  async upgrade(installationId: string, targetVersion?: string): Promise<InstalledPackage> {
    const installation = this.installations.get(installationId);
    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }

    const previousVersion = installation.version;
    installation.status = 'installing';

    try {
      const manifest = await this.loadManifest({
        workspaceId: installation.workspaceId,
        packageName: installation.packageName,
        version: targetVersion,
      });

      const otherInstalled = this.listSync(installation.workspaceId).filter(
        (pkg) => pkg.id !== installationId,
      );

      const resolved = await this.resolver.resolve(manifest, otherInstalled);

      if (resolved.conflicts.length > 0) {
        installation.status = 'installed';
        installation.version = previousVersion;
        throw new Error(
          `Upgrade conflicts: ${resolved.conflicts
            .map((c) => `${c.name} requires ${c.required} but ${c.installed} is installed`)
            .join('; ')}`,
        );
      }

      installation.version = targetVersion ?? manifest.version;
      installation.type = manifest.type;
      installation.status = 'installed';

      return { ...installation };
    } catch (err) {
      if (installation.status === 'installing') {
        installation.status = 'installed';
        installation.version = previousVersion;
      }
      throw err;
    }
  }

  async remove(installationId: string): Promise<void> {
    const installation = this.installations.get(installationId);
    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }

    installation.status = 'removing';
    this.installations.delete(installationId);
  }

  async list(workspaceId: string): Promise<InstalledPackage[]> {
    return this.listSync(workspaceId);
  }

  async getStatus(installationId: string): Promise<InstalledPackage> {
    const installation = this.installations.get(installationId);
    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }
    return { ...installation };
  }

  private listSync(workspaceId: string): InstalledPackage[] {
    return Array.from(this.installations.values()).filter(
      (pkg) => pkg.workspaceId === workspaceId,
    );
  }

  private async loadManifest(request: PackageInstallRequest): Promise<PackageManifest> {
    if (request.source?.startsWith('https://github.com')) {
      return this.loader.loadFromGitHub(request.source, request.version);
    }

    if (request.source) {
      return this.loader.loadFromPath(request.source);
    }

    return this.loader.loadFromPackagehub(request.packageName, request.version);
  }
}
