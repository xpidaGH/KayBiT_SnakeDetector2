import React, { useState } from "react";
import {
  Moon,
  Sun,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
  Camera
} from "lucide-react";

export const NightVisionSimulator: React.FC = () => {
  const [irWavelength, setIrWavelength] = useState<"850nm" | "940nm">("850nm");
  const [claheStrength, setClaheStrength] = useState<number>(3.0);
  const [noiseIntensity, setNoiseIntensity] = useState<number>(14);
  const [compareMode, setCompareMode] = useState<"side_by_side" | "ir_only">("side_by_side");

  return (
    <div id="night-vision-simulator-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Engineering Challenge 2: Night Vision & IR Training Augmentation
            </h2>
            <p className="text-xs text-slate-400">
              850nm/940nm Infrared Bandpass Modeling, Specular Scale Highlight Synthesis & CLAHE
            </p>
          </div>
        </div>

        {/* Wavelength Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-400 pl-2">IR Band:</span>
          <button
            onClick={() => setIrWavelength("850nm")}
            className={`px-3 py-1 rounded-xl transition font-medium ${
              irWavelength === "850nm" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            850nm (Long Range)
          </button>
          <button
            onClick={() => setIrWavelength("940nm")}
            className={`px-3 py-1 rounded-xl transition font-medium ${
              irWavelength === "940nm" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            940nm (Covert Stealth)
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Feed View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day RGB Frame */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> Standard Daytime RGB Feed
            </span>
            <span className="font-mono text-[10px] text-slate-500">Color Spectrum (400-700nm)</span>
          </div>

          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-emerald-950 via-slate-900 to-stone-900 border border-slate-800 flex items-center justify-center overflow-hidden">
            {/* Synthetic Daytime Snake */}
            <div className="relative w-48 h-16 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <path
                  d="M 20 40 Q 60 10 100 40 T 180 40"
                  fill="none"
                  stroke="#9a6e3a"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Diamond patterns in daylight */}
                <polygon points="50,30 60,40 50,50 40,40" fill="#2b1c0c" />
                <polygon points="90,30 100,40 90,50 80,40" fill="#2b1c0c" />
                <polygon points="130,30 140,40 130,50 120,40" fill="#2b1c0c" />
              </svg>
            </div>

            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-400">
              Confidence: 94.8%
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Visible color contrasts, distinct brown/black diamond dorsal markings, keeled scale textures.
          </p>
        </div>

        {/* Augmented Night-Vision IR Frame */}
        <div className="rounded-2xl bg-slate-950 border border-indigo-900/60 p-3 space-y-2 shadow-lg shadow-indigo-950/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Synthetic IR Augmentation (Night Mode)
            </span>
            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
              {irWavelength} Active
            </span>
          </div>

          <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
            {/* Synthetic Nighttime IR Snake with specular bloom and grayscale CLAHE */}
            <div className="relative w-48 h-16 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <path
                  d="M 20 40 Q 60 10 100 40 T 180 40"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Specular scute highlights in IR */}
                <polygon points="50,30 60,40 50,50 40,40" fill="#475569" stroke="#ffffff" strokeWidth="1" />
                <polygon points="90,30 100,40 90,50 80,40" fill="#475569" stroke="#ffffff" strokeWidth="1" />
                <polygon points="130,30 140,40 130,50 120,40" fill="#475569" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>

            {/* Specular IR Spotlight effect */}
            <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-black/80 pointer-events-none" />

            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-mono text-indigo-300">
              IR YOLOv8 Confidence: 92.4%
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Augmented with CLAHE clip limit {claheStrength}x and {noiseIntensity}σ Gaussian thermal noise to match Starvis night sensors.
          </p>
        </div>
      </div>

      {/* Augmentation Parameter Tuning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-300">CLAHE Contrast Enhancement</span>
            <span className="font-mono text-amber-400 font-bold">{claheStrength.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={5.0}
            step={0.5}
            value={claheStrength}
            onChange={(e) => setClaheStrength(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">Simulates intense contrast between IR illuminator spotlight and dark shadows.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-300">Sensor Thermal Noise Simulation</span>
            <span className="font-mono text-amber-400 font-bold">{noiseIntensity}σ</span>
          </div>
          <input
            type="range"
            min={4}
            max={30}
            value={noiseIntensity}
            onChange={(e) => setNoiseIntensity(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">Replicates high-gain night-mode sensor grain on low-light CMOS sensors.</p>
        </div>
      </div>
    </div>
  );
};
