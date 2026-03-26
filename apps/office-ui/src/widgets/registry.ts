import type { ComponentType } from "react";
import type { WidgetManifest, WidgetInstance, WidgetMountPoint } from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter++;
  return `wi-${Date.now()}-${idCounter}`;
}

/**
 * Client-side widget registry.
 * Stores manifests and instances, maps componentPath to lazy-loaded React components.
 */
class ClientWidgetRegistry {
  private manifests = new Map<string, WidgetManifest>();
  private instances = new Map<string, WidgetInstance>();
  private componentMap = new Map<string, ComponentType<Record<string, unknown>>>();

  registerManifest(manifest: WidgetManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  getManifest(id: string): WidgetManifest | undefined {
    return this.manifests.get(id);
  }

  listManifests(filter?: {
    category?: string;
    mountPoint?: WidgetMountPoint;
    entryType?: "native" | "external";
  }): WidgetManifest[] {
    let results = Array.from(this.manifests.values());
    if (filter?.category) {
      results = results.filter((m) => m.category === filter.category);
    }
    if (filter?.mountPoint) {
      results = results.filter((m) => m.mountPoints.includes(filter.mountPoint!));
    }
    if (filter?.entryType) {
      results = results.filter((m) => m.entryType === filter.entryType);
    }
    return results;
  }

  registerComponent(componentPath: string, component: ComponentType<Record<string, unknown>>): void {
    this.componentMap.set(componentPath, component);
  }

  getComponent(componentPath: string): ComponentType<Record<string, unknown>> | undefined {
    return this.componentMap.get(componentPath);
  }

  createInstance(params: {
    manifestId: string;
    workspaceId: string;
    mountPoint: WidgetMountPoint;
    config?: Record<string, unknown>;
    position?: number;
  }): WidgetInstance {
    const manifest = this.manifests.get(params.manifestId);
    if (!manifest) throw new Error(`Manifest not found: ${params.manifestId}`);

    const now = new Date().toISOString();
    const instance: WidgetInstance = {
      id: nextId(),
      manifestId: params.manifestId,
      workspaceId: params.workspaceId,
      mountPoint: params.mountPoint,
      position: params.position ?? 0,
      config: params.config ?? { ...manifest.defaultConfig },
      createdAt: now,
      updatedAt: now,
    };

    this.instances.set(instance.id, instance);
    return instance;
  }

  getInstance(id: string): WidgetInstance | undefined {
    return this.instances.get(id);
  }

  getInstancesByMountPoint(workspaceId: string, mountPoint: WidgetMountPoint): WidgetInstance[] {
    return Array.from(this.instances.values())
      .filter((i) => i.workspaceId === workspaceId && i.mountPoint === mountPoint)
      .sort((a, b) => a.position - b.position);
  }

  removeInstance(id: string): boolean {
    return this.instances.delete(id);
  }
}

/** Singleton registry for the app */
export const widgetRegistry = new ClientWidgetRegistry();
