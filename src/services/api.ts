import { AlertRecord, SystemSettings } from "../types";

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const res = await fetch("/api/settings");
  return res.json();
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export async function fetchAlerts(): Promise<{ alerts: AlertRecord[]; averageLatencyMs: number; slaTargetMs: number }> {
  const res = await fetch("/api/alerts");
  return res.json();
}

export async function simulateAlert(params: {
  scenario: "rattlesnake" | "copperhead" | "black_mamba" | "garter_snake" | "garden_hose" | "tree_root";
  isNightMode?: boolean;
  consecutiveHits?: number;
}): Promise<{ success: boolean; alert: AlertRecord; confirmed: boolean }> {
  const res = await fetch("/api/alerts/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function verifyFrameWithAI(payload: {
  imageBase64?: string;
  userPrompt?: string;
  isNightMode?: boolean;
}): Promise<any> {
  const res = await fetch("/api/edge/verify-frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchUserGuideText(): Promise<string> {
  const res = await fetch("/api/files/user-guide");
  const data = await res.json();
  return data.content || "";
}

export async function fetchReadmeText(): Promise<string> {
  const res = await fetch("/api/files/readme");
  const data = await res.json();
  return data.content || "";
}

export async function fetchEdgeScript(): Promise<string> {
  const res = await fetch("/api/files/edge-script");
  const data = await res.json();
  return data.content || "";
}

export async function fetchTrainingScript(): Promise<string> {
  const res = await fetch("/api/files/training-script");
  const data = await res.json();
  return data.content || "";
}
