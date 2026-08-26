import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
  HelpCircle
} from "lucide-react";

interface FalsePositiveTestBenchProps {
  onSimulateDetection: (scenario: any) => void;
}

interface ScenarioDef {
  id: "hose" | "root" | "snake";
  name: string;
  category: "distractor" | "hazard";
  description: string;
  rawFrameConfidences: number[];
  motionIoU: number[];
  visualIcon: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: "hose",
    name: "Curved Garden Hose",
    category: "distractor",
    description: "Sunlight shadow flicker produces intermittent low-confidence false positives (frames #2 and #3).",
    rawFrameConfidences: [0.18, 0.54, 0.52, 0.21, 0.15, 0.20, 0.19, 0.22, 0.17, 0.16],
    motionIoU: [0.05, 0.38, 0.35, 0.08, 0.04, 0.06, 0.05, 0.07, 0.05, 0.04],
    visualIcon: "🚿"
  },
  {
    id: "root",
    name: "Exposed Tree Root",
    category: "distractor",
    description: "Static wood curvature under moving branch shadows triggers a momentary single-frame spike at frame #4.",
    rawFrameConfidences: [0.12, 0.15, 0.18, 0.51, 0.20, 0.14, 0.16, 0.15, 0.17, 0.13],
    motionIoU: [0.02, 0.03, 0.04, 0.28, 0.05, 0.02, 0.03, 0.02, 0.03, 0.02],
    visualIcon: "🪵"
  },
  {
    id: "snake",
    name: "Live Diamondback Rattlesnake",
    category: "hazard",
    description: "Continuous serpentine locomotion maintains high model confidence (>0.85) across all sequential frames.",
    rawFrameConfidences: [0.89, 0.92, 0.94, 0.91, 0.93, 0.95, 0.92, 0.96, 0.94, 0.95],
    motionIoU: [0.65, 0.72, 0.78, 0.81, 0.76, 0.84, 0.79, 0.85, 0.82, 0.86],
    visualIcon: "🐍"
  }
];

