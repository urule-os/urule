"use client";

import SandboxTerminal from "@/components/agents/SandboxTerminal";
import { useWidget } from "@/widgets/context";

export default function SandboxTerminalWidget() {
  const { workspaceId } = useWidget();
  return <SandboxTerminal workspaceId={workspaceId} />;
}
