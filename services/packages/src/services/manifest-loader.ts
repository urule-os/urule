import { simpleGit } from 'simple-git';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { PackageManifest } from '../types.js';

export class ManifestLoader {
  constructor(private workDir: string, private packagehubUrl: string) {}

  async loadFromGitHub(repoUrl: string, ref?: string): Promise<PackageManifest> {
    const tempDir = await mkdtemp(join(this.workDir || tmpdir(), 'pkg-'));
    const git = simpleGit();

    try {
      const cloneOpts = ['--depth', '1'];
      if (ref) {
        cloneOpts.push('--branch', ref);
      }
      await git.clone(repoUrl, tempDir, cloneOpts);

      return await this.loadFromPath(tempDir);
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async loadFromPath(dirPath: string): Promise<PackageManifest> {
    // Try urule-package.json first, then package.json
    const candidates = [
      join(dirPath, 'urule-package.json'),
      join(dirPath, 'package.json'),
    ];

    for (const candidate of candidates) {
      try {
        const raw = await readFile(candidate, 'utf-8');
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return this.validateManifest(parsed);
      } catch {
        // Try next candidate
      }
    }

    throw new Error(`No valid manifest found in ${dirPath}`);
  }

  async loadFromPackagehub(name: string, version?: string): Promise<PackageManifest> {
    const versionParam = version ? `?version=${encodeURIComponent(version)}` : '';
    const url = `${this.packagehubUrl}/api/v1/packages/${encodeURIComponent(name)}/manifest${versionParam}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest from packagehub: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.validateManifest(data);
  }

  private validateManifest(data: Record<string, unknown>): PackageManifest {
    if (typeof data['name'] !== 'string' || !data['name']) {
      throw new Error('Manifest missing required field: name');
    }
    if (typeof data['version'] !== 'string' || !data['version']) {
      throw new Error('Manifest missing required field: version');
    }

    return {
      name: data['name'] as string,
      version: data['version'] as string,
      type: (data['type'] as string) ?? 'unknown',
      description: (data['description'] as string) ?? '',
      dependencies: data['dependencies'] as Record<string, string> | undefined,
      ...data,
    };
  }
}