export const FalsePositiveTestBench: React.FC<FalsePositiveTestBenchProps> = ({ onSimulateDetection }) => {
  const [consecutiveN, setConsecutiveN] = useState<number>(4);
  const [minConfidence, setMinConfidence] = useState<number>(0.60);
  const [activeSimulation, setActiveSimulation] = useState<"hose" | "root" | "snake">("hose");

  // Calculate outcome for any scenario dynamically based on current (minConfidence, consecutiveN)
  const evaluateScenario = (scenario: ScenarioDef, minConf: number, nStreak: number) => {
    let currentStreak = 0;
    let maxStreak = 0;
    let triggeredAtFrame: number | null = null;
    const frameDetails: Array<{
      frame: number;
      conf: number;
      iou: number;
      passesConf: boolean;
      streak: number;
      triggered: boolean;
    }> = [];

    scenario.rawFrameConfidences.forEach((conf, idx) => {
      const frameNum = idx + 1;
      const passesConf = conf >= minConf;
      const iou = scenario.motionIoU[idx];

      if (passesConf) {
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      const triggered = currentStreak >= nStreak;
      if (triggered && triggeredAtFrame === null) {
        triggeredAtFrame = frameNum;
      }

      frameDetails.push({
        frame: frameNum,
        conf,
        iou,
        passesConf,
        streak: currentStreak,
        triggered
      });
    });

    const isAlarmTriggered = triggeredAtFrame !== null;
    const peakConfidence = Math.max(...scenario.rawFrameConfidences);

    let statusText = "";
    let statusType: "safe_blocked" | "correct_alert" | "false_positive_leak" | "missed_hazard" = "safe_blocked";

    if (scenario.category === "distractor") {
      if (isAlarmTriggered) {
        statusType = "false_positive_leak";
        statusText = `⚠️ False Positive Leaked: Triggered at frame #${triggeredAtFrame} (Thresholds too loose!)`;
      } else {
        statusType = "safe_blocked";
        statusText = `🛡️ Suppressed Successfully: Max streak ${maxStreak} < required N=${nStreak}`;
      }
    } else {
      // Hazard (Snake)
      if (isAlarmTriggered) {
        statusType = "correct_alert";
        statusText = `✅ True Hazard Confirmed: Alert triggered at frame #${triggeredAtFrame}`;
      } else {
        statusType = "missed_hazard";
        statusText = `❌ Hazard Missed: Confidence threshold ${Math.round(minConf * 100)}% or N=${nStreak} too strict!`;
      }
    }

    return {
      frameDetails,
      maxStreak,
      peakConfidence,
      isAlarmTriggered,
      triggeredAtFrame,
      statusType,
      statusText
    };
  };

  // Real-time evaluation of all scenarios
  const scenarioEvaluations = useMemo(() => {
    return {
      hose: evaluateScenario(SCENARIOS[0], minConfidence, consecutiveN),
      root: evaluateScenario(SCENARIOS[1], minConfidence, consecutiveN),
      snake: evaluateScenario(SCENARIOS[2], minConfidence, consecutiveN)
    };
  }, [minConfidence, consecutiveN]);

  const activeEval = scenarioEvaluations[activeSimulation];
  const activeScenarioDef = SCENARIOS.find((s) => s.id === activeSimulation)!;

  // Preset Configurations
  const applyPreset = (preset: "strict" | "balanced" | "sensitive") => {
    if (preset === "strict") {
      setMinConfidence(0.75);
      setConsecutiveN(5);
    } else if (preset === "balanced") {
      setMinConfidence(0.60);
      setConsecutiveN(4);
    } else {
      setMinConfidence(0.45);
      setConsecutiveN(2);
    }
  };

  const handleTriggerAlertIfSnake = () => {
    if (activeSimulation === "snake" && activeEval.isAlarmTriggered) {
      onSimulateDetection("rattlesnake");
    }
  };

  return (
    <div id="false-positive-testbench-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Engineering Challenge 1: False Positive Mitigation Test Bench
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Ring-Buffer Filter: Real-time Evaluation of Confidence Gates & N-Consecutive Frame Streaks
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] px-2 font-medium">Presets:</span>
          <button
            id="preset-conservative-btn"
            onClick={() => applyPreset("strict")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
              minConfidence === 0.75 && consecutiveN === 5
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Zero-False-Alarm (0.75 / N=5)
          </button>
          <button
            id="preset-balanced-btn"
            onClick={() => applyPreset("balanced")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
              minConfidence === 0.60 && consecutiveN === 4
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Balanced (0.60 / N=4)
          </button>
          <button
            id="preset-sensitive-btn"
            onClick={() => applyPreset("sensitive")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
              minConfidence === 0.45 && consecutiveN === 2
                ? "bg-rose-500 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Sensitive (0.45 / N=2)
          </button>
        </div>
      </div>

      {/* Dynamic Controls Grid: Sliders & Live Impact Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
        {/* Control 1: Minimum Confidence Threshold */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="min-confidence-slider" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Minimum Model Confidence Gate
            </label>
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              {(minConfidence * 100).toFixed(0)}% (0.{Math.round(minConfidence * 100)})
            </span>
          </div>
          <input
            id="min-confidence-slider"
            type="range"
            min={0.30}
            max={0.95}
            step={0.05}
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>30% (High False Alarms)</span>
            <span>60% (Optimal)</span>
            <span>95% (High Miss Risk)</span>
          </div>
        </div>

        {/* Control 2: N-Consecutive Frame Count */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="n-frame-count-slider" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              N-Consecutive Frame Streak Threshold
            </label>
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              N = {consecutiveN} Frames ({consecutiveN * 33} ms buffer)
            </span>
          </div>
          <input
            id="n-frame-count-slider"
            type="range"
            min={2}
            max={8}
            step={1}
            value={consecutiveN}
            onChange={(e) => setConsecutiveN(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>N=2 (66ms, Sensitive)</span>
            <span>N=4 (133ms, Standard)</span>
            <span>N=8 (266ms, Slow)</span>
          </div>
        </div>
      </div>

      {/* Real-time Alert Outcome Matrix Across All 3 Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Real-Time Simulated Alert Outcomes
          </h3>
          <span className="text-[11px] text-slate-400">
            Click any scenario to inspect its 10-frame pipeline trace below
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SCENARIOS.map((scenario) => {
            const ev = scenarioEvaluations[scenario.id];
            const isSelected = activeSimulation === scenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => setActiveSimulation(scenario.id)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-900 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                    <div className="absolute transform rotate-45 bg-amber-500 text-[9px] font-extrabold text-slate-950 py-0.5 right-[-35px] top-[14px] w-[110px] text-center">
                      ACTIVE
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{scenario.visualIcon}</span>
                      <span className="font-bold text-sm text-white">{scenario.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      scenario.category === "hazard" ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {scenario.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                    {scenario.description}
                  </p>

                  {/* Confidence Bar Comparison */}
                  <div className="space-y-1.5 mb-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Peak Conf: <strong className="text-white">{(ev.peakConfidence * 100).toFixed(0)}%</strong></span>
                      <span>Gate: <strong className="text-cyan-400">{(minConfidence * 100).toFixed(0)}%</strong></span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 relative overflow-hidden">
                      {/* Gate Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10"
                        style={{ left: `${minConfidence * 100}%` }}
                        title={`Gate: ${(minConfidence * 100).toFixed(0)}%`}
                      />
                      {/* Actual Peak Fill */}
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ev.peakConfidence >= minConfidence ? "bg-amber-400" : "bg-slate-600"
                        }`}
                        style={{ width: `${ev.peakConfidence * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                      <span>Max Streak: <strong className="text-white">{ev.maxStreak} frames</strong></span>
                      <span>Target: <strong className="text-amber-400">N={consecutiveN}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Outcome Badge */}
                <div className="pt-2 border-t border-slate-800">
                  {ev.statusType === "safe_blocked" && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>BLOCKED (False Alarm Prevented)</span>
                    </div>
                  )}
                  {ev.statusType === "false_positive_leak" && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>FALSE ALARM LEAKED</span>
                    </div>
                  )}
                  {ev.statusType === "correct_alert" && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>HAZARD ALERT DISPATCHED</span>
                    </div>
                  )}
                  {ev.statusType === "missed_hazard" && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>HAZARD MISSED (Over-filtered)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequential Frame Breakdown Visualizer for the Selected Scenario */}
      <div className="p-4 lg:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              10-Frame Sequential Pipeline Trace: {activeScenarioDef.name}
            </span>
            <p className="text-[11px] text-slate-400">
              Each frame is evaluated against Minimum Confidence (≥{(minConfidence * 100).toFixed(0)}%) and N-Frame Streak (≥{consecutiveN})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              Active Status: <strong className={activeEval.isAlarmTriggered ? "text-rose-400" : "text-emerald-400"}>
                {activeEval.isAlarmTriggered ? `Tripped Alarm @ Frame #${activeEval.triggeredAtFrame}` : "No Alarm (Suppressed)"}
              </strong>
            </span>
          </div>
        </div>

        {/* 10 Frame Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {activeEval.frameDetails.map((f) => {
            const isConfPass = f.passesConf;
            const isAlarm = f.triggered;

            return (
              <div
                key={f.frame}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition ${
                  isAlarm
                    ? "bg-rose-950/70 border-rose-500 text-rose-200 shadow-md shadow-rose-500/20"
                    : isConfPass
                    ? "bg-amber-950/30 border-amber-500/60 text-amber-200"
                    : "bg-slate-900 border-slate-800/80 text-slate-500"
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold pb-1 border-b border-slate-800/60">
                  <span>F#{f.frame}</span>
                  <span className={isConfPass ? "text-amber-400" : "text-slate-600"}>
                    {isConfPass ? "PASS" : "FAIL"}
                  </span>
                </div>

                <div className="my-2">
                  {isAlarm ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                  ) : isConfPass ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-700" />
                  )}
                </div>

                <div className="w-full space-y-0.5 text-[9px] font-mono pt-1 border-t border-slate-800/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conf:</span>
                    <strong className={f.conf >= minConfidence ? "text-cyan-400" : "text-slate-500"}>
                      {(f.conf * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Streak:</span>
                    <strong className={f.streak >= consecutiveN ? "text-rose-400 font-bold" : "text-white"}>
                      {f.streak}/{consecutiveN}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Feedback Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
          activeEval.statusType === "safe_blocked"
            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
            : activeEval.statusType === "correct_alert"
            ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
            : activeEval.statusType === "false_positive_leak"
            ? "bg-rose-950/40 border-rose-500 text-rose-200"
            : "bg-amber-950/30 border-amber-500/40 text-amber-300"
        }`}>
          <div className="flex items-center gap-2.5">
            {activeEval.isAlarmTriggered ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{activeEval.statusText}</span>
          </div>

          {activeSimulation === "snake" && activeEval.isAlarmTriggered && (
            <button
              onClick={handleTriggerAlertIfSnake}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] rounded-lg shadow transition shrink-0 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Test Live Alarm Flow
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
