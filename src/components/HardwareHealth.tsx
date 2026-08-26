import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Fan,
  Thermometer,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Server,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Power,
  Sun,
  Shield,
  TrendingDown,
  TrendingUp,
  Clock,
  Sliders,
  Layers,
  ArrowDownRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";

interface HardwareHealthMetrics {
  cpuTempC: number;
  memoryUsageMb: number;
  memoryTotalMb: number;
  npuTempC: number;
  cpuLoadPercent: number;
  fanRpm: number;
  throttleStatus: "NORMAL" | "WARNING_THERMAL" | "CRITICAL_THROTTLED";
  voltageV: number;
  fpsThroughput: number;
  npuUtilizationPercent: number;
  // Battery & Power Consumption
  batteryPercent: number;
  powerDrawWatts: number;
  batteryVoltageV: number;
  batteryCurrentAmps: number;
  batteryCapacityWh: number;
  estimatedRuntimeHours: number;
  solarChargingActive: boolean;
  solarInputWatts: number;
  inferenceIntensity: number; // 0 to 100%
  drainRatePercentPerHour: number;
}

interface BatteryInferenceDataPoint {
  time: string;
  batteryPct: number;
  inferenceIntensity: number; // 0 - 100%
  npuLoad: number;            // 0 - 100%
  powerWatts: number;         // Watts (0 - 20W)
  drainRate: number;          // %/hr
  fps: number;
  isSolarCharging: boolean;
  netPowerWatts: number;
}

type InferencePreset = "standby" | "standard" | "dual_fusion" | "stress_burst";

