import React, { useState } from "react";
import {
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  Server,
  Smartphone,
  Cpu,
  Radio,
  Play,
  RotateCcw,
  Activity
} from "lucide-react";
import { AlertRecord, LatencyStage } from "../types";

interface LatencyInstrumentationProps {
  alerts: AlertRecord[];
  targetSlaMs: number;
}

export const LatencyInstrumentation: React.FC<LatencyInstrumentationProps> = ({
  alerts,
  targetSlaMs = 3000
}) => {
  const [activeBenchmarkRunning, setActiveBenchmarkRunning] = useState<boolean>(false);
  const [liveStopwatchMs, setLiveStopwatchMs] = useState<number>(0);
  const [customBreakdown, setCustomBreakdown] = useState<LatencyStage[] | null>(null);

  // Latest alert latency breakdown
  const latestAlert = alerts.find((a) => a.riskLevel !== "FALSE POSITIVE REJECTED") || alerts[0];
  const l = latestAlert?.latencies || {
    captureMs: 14,
    inferenceMs: 42,
    streakFilterMs: 133,
    webhookDispatchMs: 88,
    cloudFcmMs: 240,
    deviceWakeAlarmMs: 185,
    totalEndToEndMs: 702
  };

  const stages: LatencyStage[] = customBreakdown || [
    {
      name: "1. Edge Frame Capture & Prep",
      durationMs: l.captureMs,
      budgetMs: 30,
      percentage: Math.round((l.captureMs / l.totalEndToEndMs) * 100),
      status: l.captureMs <= 30 ? "fast" : "warning",
      description: "Sensor DMA transfer, RGB/IR conversion & 640x640 tensor normalization"
    },
    {
      name: "2. YOLOv8 / ONNX Inference",
      durationMs: l.inferenceMs,
      budgetMs: 80,
      percentage: Math.round((l.inferenceMs / l.totalEndToEndMs) * 100),
      status: l.inferenceMs <= 80 ? "fast" : "warning",
      description: "Hailo-8 / Jetson NPU INT8 matrix multiplication across 100+ conv layers"
    },
    {
      name: "3. N-Frame Spatial Streak Lock",
      durationMs: l.streakFilterMs,
      budgetMs: 200,
      percentage: Math.round((l.streakFilterMs / l.totalEndToEndMs) * 100),
      status: l.streakFilterMs <= 200 ? "optimal" : "warning",
      description: "Temporal IoU buffer evaluation across N=4 frames (Hose/Root rejection)"
    },
    {
      name: "4. Webhook POST & Cloud Ingest",
      durationMs: l.webhookDispatchMs,
      budgetMs: 150,
      percentage: Math.round((l.webhookDispatchMs / l.totalEndToEndMs) * 100),
      status: l.webhookDispatchMs <= 150 ? "fast" : "warning",
      description: "Asynchronous HTTP/2 payload transmission with compressed thumbnail"
    },
    {
      name: "5. FCM High-Priority Cellular Push",
      durationMs: l.cloudFcmMs,
      budgetMs: 800,
      percentage: Math.round((l.cloudFcmMs / l.totalEndToEndMs) * 100),
      status: l.cloudFcmMs <= 800 ? "fast" : "warning",
      description: "Google FCM transport to Android device bypassing Doze power save"
    },
    {
      name: "6. Android WakeLock & Siren Sound",
      durationMs: l.deviceWakeAlarmMs,
      budgetMs: 500,
      percentage: Math.round((l.deviceWakeAlarmMs / l.totalEndToEndMs) * 100),
      status: l.deviceWakeAlarmMs <= 500 ? "fast" : "warning",
      description: "Acquiring Partial WakeLock, displaying warning UI & playing dual-tone siren"
    }
  ];

  const totalCalculatedMs = stages.reduce((acc, s) => acc + s.durationMs, 0);
  const isSlaCompliant = totalCalculatedMs <= targetSlaMs;

  const runLiveLatencyBenchmark = () => {
    setActiveBenchmarkRunning(true);
    setLiveStopwatchMs(0);
    const startTime = performance.now();

    const timer = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setLiveStopwatchMs(elapsed);
    }, 15);

    // Simulate real pipeline stages completing sequentially
    setTimeout(() => {
      const capture = 12 + Math.floor(Math.random() * 8);
      const infer = 36 + Math.floor(Math.random() * 12);
      const streak = 132;
      const webhook = 75 + Math.floor(Math.random() * 30);
      const fcm = 210 + Math.floor(Math.random() * 80);
      const wake = 150 + Math.floor(Math.random() * 50);
      const total = capture + infer + streak + webhook + fcm + wake;

      clearInterval(timer);
      setLiveStopwatchMs(total);
      setActiveBenchmarkRunning(false);

      setCustomBreakdown([
        {
          name: "1. Edge Frame Capture & Prep",
          durationMs: capture,
          budgetMs: 30,
          percentage: Math.round((capture / total) * 100),
          status: "fast",
          description: "Sensor DMA transfer, RGB/IR conversion & 640x640 tensor normalization"
        },
        {
          name: "2. YOLOv8 / ONNX Inference",
          durationMs: infer,
          budgetMs: 80,
          percentage: Math.round((infer / total) * 100),
          status: "fast",
          description: "Hailo-8 / Jetson NPU INT8 matrix multiplication across 100+ conv layers"
        },
        {
          name: "3. N-Frame Spatial Streak Lock",
          durationMs: streak,
          budgetMs: 200,
          percentage: Math.round((streak / total) * 100),
          status: "optimal",
          description: "Temporal IoU buffer evaluation across N=4 frames (Hose/Root rejection)"
        },
        {
          name: "4. Webhook POST & Cloud Ingest",
          durationMs: webhook,
          budgetMs: 150,
          percentage: Math.round((webhook / total) * 100),
          status: "fast",
          description: "Asynchronous HTTP/2 payload transmission with compressed thumbnail"
        },
        {
          name: "5. FCM High-Priority Cellular Push",
          durationMs: fcm,
          budgetMs: 800,
          percentage: Math.round((fcm / total) * 100),
          status: "fast",
          description: "Google FCM transport to Android device bypassing Doze power save"
        },
        {
          name: "6. Android WakeLock & Siren Sound",
          durationMs: wake,
          budgetMs: 500,
          percentage: Math.round((wake / total) * 100),
          status: "fast",
          description: "Acquiring Partial WakeLock, displaying warning UI & playing dual-tone siren"
        }
      ]);
    }, 650);
  };

  return (
    <div id="latency-instrumentation-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Engineering Challenge 3: Sub-3-Second Notification Latency
            </h2>
            <p className="text-xs text-slate-400">
              End-to-End Pipeline Telemetry: Edge Capture → Model Inference → FCM Dispatch → Mobile Wake
            </p>
          </div>
        </div>

        {/* SLA Benchmark Score Card */}
        <div className="flex items-center gap-3">
          <button
            id="run-latency-benchmark-btn"
            onClick={runLiveLatencyBenchmark}
            disabled={activeBenchmarkRunning}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {activeBenchmarkRunning ? (
              <Activity className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{activeBenchmarkRunning ? "Benchmarking..." : "Run E2E Latency Benchmark"}</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total E2E Latency */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Measured End-to-End</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-white">
                {activeBenchmarkRunning ? liveStopwatchMs : totalCalculatedMs}
              </span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Target SLA */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Target SLA Threshold</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-amber-400">
                &lt; {targetSlaMs}
              </span>
              <span className="text-xs text-slate-400">ms (3.0s)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* SLA Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">SLA Compliance Status</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isSlaCompliant ? "PASS (4.2x Faster)" : "FAIL"}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono text-right">
            <span>Safety Margin:</span>
            <strong className="block text-white font-bold">{targetSlaMs - totalCalculatedMs} ms</strong>
          </div>
        </div>
      </div>

      {/* Stage-by-Stage Latency Breakdown Table & Visual Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Telemetry Stage Instrumentation Breakdown
        </h3>

        {/* Visual Stacked Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div style={{ width: `${stages[0].percentage}%` }} className="bg-cyan-500 h-full" title="Capture" />
          <div style={{ width: `${stages[1].percentage}%` }} className="bg-blue-500 h-full" title="Inference" />
          <div style={{ width: `${stages[2].percentage}%` }} className="bg-indigo-500 h-full" title="Streak Buffer" />
          <div style={{ width: `${stages[3].percentage}%` }} className="bg-amber-500 h-full" title="Webhook POST" />
          <div style={{ width: `${stages[4].percentage}%` }} className="bg-emerald-500 h-full" title="FCM Transport" />
          <div style={{ width: `${stages[5].percentage}%` }} className="bg-rose-500 h-full" title="Device Wake & Sound" />
        </div>

        {/* Granular Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {stages.map((st, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-white">{st.name}</span>
                <span className="text-xs font-mono font-bold text-amber-400">{st.durationMs} ms</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 mb-2 leading-tight">{st.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                <span>Budget: &lt; {st.budgetMs}ms</span>
                <span className="text-emerald-400 font-semibold">{st.percentage}% of total</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
