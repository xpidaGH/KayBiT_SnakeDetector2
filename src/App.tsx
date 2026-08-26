/**
 * KayBiT_SnakeDetector — Autonomous Edge-AI Detection & Sub-3s Mobile Alert Ecosystem
 * @license Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Radio,
  BookOpen,
  Zap,
  Sliders,
  Bell,
  Cpu,
  Layers,
  Database,
  Code2,
  Filter,
  Moon,
  Camera,
  Activity,
  CheckCircle2,
  Flame,
  Volume2,
  RefreshCw,
  Eye,
  Info
} from "lucide-react";
import { AndroidPhoneSimulator } from "./components/AndroidPhoneSimulator";
import { LiveEdgeFeed } from "./components/LiveEdgeFeed";
import { LatencyInstrumentation } from "./components/LatencyInstrumentation";
import { FalsePositiveTestBench } from "./components/FalsePositiveTestBench";
import { NightVisionSimulator } from "./components/NightVisionSimulator";
import { DatasetTrainingSuite } from "./components/DatasetTrainingSuite";
import { EdgeScriptViewer } from "./components/EdgeScriptViewer";
import { HardwareHealth } from "./components/HardwareHealth";
import { UserGuideModal } from "./components/UserGuideModal";
import { AlertRecord, SystemSettings } from "./types";
import {
  fetchAlerts,
  fetchSystemSettings,
  saveSystemSettings,
  simulateAlert
} from "./services/api";
import { sirenSynthesizer } from "./services/audioSiren";

export default function App() {
  const [activeTab, setActiveTab] = useState<"stream" | "latency" | "false_positives" | "night_vision" | "dataset" | "hardware" | "scripts">("stream");
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<AlertRecord | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    consecutiveFramesN: 4,
    confidenceThreshold: 0.60,
    nightVisionMode: false,
    alarmSirenEnabled: true,
    fcmPushChannel: "kaybit_high_priority_alerts",
    fcmDeviceToken: "fcm-token-android-pixel8-pro-2898",
    edgeCameraSource: "EDGE-CAM-01-PATIO",
    autoDispatchWebhook: true,
    targetSlaMs: 3000
  });

  // Load initial settings and alerts
  useEffect(() => {
    fetchSystemSettings().then(setSystemSettings).catch(console.error);
    fetchAlerts().then((data) => setAlerts(data.alerts || [])).catch(console.error);

    // Periodic poll for incoming edge alerts
    const interval = setInterval(() => {
      fetchAlerts().then((data) => setAlerts(data.alerts || [])).catch(console.error);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAlert = async (scenario: "rattlesnake" | "copperhead" | "black_mamba" | "garter_snake" | "garden_hose" | "tree_root") => {
    try {
      const res = await simulateAlert({
        scenario,
        isNightMode: systemSettings.nightVisionMode,
        consecutiveHits: systemSettings.consecutiveFramesN
      });
      if (res.success && res.alert) {
        setAlerts((prev) => [res.alert, ...prev]);
        if (res.confirmed) {
          setActiveAlert(res.alert);
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const handleToggleNightMode = () => {
    const nextMode = !systemSettings.nightVisionMode;
    setSystemSettings((prev) => ({ ...prev, nightVisionMode: nextMode }));
    saveSystemSettings({ nightVisionMode: nextMode }).catch(console.error);
  };

  const handleDismissAlert = () => {
    setActiveAlert(null);
    sirenSynthesizer.stopAlarm();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top System Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              KayBiT<span className="text-amber-400 font-light">_SnakeDetector</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                EDGE NODE ONLINE
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Edge-AI Autonomous Detection • N-Frame False Positive Rejection • Sub-3s Mobile Alarm
            </p>
          </div>
        </div>

        {/* Global Action Bar: Quick Trigger, Siren, User Guide button */}
        <div className="flex items-center gap-2.5">
          {/* Quick Simulation Trigger */}
          <button
            id="quick-trigger-rattlesnake-btn"
            onClick={() => handleSimulateAlert("rattlesnake")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Trigger</span> <span>Hazard Alarm</span>
          </button>

          {/* User Guide Button (Top bar shortcut in addition to splash screen) */}
          <button
            id="topbar-user-guide-btn"
            onClick={() => setIsUserGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>User Guide</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Control Center (Left) & Android Phone Emulator (Right) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Modular Navigation & Workspaces (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col space-y-5">
          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none text-xs">
            <button
              id="tab-stream"
              onClick={() => setActiveTab("stream")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "stream"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Edge Stream</span>
            </button>

            <button
              id="tab-latency"
              onClick={() => setActiveTab("latency")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "latency"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sub-3s Latency Telemetry</span>
            </button>

            <button
              id="tab-false-positives"
              onClick={() => setActiveTab("false_positives")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "false_positives"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Hose/Root N-Frame Filter</span>
            </button>

            <button
              id="tab-night-vision"
              onClick={() => setActiveTab("night_vision")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "night_vision"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night Vision IR Augmentation</span>
            </button>

            <button
              id="tab-dataset"
              onClick={() => setActiveTab("dataset")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "dataset"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dataset & YOLO Training</span>
            </button>

            <button
              id="tab-hardware"
              onClick={() => setActiveTab("hardware")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "hardware"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware Health</span>
            </button>

            <button
              id="tab-scripts"
              onClick={() => setActiveTab("scripts")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-medium whitespace-nowrap ${
                activeTab === "scripts"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Edge Daemon</span>
            </button>
          </div>

          {/* Active Workspace View */}
          {activeTab === "stream" && (
            <LiveEdgeFeed
              systemSettings={systemSettings}
              onTriggerAlert={handleSimulateAlert}
              onToggleNightMode={handleToggleNightMode}
              nightMode={systemSettings.nightVisionMode}
            />
          )}

          {activeTab === "latency" && (
            <LatencyInstrumentation
              alerts={alerts}
              targetSlaMs={systemSettings.targetSlaMs}
            />
          )}

          {activeTab === "false_positives" && (
            <FalsePositiveTestBench onSimulateDetection={handleSimulateAlert} />
          )}

          {activeTab === "night_vision" && (
            <NightVisionSimulator />
          )}

          {activeTab === "dataset" && (
            <DatasetTrainingSuite />
          )}

          {activeTab === "hardware" && (
            <HardwareHealth />
          )}

          {activeTab === "scripts" && (
            <EdgeScriptViewer />
          )}

          {/* System Telemetry & Alert Activity Stream (Always visible below workspace) */}
          <div className="p-4 lg:p-5 rounded-3xl bg-slate-900 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Recent Edge Detection & Webhook Log
              </span>
              <span className="text-[11px] font-mono text-slate-500">Auto-Refreshed • 30 FPS</span>
            </div>

            <div className="space-y-2">
              {alerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                    a.riskLevel === "FALSE POSITIVE REJECTED"
                      ? "bg-slate-950/60 border-slate-800 text-slate-400"
                      : "bg-rose-950/20 border-rose-800/40 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${
                      a.riskLevel === "FALSE POSITIVE REJECTED" ? "bg-slate-600" : "bg-rose-500 animate-ping"
                    }`} />
                    <div>
                      <span className="font-bold text-white block">{a.species}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.timestamp).toLocaleTimeString()} • Streak: {a.consecutiveStreak}/{a.requiredStreak} • Conf: {(a.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      ⚡ {a.latencies.totalEndToEndMs} ms
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      a.slaPass ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {a.slaPass ? "SLA PASS (<3s)" : "SLA VIOLATION"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Android Phone Simulator with Splash Screen, User Guide button & Warning UI (4 Columns) */}
        <div className="xl:col-span-4 flex flex-col items-center sticky top-20">
          <div className="mb-2 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400" /> Android Mobile Client Emulator
            </span>
            <span className="text-[10px] text-slate-500 block">
              FCM Background Wake • Warning UI • Multi-Tone Siren Sound
            </span>
          </div>

          <AndroidPhoneSimulator
            activeAlert={activeAlert}
            onDismissAlert={handleDismissAlert}
            onOpenUserGuide={() => setIsUserGuideOpen(true)}
            onSimulateDetection={handleSimulateAlert}
            systemSettings={systemSettings}
            onToggleNightMode={handleToggleNightMode}
          />
        </div>
      </main>

      {/* User Guide Modal (Loads USER_GUIDE.md directly as requested) */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}