export const HardwareHealth: React.FC = () => {
  const [activeInferencePreset, setActiveInferencePreset] = useState<InferencePreset>("standard");
  const [solarChargingActive, setSolarChargingActive] = useState<boolean>(true);
  const [fanSpeedMode, setFanSpeedMode] = useState<"auto" | "performance" | "silent">("auto");
  const [graphTimeframe, setGraphTimeframe] = useState<"live" | "benchmark">("live");

  // Real-time streaming timeline (last 25 points)
  const [historyTimeline, setHistoryTimeline] = useState<BatteryInferenceDataPoint[]>([]);

  const [metrics, setMetrics] = useState<HardwareHealthMetrics>({
    cpuTempC: 48.5,
    memoryUsageMb: 1420,
    memoryTotalMb: 4096,
    npuTempC: 44.2,
    cpuLoadPercent: 34,
    fanRpm: 2400,
    throttleStatus: "NORMAL",
    voltageV: 5.08,
    fpsThroughput: 30.0,
    npuUtilizationPercent: 45,
    batteryPercent: 86.4,
    powerDrawWatts: 6.2,
    batteryVoltageV: 12.1,
    batteryCurrentAmps: 0.51,
    batteryCapacityWh: 52.0,
    estimatedRuntimeHours: 18.5,
    solarChargingActive: true,
    solarInputWatts: 8.8,
    inferenceIntensity: 50,
    drainRatePercentPerHour: 1.18
  });

  // Generate initial historical seed data so graph is never empty on mount
  useEffect(() => {
    const seed: BatteryInferenceDataPoint[] = [];
    const now = Date.now();
    let initialBatt = 88.5;

    for (let i = 20; i >= 1; i--) {
      const t = new Date(now - i * 3000);
      const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      
      const inferenceIntensity = 45 + Math.sin(i * 0.5) * 8;
      const npuLoad = Math.round(inferenceIntensity * 0.95);
      const powerWatts = Math.round((5.8 + (inferenceIntensity / 100) * 2.5) * 10) / 10;
      const solar = 8.5;
      const net = powerWatts - solar;
      
      // Slight charge/discharge trajectory
      initialBatt = Math.min(100, Math.max(10, initialBatt - (net > 0 ? 0.03 : -0.02)));

      seed.push({
        time: timeStr,
        batteryPct: Math.round(initialBatt * 10) / 10,
        inferenceIntensity: Math.round(inferenceIntensity),
        npuLoad,
        powerWatts,
        drainRate: Math.round((powerWatts / 52.0) * 100 * 10) / 10,
        fps: 30.0,
        isSolarCharging: true,
        netPowerWatts: Math.round(net * 10) / 10
      });
    }

    setHistoryTimeline(seed);
  }, []);

  // Benchmark dataset showing complete correlation curve across inference intensities (0% to 100%)
  const benchmarkData = useMemo(() => [
    { time: "00:00 (Sleep)", inferenceIntensity: 0, npuLoad: 2, powerWatts: 0.8, batteryPct: 98.0, drainRate: 0.15, fps: 0, netPowerWatts: -8.0, isSolarCharging: true },
    { time: "03:00 (Standby)", inferenceIntensity: 10, npuLoad: 8, powerWatts: 1.4, batteryPct: 97.2, drainRate: 0.27, fps: 5, netPowerWatts: 1.4, isSolarCharging: false },
    { time: "06:00 (Dusk Trigger)", inferenceIntensity: 30, npuLoad: 28, powerWatts: 3.8, batteryPct: 95.8, drainRate: 0.73, fps: 15, netPowerWatts: 3.8, isSolarCharging: false },
    { time: "09:00 (Solar Active)", inferenceIntensity: 50, npuLoad: 45, powerWatts: 6.2, batteryPct: 96.5, drainRate: 1.19, fps: 30, netPowerWatts: -2.6, isSolarCharging: true },
    { time: "12:00 (Standard AI)", inferenceIntensity: 50, npuLoad: 48, powerWatts: 6.4, batteryPct: 98.2, drainRate: 1.23, fps: 30, netPowerWatts: -2.4, isSolarCharging: true },
    { time: "15:00 (Dual Fusion)", inferenceIntensity: 75, npuLoad: 72, powerWatts: 8.9, batteryPct: 97.4, drainRate: 1.71, fps: 45, netPowerWatts: 0.1, isSolarCharging: true },
    { time: "18:00 (Peak Viper Alert)", inferenceIntensity: 95, npuLoad: 92, powerWatts: 14.8, batteryPct: 92.1, drainRate: 2.85, fps: 60, netPowerWatts: 14.8, isSolarCharging: false },
    { time: "21:00 (Continuous 30FPS)", inferenceIntensity: 50, npuLoad: 46, powerWatts: 6.2, batteryPct: 86.8, drainRate: 1.19, fps: 30, netPowerWatts: 6.2, isSolarCharging: false },
    { time: "23:59 (Overnight Window)", inferenceIntensity: 40, npuLoad: 38, powerWatts: 5.1, batteryPct: 81.2, drainRate: 0.98, fps: 24, netPowerWatts: 5.1, isSolarCharging: false },
  ], []);

  // Simulated live hardware monitoring tick
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        let targetIntensity = 50;
        let baseWatts = 6.2;
        let targetTemp = 48.5;
        let targetMem = 1450;
        let targetLoad = 35;
        let targetNpu = 45;
        let targetFps = 30.0;

        if (activeInferencePreset === "standby") {
          targetIntensity = 10;
          baseWatts = 1.4;
          targetTemp = 39.0;
          targetMem = 850;
          targetLoad = 12;
          targetNpu = 8;
          targetFps = 5.0;
        } else if (activeInferencePreset === "standard") {
          targetIntensity = 50;
          baseWatts = 6.2;
          targetTemp = 48.5;
          targetMem = 1420;
          targetLoad = 35;
          targetNpu = 45;
          targetFps = 30.0;
        } else if (activeInferencePreset === "dual_fusion") {
          targetIntensity = 75;
          baseWatts = 8.9;
          targetTemp = 58.0;
          targetMem = 1950;
          targetLoad = 55;
          targetNpu = 72;
          targetFps = 45.0;
        } else if (activeInferencePreset === "stress_burst") {
          targetIntensity = 98;
          baseWatts = 14.8;
          targetTemp = 79.5;
          targetMem = 2850;
          targetLoad = 89;
          targetNpu = 94;
          targetFps = 60.0;
        }

        // Add small stochastic jitter
        const powerWatts = Math.round((prev.powerDrawWatts * 0.7 + (baseWatts + (Math.random() * 0.5 - 0.25)) * 0.3) * 10) / 10;
        const solarWatts = solarChargingActive ? Math.round((8.8 + (Math.random() * 1.0 - 0.5)) * 10) / 10 : 0;
        const netWatts = Math.round((powerWatts - solarWatts) * 10) / 10;

        // Drain rate calculation (% per hour)
        const drainRate = Math.round((powerWatts / prev.batteryCapacityWh) * 100 * 10) / 10;

        // Battery percentage update
        let currentPct = prev.batteryPercent;
        if (netWatts > 0) {
          // Discharging
          currentPct = Math.max(5, currentPct - (0.025 * (powerWatts / 6.0)));
        } else {
          // Charging via solar MPPT
          currentPct = Math.min(100, currentPct + 0.035);
        }
        currentPct = Math.round(currentPct * 10) / 10;

        // Remaining runtime hours calculation
        const remainingEnergyWh = (currentPct / 100) * prev.batteryCapacityWh;
        const estHours = netWatts > 0 ? Math.round((remainingEnergyWh / netWatts) * 10) / 10 : 36.0;

        // Battery voltage (nominal 11.1V - 12.6V for 3S Li-Ion pack)
        const battVoltage = Math.round((10.8 + (currentPct / 100) * 1.8) * 100) / 100;
        const battAmps = Math.round((Math.abs(netWatts) / battVoltage) * 100) / 100;

        // Thermal & memory updates
        const cpuTemp = Math.round((prev.cpuTempC * 0.7 + (targetTemp + (Math.random() * 3 - 1.5)) * 0.3) * 10) / 10;
        const mem = Math.round(prev.memoryUsageMb * 0.8 + (targetMem + (Math.random() * 40 - 20)) * 0.2);
        const cpuLoad = Math.min(100, Math.max(10, Math.round(prev.cpuLoadPercent * 0.7 + (targetLoad + (Math.random() * 6 - 3)) * 0.3)));
        const npuTemp = Math.round((prev.npuTempC * 0.7 + (targetTemp * 0.9 + (Math.random() * 2 - 1)) * 0.3) * 10) / 10;
        const npuLoad = Math.min(100, Math.max(5, Math.round(targetNpu + (Math.random() * 4 - 2))));

        let fanRpm = 2200;
        if (fanSpeedMode === "performance") {
          fanRpm = 4800;
        } else if (fanSpeedMode === "silent") {
          fanRpm = 1200;
        } else {
          if (cpuTemp > 75) fanRpm = 4600;
          else if (cpuTemp > 60) fanRpm = 3400;
          else if (activeInferencePreset === "standby") fanRpm = 1400;
          else fanRpm = 2200;
        }

        let throttleStatus: "NORMAL" | "WARNING_THERMAL" | "CRITICAL_THROTTLED" = "NORMAL";
        let fps = targetFps;

        if (cpuTemp >= 78) {
          throttleStatus = "CRITICAL_THROTTLED";
          fps = 18.2;
        } else if (cpuTemp >= 68) {
          throttleStatus = "WARNING_THERMAL";
          fps = 26.5;
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const newPoint: BatteryInferenceDataPoint = {
          time: timeStr,
          batteryPct: currentPct,
          inferenceIntensity: targetIntensity,
          npuLoad,
          powerWatts,
          drainRate,
          fps: Math.round(fps * 10) / 10,
          isSolarCharging: solarChargingActive,
          netPowerWatts: netWatts
        };

        setHistoryTimeline((hist) => [...hist.slice(-24), newPoint]);

        return {
          cpuTempC: cpuTemp,
          memoryUsageMb: mem,
          memoryTotalMb: 4096,
          npuTempC: npuTemp,
          cpuLoadPercent: cpuLoad,
          fanRpm,
          throttleStatus,
          voltageV: Math.round((5.05 + (Math.random() * 0.08 - 0.04)) * 100) / 100,
          fpsThroughput: Math.round(fps * 10) / 10,
          npuUtilizationPercent: npuLoad,
          batteryPercent: currentPct,
          powerDrawWatts: powerWatts,
          batteryVoltageV: battVoltage,
          batteryCurrentAmps: battAmps,
          batteryCapacityWh: 52.0,
          estimatedRuntimeHours: estHours,
          solarChargingActive,
          solarInputWatts: solarWatts,
          inferenceIntensity: targetIntensity,
          drainRatePercentPerHour: drainRate
        };
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [activeInferencePreset, fanSpeedMode, solarChargingActive]);

  // Gauge angle calculation (0 to 100% maps to -120deg to +120deg)
  const getGaugeDeg = (val: number, min: number, max: number) => {
    const pct = Math.min(1, Math.max(0, (val - min) / (max - min)));
    return -120 + pct * 240;
  };

  const getTempColor = (temp: number) => {
    if (temp >= 78) return { text: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500", hex: "#f43f5e" };
    if (temp >= 68) return { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400", hex: "#fbbf24" };
    return { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-400", hex: "#10b981" };
  };

  const getMemColor = (mb: number, total: number) => {
    const pct = (mb / total) * 100;
    if (pct >= 85) return { text: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500", hex: "#f43f5e" };
    if (pct >= 70) return { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400", hex: "#fbbf24" };
    return { text: "text-cyan-400", bg: "bg-cyan-400", border: "border-cyan-400", hex: "#22d3ee" };
  };

  const getBatteryColor = (pct: number) => {
    if (pct <= 20) return { text: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500", hex: "#f43f5e" };
    if (pct <= 45) return { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400", hex: "#fbbf24" };
    return { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-400", hex: "#10b981" };
  };

  const tempColors = getTempColor(metrics.cpuTempC);
  const memColors = getMemColor(metrics.memoryUsageMb, metrics.memoryTotalMb);
  const battColors = getBatteryColor(metrics.batteryPercent);
  const memPercentage = Math.round((metrics.memoryUsageMb / metrics.memoryTotalMb) * 100);

  const displayChartData = graphTimeframe === "live" ? historyTimeline : benchmarkData;

  return (
    <div id="hardware-health-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-6 text-slate-100">
      {/* Top Header & Live Mode Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Hardware Health, Battery SoC &amp; AI Inference Power Telemetry
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">
              Correlate Hailo-8 NPU Inference Workload Intensity with Real-Time 3S Li-Ion Battery Drain
            </p>
          </div>
        </div>

        {/* Quick Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Solar MPPT Toggle */}
          <button
            id="toggle-solar-charging-btn"
            onClick={() => setSolarChargingActive(!solarChargingActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              solarChargingActive
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200"
            }`}
          >
            <Sun className={`w-3.5 h-3.5 ${solarChargingActive ? "text-amber-400 animate-spin" : "text-slate-500"}`} />
            <span>Solar MPPT {solarChargingActive ? "(+8.8W In)" : "(Disabled)"}</span>
          </button>

          {/* Fan Speed Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] px-2 flex items-center gap-1">
              <Fan className="w-3 h-3 text-cyan-400" /> Fan:
            </span>
            {(["auto", "performance", "silent"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFanSpeedMode(mode)}
                className={`px-2 py-0.5 rounded-lg capitalize text-[11px] font-medium transition ${
                  fanSpeedMode === mode ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inference Intensity Preset Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Simulate AI Inference Workload Intensity
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active Drain Rate: <strong className="text-amber-400">{metrics.drainRatePercentPerHour}% / hr</strong> ({metrics.powerDrawWatts}W total draw)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            id="preset-standby-btn"
            onClick={() => setActiveInferencePreset("standby")}
            className={`p-3 rounded-xl border text-left transition ${
              activeInferencePreset === "standby"
                ? "bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10"
                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Standby Sleep
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-300">1.4W</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              5 FPS Downclock | 8% NPU Load (~0.27%/hr drain)
            </p>
          </button>

          <button
            id="preset-standard-btn"
            onClick={() => setActiveInferencePreset("standard")}
            className={`p-3 rounded-xl border text-left transition ${
              activeInferencePreset === "standard"
                ? "bg-slate-900 border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10"
                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Standard 30 FPS
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300">6.2W</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              30 FPS YOLOv8 | 45% NPU Load (~1.19%/hr drain)
            </p>
          </button>

          <button
            id="preset-fusion-btn"
            onClick={() => setActiveInferencePreset("dual_fusion")}
            className={`p-3 rounded-xl border text-left transition ${
              activeInferencePreset === "dual_fusion"
                ? "bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-500/10"
                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Dual-Fusion 45FPS
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300">8.9W</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              RGB + LWIR Tensors | 72% NPU Load (~1.71%/hr drain)
            </p>
          </button>

          <button
            id="preset-stress-btn"
            onClick={() => setActiveInferencePreset("stress_burst")}
            className={`p-3 rounded-xl border text-left transition ${
              activeInferencePreset === "stress_burst"
                ? "bg-slate-900 border-rose-500 ring-1 ring-rose-500/50 shadow-md shadow-rose-500/10 animate-pulse"
                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Stress Hazard Burst
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-400">14.8W</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              60 FPS + Taxonomic Gating | 94% NPU (~2.85%/hr drain)
            </p>
          </button>
        </div>
      </div>

      {/* Main Analog Gauges Grid: 1. CPU Die, 2. RAM Heap, 3. Battery SoC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gauge 1: CPU Core Temperature */}
        <div className="p-4 lg:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs pb-1 mb-2 border-b border-slate-800/80">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" /> CPU Die &amp; NPU Temp
            </span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              metrics.throttleStatus === "CRITICAL_THROTTLED"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : metrics.throttleStatus === "WARNING_THERMAL"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}>
              {metrics.throttleStatus === "CRITICAL_THROTTLED"
                ? "⚠️ THROTTLED"
                : metrics.throttleStatus === "WARNING_THERMAL"
                ? "WARM (>68°C)"
                : "OPTIMAL"}
            </span>
          </div>

          <div className="relative w-52 h-32 flex items-center justify-center my-1">
            <svg className="w-full h-full" viewBox="0 0 200 120">
              <path d="M 25 105 A 75 75 0 0 1 175 105" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
              <path d="M 25 105 A 75 75 0 0 1 100 30" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="2 4" opacity={0.4} />
              <path d="M 145 45 A 75 75 0 0 1 175 105" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="2 4" opacity={0.6} />
              <circle cx="100" cy="105" r="8" fill="#334155" />
              <g style={{
                transformOrigin: "100px 105px",
                transform: `rotate(${getGaugeDeg(metrics.cpuTempC, 20, 100)}deg)`,
                transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}>
                <line x1="100" y1="105" x2="100" y2="34" stroke={tempColors.hex} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="105" r="4" fill={tempColors.hex} />
              </g>
              <text x="20" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">20°C</text>
              <text x="92" y="24" fill="#64748b" fontSize="9" fontFamily="monospace">60°C</text>
              <text x="160" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">100°C</text>
            </svg>

            <div className="absolute bottom-0 flex flex-col items-center">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${tempColors.text}`}>
                {metrics.cpuTempC.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                NPU: <strong>{metrics.npuTempC.toFixed(1)}°C</strong>
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            <div>
              <span>Fan:</span>
              <strong className="block text-cyan-400">{metrics.fanRpm} RPM</strong>
            </div>
            <div>
              <span>FPS:</span>
              <strong className={`block ${metrics.fpsThroughput < 20 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                {metrics.fpsThroughput}
              </strong>
            </div>
            <div>
              <span>Limit:</span>
              <strong className="block text-rose-400">78°C</strong>
            </div>
          </div>
        </div>

        {/* Gauge 2: Memory & Daemon Heap Usage */}
        <div className="p-4 lg:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs pb-1 mb-2 border-b border-slate-800/80">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" /> RAM &amp; Tensor Buffers
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {memPercentage}% USED
            </span>
          </div>

          <div className="relative w-52 h-32 flex items-center justify-center my-1">
            <svg className="w-full h-full" viewBox="0 0 200 120">
              <path d="M 25 105 A 75 75 0 0 1 175 105" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
              <path
                d="M 25 105 A 75 75 0 0 1 175 105"
                fill="none"
                stroke={memColors.hex}
                strokeWidth="14"
                strokeDasharray="235"
                strokeDashoffset={235 - (235 * (memPercentage / 100))}
                strokeLinecap="round"
                opacity={0.3}
              />
              <circle cx="100" cy="105" r="8" fill="#334155" />
              <g style={{
                transformOrigin: "100px 105px",
                transform: `rotate(${getGaugeDeg(metrics.memoryUsageMb, 0, metrics.memoryTotalMb)}deg)`,
                transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}>
                <line x1="100" y1="105" x2="100" y2="34" stroke={memColors.hex} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="105" r="4" fill={memColors.hex} />
              </g>
              <text x="20" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">0 MB</text>
              <text x="86" y="24" fill="#64748b" fontSize="9" fontFamily="monospace">2.0 GB</text>
              <text x="156" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">4.0 GB</text>
            </svg>

            <div className="absolute bottom-0 flex flex-col items-center">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${memColors.text}`}>
                {(metrics.memoryUsageMb / 1024).toFixed(2)} GB
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Total: <strong>4.00 GB LPDDR4X</strong>
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            <div>
              <span>Ring Buffer:</span>
              <strong className="block text-white">184 MB</strong>
            </div>
            <div>
              <span>Tensors:</span>
              <strong className="block text-white">430 MB</strong>
            </div>
            <div>
              <span>Free:</span>
              <strong className="block text-emerald-400">{metrics.memoryTotalMb - metrics.memoryUsageMb} MB</strong>
            </div>
          </div>
        </div>

        {/* Gauge 3: Battery SoC & Power Draw Monitor */}
        <div id="battery-monitoring-gauge-card" className="p-4 lg:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-between text-center relative overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="w-full flex items-center justify-between text-xs pb-1 mb-2 border-b border-slate-800/80">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              {metrics.solarChargingActive && metrics.solarInputWatts > metrics.powerDrawWatts ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-4 h-4 text-amber-400" />
              )}
              3S Li-Ion Battery SoC (%)
            </span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              metrics.batteryPercent <= 20
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : metrics.solarChargingActive && metrics.solarInputWatts > metrics.powerDrawWatts
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}>
              {metrics.solarChargingActive && metrics.solarInputWatts > metrics.powerDrawWatts
                ? "⚡ SOLAR CHARGING"
                : metrics.batteryPercent <= 20
                ? "LOW BATTERY"
                : "DISCHARGING"}
            </span>
          </div>

          <div className="relative w-52 h-32 flex items-center justify-center my-1">
            <svg className="w-full h-full" viewBox="0 0 200 120">
              <path d="M 25 105 A 75 75 0 0 1 175 105" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
              <path
                d="M 25 105 A 75 75 0 0 1 175 105"
                fill="none"
                stroke={battColors.hex}
                strokeWidth="14"
                strokeDasharray="235"
                strokeDashoffset={235 - (235 * (metrics.batteryPercent / 100))}
                strokeLinecap="round"
                opacity={0.35}
              />
              <circle cx="100" cy="105" r="8" fill="#334155" />
              <g style={{
                transformOrigin: "100px 105px",
                transform: `rotate(${getGaugeDeg(metrics.batteryPercent, 0, 100)}deg)`,
                transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}>
                <line x1="100" y1="105" x2="100" y2="34" stroke={battColors.hex} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="105" r="4" fill={battColors.hex} />
              </g>
              <text x="20" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">0%</text>
              <text x="92" y="24" fill="#64748b" fontSize="9" fontFamily="monospace">50%</text>
              <text x="156" y="118" fill="#64748b" fontSize="9" fontFamily="monospace">100%</text>
            </svg>

            <div className="absolute bottom-0 flex flex-col items-center">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${battColors.text}`}>
                {metrics.batteryPercent.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                AI Power: <strong className="text-amber-400">{metrics.powerDrawWatts}W</strong>
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            <div>
              <span>Est. Runtime:</span>
              <strong className="block text-emerald-400">{metrics.estimatedRuntimeHours}h</strong>
            </div>
            <div>
              <span>Pack Voltage:</span>
              <strong className="block text-white">{metrics.batteryVoltageV}V</strong>
            </div>
            <div>
              <span>Solar Input:</span>
              <strong className="block text-amber-400">+{metrics.solarInputWatts}W</strong>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED: RECHARTS LINE GRAPH - BATTERY CONSUMPTION & INFERENCE INTENSITY CORRELATION */}
      <div id="battery-inference-recharts-card" className="p-4 lg:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              Battery Consumption (%) vs. Active AI Inference Intensity Over Time
            </h3>
            <p className="text-xs text-slate-400">
              Dual-axis temporal telemetry tracking battery discharge curves alongside Hailo-8 NPU inference workload
            </p>
          </div>

          {/* Timeframe selector: Live 30-Tick Window vs 24-Hour Benchmark */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="chart-view-live-btn"
              onClick={() => setGraphTimeframe("live")}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                graphTimeframe === "live"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Live Streaming (30s)
            </button>
            <button
              id="chart-view-benchmark-btn"
              onClick={() => setGraphTimeframe("benchmark")}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                graphTimeframe === "benchmark"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              24-Hour Solar/Inference Cycle
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Legend Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-slate-300 font-semibold">Battery SoC (%)</span>
            </div>
            <strong className="font-mono text-emerald-400 text-sm">
              {metrics.batteryPercent.toFixed(1)}%
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-slate-300 font-semibold">Inference Load (%)</span>
            </div>
            <strong className="font-mono text-cyan-400 text-sm">
              {metrics.npuUtilizationPercent}%
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-slate-300 font-semibold">Power Draw (Watts)</span>
            </div>
            <strong className="font-mono text-amber-400 text-sm">
              {metrics.powerDrawWatts}W
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
              <span className="text-slate-300 font-semibold">Drain Rate (%/hr)</span>
            </div>
            <strong className="font-mono text-rose-400 text-sm">
              -{metrics.drainRatePercentPerHour}%/h
            </strong>
          </div>
        </div>

        {/* Recharts Line Graph Container */}
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayChartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
              />
              {/* Left Y-Axis: Battery % and Inference Intensity % (0 - 100%) */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#10b981"
                tick={{ fill: "#10b981", fontSize: 10, fontFamily: "monospace" }}
                label={{ value: "Battery & Inference (%)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
              />
              {/* Right Y-Axis: Power Draw in Watts (0 - 20W) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 20]}
                stroke="#fbbf24"
                tick={{ fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" }}
                label={{ value: "Power Draw (Watts)", angle: 90, position: "insideRight", fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "11px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                }}
                formatter={(value: any, name: any) => {
                  if (name === "Battery Level (%)") return [`${Number(value).toFixed(1)}%`, name];
                  if (name === "Inference Intensity (%)") return [`${value}%`, name];
                  if (name === "Power Draw (Watts)") return [`${value} W`, name];
                  if (name === "Drain Rate (%/hr)") return [`${value}% / hr`, name];
                  return [value, name];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              />

              {/* Reference line for Low Battery Alert Level (20%) */}
              <ReferenceLine yAxisId="left" y={20} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Critical Battery Floor (20%)", fill: "#f43f5e", fontSize: 9 }} />

              {/* Line 1: Battery Level Percentage (%) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="batteryPct"
                name="Battery Level (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#020617" }}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
              />

              {/* Line 2: Active AI Inference Intensity & NPU Utilization (%) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inferenceIntensity"
                name="Inference Intensity (%)"
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 2, fill: "#22d3ee" }}
              />

              {/* Line 3: Power Draw in Watts */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="powerWatts"
                name="Power Draw (Watts)"
                stroke="#fbbf24"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#fbbf24" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inference Intensity vs. Power Drain Mathematical Correlation Summary */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Inference Intensity vs. Battery Discharge Rate Mathematical Analysis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Standby Sleep (5 FPS)</span>
              <div className="flex justify-between items-baseline mt-1">
                <strong className="text-indigo-400 font-mono">1.4 Watts</strong>
                <span className="text-emerald-400 font-mono text-[11px]">-0.27%/hr</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Est. Runtime: ~37 Hours</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Standard YOLOv8 (30 FPS)</span>
              <div className="flex justify-between items-baseline mt-1">
                <strong className="text-amber-400 font-mono">6.2 Watts</strong>
                <span className="text-amber-400 font-mono text-[11px]">-1.19%/hr</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Est. Runtime: ~18.5 Hours</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Dual-Fusion (45 FPS)</span>
              <div className="flex justify-between items-baseline mt-1">
                <strong className="text-cyan-400 font-mono">8.9 Watts</strong>
                <span className="text-rose-400 font-mono text-[11px]">-1.71%/hr</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Est. Runtime: ~12.2 Hours</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Peak Hazard Stress (60 FPS)</span>
              <div className="flex justify-between items-baseline mt-1">
                <strong className="text-rose-400 font-mono">14.8 Watts</strong>
                <span className="text-rose-500 font-mono text-[11px] font-bold">-2.85%/hr</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Est. Runtime: ~6.8 Hours</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong>Key Correlation Insight:</strong> The <strong>Hailo-8 NPU</strong> operates at an ultra-efficient 8.2 FPS/Watt. Increasing inference intensity from 5 FPS standby (1.4W) to standard continuous 30 FPS surveillance (6.2W) increases battery discharge by +0.92% SoC/hour. Combining this with the <strong>Dusk-to-Dawn schedule</strong> preserves 50.4 Wh/day, extending off-grid battery pack operation from 18 hours to over 3.2 days without solar recharge.
          </p>
        </div>
      </div>

      {/* Real-time Temperature & Load Secondary Area Chart */}
      <div className="p-4 lg:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-rose-400" /> Thermal Dissipation &amp; Fan Speed Telemetry
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> CPU Die (°C)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> CPU Load (%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Fan RPM / 50</span>
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
              />
              <Area
                type="monotone"
                dataKey="npuLoad"
                name="NPU Utilization (%)"
                stroke="#22d3ee"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#loadGradient)"
              />
              <Area
                type="monotone"
                dataKey="powerWatts"
                name="Total Power (W)"
                stroke="#fbbf24"
                strokeWidth={2}
                fillOpacity={0.3}
                fill="#fbbf24"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Edge Daemon Diagnostic Summary & Mitigation Protocol Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Thermal Throttle Guard</span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Auto dynamic frame skipping activates if die temp crosses 78°C to prevent downclocking.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5">
            <Battery className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Inference Power Profile</span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Edge pipeline consumes <strong className="text-amber-400 font-mono">{metrics.powerDrawWatts}W</strong> at {metrics.fpsThroughput} FPS YOLO inferencing.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Power Rail Stability</span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Main 5V rail at <strong className="text-emerald-400 font-mono">{metrics.voltageV}V</strong>. 3S pack at <strong className="text-white font-mono">{metrics.batteryVoltageV}V</strong>.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mt-0.5">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">NPU Coprocessor Efficiency</span>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Hailo-8 M.2 delivers 26 TOPS at only 2.5W, yielding 8.2 FPS/Watt efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
