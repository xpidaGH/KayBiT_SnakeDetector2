import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Bell,
  Volume2,
  VolumeX,
  BookOpen,
  Wifi,
  Battery,
  AlertTriangle,
  Radio,
  Clock,
  PhoneCall,
  Flame,
  CheckCircle2,
  Settings,
  Camera,
  Info,
  Zap,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders
} from "lucide-react";
import { AlertRecord, SystemSettings } from "../types";
import { sirenSynthesizer } from "../services/audioSiren";

interface AndroidPhoneSimulatorProps {
  activeAlert: AlertRecord | null;
  onDismissAlert: () => void;
  onOpenUserGuide: () => void;
  onSimulateDetection: (scenario: any) => void;
  systemSettings: SystemSettings;
  onToggleNightMode: () => void;
}

export const AndroidPhoneSimulator: React.FC<AndroidPhoneSimulatorProps> = ({
  activeAlert,
  onDismissAlert,
  onOpenUserGuide,
  onSimulateDetection,
  systemSettings,
  onToggleNightMode
}) => {
  const [currentScreen, setCurrentScreen] = useState<"splash" | "dashboard" | "alerts" | "encyclopedia" | "settings">("splash");
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(false);
  const [phoneTime, setPhoneTime] = useState<string>("19:09");
  const [simulatedCallActive, setSimulatedCallActive] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setPhoneTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // When a new alert arrives and siren is enabled, play the emergency sound
  useEffect(() => {
    if (activeAlert && activeAlert.riskLevel !== "FALSE POSITIVE REJECTED" && systemSettings.alarmSirenEnabled && !isSirenMuted) {
      sirenSynthesizer.playAlarm(5);
    }
    return () => {
      sirenSynthesizer.stopAlarm();
    };
  }, [activeAlert, isSirenMuted, systemSettings.alarmSirenEnabled]);

  const handleToggleSiren = () => {
    if (sirenSynthesizer.getIsPlaying()) {
      sirenSynthesizer.stopAlarm();
      setIsSirenMuted(true);
    } else {
      sirenSynthesizer.playAlarm(6);
      setIsSirenMuted(false);
    }
  };

  const handleEmergencyCall = () => {
    setSimulatedCallActive(true);
    setTimeout(() => {
      setSimulatedCallActive(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Android Device Outer Bezel */}
      <div
        id="android-phone-frame"
        className="relative w-[340px] sm:w-[360px] h-[720px] bg-slate-950 rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 flex flex-col justify-between overflow-hidden"
      >
        {/* Hardware details: Antenna bands & buttons */}
        <div className="absolute top-28 -left-[9px] w-[3px] h-10 bg-slate-700 rounded-l-md" />
        <div className="absolute top-44 -left-[9px] w-[3px] h-14 bg-slate-700 rounded-l-md" />
        <div className="absolute top-36 -right-[9px] w-[3px] h-12 bg-slate-700 rounded-r-md" />

        {/* Screen Container */}
        <div className="relative flex-1 w-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col border border-slate-800 text-slate-100">
          {/* Android Status Bar with Camera Punch-Hole */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-slate-300 z-30 select-none bg-slate-950/70 backdrop-blur-md">
            <span className="font-mono">{phoneTime}</span>
            {/* Center Camera Punch-hole */}
            <div className="w-4 h-4 bg-black rounded-full border border-slate-800/80 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-950 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* SCREEN 1: SPLASH SCREEN (Contains requested 'User Guide' button) */}
          {currentScreen === "splash" && !activeAlert && (
            <div
              id="android-splash-screen"
              className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center relative overflow-hidden"
            >
              {/* Decorative background radar circle */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-amber-500/10 animate-ping pointer-events-none opacity-40" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/20 pointer-events-none" />

              {/* Splash Header */}
              <div className="pt-6 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>FCM Edge Client Ready</span>
                </div>
                <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/20 mb-4">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  KayBiT<span className="text-amber-400 font-light">_SnakeDetector</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  Edge-AI Autonomous Detection, N-Frame Temporal Rejection & Sub-3s Warning
                </p>
              </div>

              {/* Core System Status Indicators */}
              <div className="space-y-2 z-10 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" /> Edge Camera:
                  </span>
                  <span className="text-emerald-300 font-mono font-medium">Connected (30 FPS)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> False-Positive Filter:
                  </span>
                  <span className="text-blue-300 font-mono font-medium">N={systemSettings.consecutiveFramesN} Consecutive</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Target Latency SLA:
                  </span>
                  <span className="text-amber-300 font-mono font-medium">&lt; 3.0 Seconds</span>
                </div>
              </div>

              {/* Action Buttons: Prominent USER GUIDE button + Enter App button */}
              <div className="space-y-2.5 z-10 pb-4">
                <button
                  id="splash-user-guide-btn"
                  onClick={onOpenUserGuide}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>User Guide (USER_GUIDE.md)</span>
                </button>

                <button
                  id="splash-launch-dashboard-btn"
                  onClick={() => setCurrentScreen("dashboard")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition"
                >
                  <span>Open Security Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: MAIN DASHBOARD */}
          {currentScreen === "dashboard" && !activeAlert && (
            <div id="android-dashboard-screen" className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto scrollbar-none">
              {/* App Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white leading-none">KayBiT Mobile</h2>
                    <span className="text-[10px] text-emerald-400 font-mono">ARMED • LIVE MONITORING</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onOpenUserGuide}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] flex items-center gap-1 border border-slate-700"
                    title="Open User Guide"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Guide</span>
                  </button>
                  <button
                    onClick={handleToggleSiren}
                    className={`p-1.5 rounded-lg border text-xs transition ${
                      sirenSynthesizer.getIsPlaying()
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                    title="Test Siren"
                  >
                    {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Perimeter Live Status Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Edge Node 01 (Patio)
                  </span>
                  <button
                    onClick={onToggleNightMode}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                      systemSettings.nightVisionMode
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        : "bg-slate-700/60 text-slate-300 border-slate-600"
                    }`}
                  >
                    <Eye className="w-2.5 h-2.5" />
                    {systemSettings.nightVisionMode ? "IR 850nm (Active)" : "Daylight RGB"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">N-Frame Filter</span>
                    <p className="text-xs font-bold text-white font-mono">{systemSettings.consecutiveFramesN} Frames Spatial</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Avg E2E Latency</span>
                    <p className="text-xs font-bold text-emerald-400 font-mono">512 ms (&lt;3s SLA)</p>
                  </div>
                </div>
              </div>

              {/* Quick Trigger Simulation Panel for Testing App */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Test Edge Alert Scenarios
                  </span>
                  <span className="text-[9px] text-slate-500">Live Webhook</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onSimulateDetection("rattlesnake")}
                    className="p-2 text-left bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/40 rounded-xl transition group"
                  >
                    <span className="text-[10px] font-bold text-rose-300 block group-hover:text-rose-200">
                      🚨 Rattlesnake (Viper)
                    </span>
                    <span className="text-[9px] text-slate-400">Streak: 4/4 • E2E: ~540ms</span>
                  </button>

                  <button
                    onClick={() => onSimulateDetection("copperhead")}
                    className="p-2 text-left bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/40 rounded-xl transition group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 block group-hover:text-amber-200">
                      ⚠️ Copperhead
                    </span>
                    <span className="text-[9px] text-slate-400">Streak: 4/4 • Pit Viper</span>
                  </button>

                  <button
                    onClick={() => onSimulateDetection("garden_hose")}
                    className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl transition group"
                  >
                    <span className="text-[10px] font-bold text-emerald-300 block">
                      🛡️ Hose (False Pos)
                    </span>
                    <span className="text-[9px] text-slate-400">N-Streak Discards Alarm</span>
                  </button>

                  <button
                    onClick={() => onSimulateDetection("tree_root")}
                    className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl transition group"
                  >
                    <span className="text-[10px] font-bold text-slate-300 block">
                      🛡️ Root (False Pos)
                    </span>
                    <span className="text-[9px] text-slate-400">IoU Streak Resets</span>
                  </button>
                </div>
              </div>

              {/* Recent Edge Logs */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block mb-2">Recent Edge Verification Events</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-200 font-medium">Hose Rejected (2/4 hits)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">18:45:12</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-200 font-medium">Root Rejected (1/4 hits)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">17:30:04</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: ENCYCLOPEDIA */}
          {currentScreen === "encyclopedia" && !activeAlert && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-none text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="font-bold text-sm text-white">Snake Identification & First Aid</h2>
                <span className="text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">Field Guide</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300">Eastern Diamondback Rattlesnake</span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">HIGH RISK</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Crotalus adamanteus* • Hemotoxin • Distinct diamond patterns with black/yellow outline.
                  </p>
                  <p className="text-[10px] text-amber-300 mt-1 font-semibold">
                    First Aid: Keep victim calm, immobilize limb at heart level, transport to ER immediately.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">Eastern Copperhead</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">VENOMOUS</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Agkistrodon contortrix* • Hourglass crossbands, copper-tinted head.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">Common Garter Snake</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">NON-VENOMOUS</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Thamnophis sirtalis* • Harmless garden helper, 3 longitudinal stripes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: SETTINGS */}
          {currentScreen === "settings" && !activeAlert && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-none text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="font-bold text-sm text-white">App & FCM Settings</h2>
                <span className="text-[10px] text-emerald-400">Android v14</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-1">Consecutive Frame Streak (N)</span>
                  <p className="text-[10px] text-slate-400 mb-2">Requires N continuous frames before tripping warning siren.</p>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-amber-400 font-bold">{systemSettings.consecutiveFramesN} Frames</span>
                    <span className="text-slate-500">~{systemSettings.consecutiveFramesN * 33}ms verification</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-1">Siren Sound Synthesizer</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Dual-tone 880Hz/1760Hz pulse</span>
                    <button
                      onClick={() => sirenSynthesizer.playAlarm(3)}
                      className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 text-[10px]"
                    >
                      Test Siren
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-1">Documentation</span>
                  <button
                    onClick={onOpenUserGuide}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>View USER_GUIDE.md</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= HIGH-URGENCY WARNING UI OVERLAY ================= */}
          {activeAlert && (
            <div
              id="android-warning-ui-overlay"
              className={`absolute inset-0 z-40 flex flex-col justify-between p-4 ${
                activeAlert.riskLevel === "FALSE POSITIVE REJECTED"
                  ? "bg-slate-950/95"
                  : "bg-gradient-to-b from-rose-950 via-slate-950 to-rose-950 animate-pulse duration-1000"
              } text-white`}
            >
              {/* Alert Header & Risk Badge */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-rose-800/60">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                    <span className="text-xs font-extrabold tracking-wider text-rose-300 uppercase">
                      {activeAlert.riskLevel}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full border border-rose-500/40">
                    FCM PRIORITY 1
                  </span>
                </div>

                {/* Main Alert Card */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/90 border border-rose-600/50 shadow-2xl shadow-rose-950">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-snug">
                        {activeAlert.species}
                      </h3>
                      {activeAlert.scientificName && (
                        <p className="text-[11px] text-rose-300/80 italic font-serif">
                          {activeAlert.scientificName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {(activeAlert.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-400 block">Confidence</span>
                    </div>
                  </div>

                  {/* Latency Instrumentation Badge (Sub-3s guarantee) */}
                  <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> E2E Latency:
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {activeAlert.latencies.totalEndToEndMs} ms (Target &lt; 3s)
                    </span>
                  </div>

                  {/* Consecutive Streak details */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Consecutive Frame Lock:</span>
                    <span className="font-mono text-blue-300 font-semibold">
                      {activeAlert.consecutiveStreak} / {activeAlert.requiredStreak} Frames Verified
                    </span>
                  </div>

                  {/* Night Vision Mode indicator */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Camera Mode:</span>
                    <span className="font-mono text-indigo-300">
                      {activeAlert.nightMode ? "Infrared IR 850nm" : "Standard Daylight RGB"}
                    </span>
                  </div>
                </div>

                {/* Safety Directives */}
                <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs space-y-1">
                  <p className="font-bold text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Immediate Safety Action:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    1. Maintain at least 15 ft (5 meters) distance.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    2. Keep children and pets indoors immediately.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    3. Do not attempt to trap or corner specimen.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Call 911 / Mute / Dismiss */}
              <div className="space-y-2 pt-2">
                {simulatedCallActive ? (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-center text-xs text-emerald-300 font-bold animate-pulse">
                    📞 Connected to Wildlife Rescue / Emergency Dispatch...
                  </div>
                ) : (
                  <button
                    onClick={handleEmergencyCall}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/40 transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dispatch Emergency / Wildlife Control</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleToggleSiren}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      isSirenMuted
                        ? "bg-slate-800 text-slate-300 border-slate-700"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {isSirenMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{isSirenMuted ? "Sound Siren" : "Mute Siren"}</span>
                  </button>

                  <button
                    onClick={onDismissAlert}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Acknowledge / Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Android Bottom Navigation Bar */}
          {!activeAlert && (
            <div className="flex items-center justify-around py-2 px-3 bg-slate-950/90 border-t border-slate-800 text-slate-400 text-[10px]">
              <button
                onClick={() => setCurrentScreen("splash")}
                className={`flex flex-col items-center gap-0.5 transition ${
                  currentScreen === "splash" ? "text-amber-400 font-bold" : "hover:text-slate-200"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Splash</span>
              </button>

              <button
                onClick={() => setCurrentScreen("dashboard")}
                className={`flex flex-col items-center gap-0.5 transition ${
                  currentScreen === "dashboard" ? "text-amber-400 font-bold" : "hover:text-slate-200"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Monitor</span>
              </button>

              <button
                onClick={() => setCurrentScreen("encyclopedia")}
                className={`flex flex-col items-center gap-0.5 transition ${
                  currentScreen === "encyclopedia" ? "text-amber-400 font-bold" : "hover:text-slate-200"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Species</span>
              </button>

              <button
                onClick={() => setCurrentScreen("settings")}
                className={`flex flex-col items-center gap-0.5 transition ${
                  currentScreen === "settings" ? "text-amber-400 font-bold" : "hover:text-slate-200"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Config</span>
              </button>
            </div>
          )}

          {/* Android Pill Gesture Indicator */}
          <div className="py-1 flex justify-center bg-slate-950">
            <div className="w-24 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
