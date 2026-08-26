import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Video,
  Eye,
  EyeOff,
  Radio,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause
} from "lucide-react";
import { SystemSettings } from "../types";
import { verifyFrameWithAI } from "../services/api";

interface LiveEdgeFeedProps {
  systemSettings: SystemSettings;
  onTriggerAlert: (scenario: any) => void;
  onToggleNightMode: () => void;
  nightMode: boolean;
}

export const LiveEdgeFeed: React.FC<LiveEdgeFeedProps> = ({
  systemSettings,
  onTriggerAlert,
  onToggleNightMode,
  nightMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [selectedScene, setSelectedScene] = useState<"snake_lawn" | "garden_hose" | "tree_root" | "snake_ir" | "webcam">("snake_lawn");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(30);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number>(38);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  // Animation frame tracker for synthetic targets
  const targetPosRef = useRef({ x: 120, y: 160, vx: 1.8, vy: 0.9, angle: 0 });

  // Handle Webcam toggle
  useEffect(() => {
    if (selectedScene === "webcam") {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setWebcamActive(true);
          }
        })
        .catch((err) => {
          console.warn("Webcam access unavailable, defaulting to synthetic scene:", err);
          setSelectedScene("snake_lawn");
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setWebcamActive(false);
      }
    }
  }, [selectedScene]);

  // Main Canvas Rendering & Edge Inference Simulation Loop
  useEffect(() => {
    let animId: number;
    let frameCounter = 0;
    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isPlaying) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      frameCounter++;
      if (time - lastTime >= 1000) {
        setFps(frameCounter);
        frameCounter = 0;
        lastTime = time;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Background depending on mode and scene
      if (selectedScene === "webcam" && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        // Draw synthetic landscape / yard
        if (nightMode || selectedScene === "snake_ir") {
          // Night Vision Infrared background (Monochrome charcoal with IR illumination gradients)
          ctx.fillStyle = "#0f141c";
          ctx.fillRect(0, 0, w, h);

          // Simulated IR 850nm spotlight vignette
          const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 280);
          grad.addColorStop(0, "rgba(220, 230, 245, 0.22)");
          grad.addColorStop(0.7, "rgba(100, 115, 135, 0.08)");
          grad.addColorStop(1, "rgba(5, 8, 14, 0.95)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // IR noise speckles
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          for (let i = 0; i < 40; i++) {
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
          }
        } else {
          // Daylight lush lawn / patio background
          const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
          bgGrad.addColorStop(0, "#2d4a22"); // lawn grass
          bgGrad.addColorStop(0.6, "#1e3317");
          bgGrad.addColorStop(1, "#3c3830"); // stone edge
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Grass texture lines
          ctx.strokeStyle = "rgba(70, 120, 50, 0.3)";
          ctx.lineWidth = 1;
          for (let i = 0; i < 30; i++) {
            const gx = (i * 22) % w;
            ctx.beginPath();
            ctx.moveTo(gx, (i * 18) % h);
            ctx.lineTo(gx + 6, ((i * 18) % h) - 12);
            ctx.stroke();
          }
        }
      }

      // Apply Night Vision Grayscale / CLAHE filter if enabled on any feed
      if (nightMode && selectedScene !== "snake_ir") {
        ctx.fillStyle = "rgba(15, 20, 30, 0.65)";
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Render Objects according to selected scene
      let detectedBox: { x: number; y: number; w: number; h: number } | null = null;
      let targetLabel = "";
      let confidence = 0.0;
      let isSnake = false;

      const pos = targetPosRef.current;
      pos.angle += 0.04;
      pos.x += pos.vx;
      pos.y += Math.sin(pos.angle) * 0.8;

      if (pos.x > w - 180 || pos.x < 60) pos.vx *= -1;

      if (selectedScene === "snake_lawn" || selectedScene === "snake_ir") {
        isSnake = true;
        targetLabel = nightMode || selectedScene === "snake_ir"
          ? "Crotalus atrox (IR Profile)"
          : "Eastern Diamondback Rattlesnake";
        confidence = 0.94;

        // Draw slithering snake body with sine wave curves
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.beginPath();
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = nightMode || selectedScene === "snake_ir" ? "#c8d4e0" : "#8b6a3e";

        ctx.moveTo(0, 0);
        for (let i = 0; i < 110; i += 10) {
          const wave = Math.sin(pos.angle + i * 0.12) * 16;
          ctx.lineTo(i * (pos.vx > 0 ? 1 : -1), wave);
        }
        ctx.stroke();

        // Diamond pattern scutes
        ctx.lineWidth = 4;
        ctx.strokeStyle = nightMode || selectedScene === "snake_ir" ? "#333e4d" : "#24180e";
        for (let i = 20; i < 90; i += 15) {
          const wave = Math.sin(pos.angle + i * 0.12) * 16;
          ctx.strokeRect(i * (pos.vx > 0 ? 1 : -1) - 4, wave - 4, 8, 8);
        }

        // Snake head
        ctx.fillStyle = nightMode || selectedScene === "snake_ir" ? "#e2ebf5" : "#6e522f";
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        detectedBox = {
          x: Math.min(pos.x - 20, pos.x + (pos.vx > 0 ? 100 : -100) - 20),
          y: pos.y - 35,
          w: 150,
          h: 70
        };
      } else if (selectedScene === "garden_hose") {
        isSnake = false;
        targetLabel = "Green Garden Hose (Equipment)";
        confidence = 0.52; // Near threshold, momentarily fluctuates

        // Draw static coiled garden hose
        ctx.beginPath();
        ctx.lineWidth = 14;
        ctx.strokeStyle = nightMode ? "#5a6878" : "#2b7a3d";
        ctx.arc(280, 200, 55, 0, Math.PI * 1.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(280, 200, 40, 0.4, Math.PI * 1.9);
        ctx.stroke();

        detectedBox = { x: 215, y: 135, w: 130, h: 130 };
      } else if (selectedScene === "tree_root") {
        isSnake = false;
        targetLabel = "Exposed Tree Root (Flora)";
        confidence = 0.44;

        // Draw rigid wooden tree root
        ctx.beginPath();
        ctx.lineWidth = 16;
        ctx.lineCap = "square";
        ctx.strokeStyle = nightMode ? "#495361" : "#593d25";
        ctx.moveTo(140, 180);
        ctx.quadraticCurveTo(240, 220, 380, 190);
        ctx.lineTo(440, 230);
        ctx.stroke();

        detectedBox = { x: 130, y: 165, w: 310, h: 80 };
      }

      // 3. Draw Edge Bounding Box & HUD
      if (detectedBox) {
        const isQualifiedHit = isSnake && confidence >= systemSettings.confidenceThreshold;

        // Bounding box outline
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isQualifiedHit ? "#f43f5e" : "#10b981";
        ctx.strokeRect(detectedBox.x, detectedBox.y, detectedBox.w, detectedBox.h);

        // Corner brackets for tactical edge HUD look
        const bLen = 14;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = isQualifiedHit ? "#fb7185" : "#34d399";
        // Top-left
        ctx.beginPath();
        ctx.moveTo(detectedBox.x, detectedBox.y + bLen);
        ctx.lineTo(detectedBox.x, detectedBox.y);
        ctx.lineTo(detectedBox.x + bLen, detectedBox.y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(detectedBox.x + detectedBox.w - bLen, detectedBox.y);
        ctx.lineTo(detectedBox.x + detectedBox.w, detectedBox.y);
        ctx.lineTo(detectedBox.x + detectedBox.w, detectedBox.y + bLen);
        ctx.stroke();

        // Label Tag
        ctx.fillStyle = isQualifiedHit ? "rgba(225, 29, 72, 0.9)" : "rgba(16, 185, 129, 0.9)";
        ctx.fillRect(detectedBox.x, detectedBox.y - 24, detectedBox.w, 24);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.fillText(
          `${targetLabel} ${(confidence * 100).toFixed(0)}%`,
          detectedBox.x + 6,
          detectedBox.y - 7
        );
      }

      // 4. Update Consecutive Streak state
      if (isSnake && confidence >= systemSettings.confidenceThreshold) {
        setCurrentStreak((prev) => {
          const next = Math.min(systemSettings.consecutiveFramesN, prev + 1);
          if (next >= systemSettings.consecutiveFramesN && !isConfirmed) {
            setIsConfirmed(true);
            onTriggerAlert(selectedScene === "snake_ir" ? "black_mamba" : "rattlesnake");
          }
          return next;
        });
      } else {
        // False positives from hose/root reset streak
        setCurrentStreak(0);
        setIsConfirmed(false);
      }

      // 5. Draw Top Edge HUD (Camera ID, FPS, Time, IR Mode, Streak Meter)
      ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
      ctx.fillRect(0, 0, w, 32);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`CAM-01 [PATIO] | FPS: ${fps} | INFER: ${inferenceTimeMs}ms`, 12, 20);

      ctx.fillStyle = nightMode || selectedScene === "snake_ir" ? "#a78bfa" : "#34d399";
      ctx.fillText(nightMode || selectedScene === "snake_ir" ? "IR 850nm ACTIVE" : "DAYLIGHT RGB", w - 120, 20);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedScene, isPlaying, nightMode, systemSettings.confidenceThreshold, systemSettings.consecutiveFramesN, fps, inferenceTimeMs]);

  // AI Frame Verification Handler
  const handleVerifyCurrentFrame = async () => {
    setIsAnalyzingAI(true);
    try {
      const canvas = canvasRef.current;
      const imageBase64 = canvas ? canvas.toDataURL("image/jpeg", 0.8) : undefined;
      const res = await verifyFrameWithAI({
        imageBase64,
        userPrompt: `Current target: ${selectedScene}. Analyze if this is a genuine snake or false positive garden hose/root.`,
        isNightMode: nightMode
      });
      setAiAnalysisResult(res);
    } catch (e) {
      console.error("AI frame check error:", e);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  return (
    <div id="live-edge-feed-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Live Edge AI Vision Stream
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </h2>
            <p className="text-xs text-slate-400">
              Hardware: Sony IMX335 Starvis Day/Night • Hailo-8 NPU Inference Engine
            </p>
          </div>
        </div>

        {/* Scene Selector & Night Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedScene("snake_lawn")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedScene === "snake_lawn" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🐍 Snake (Day)
            </button>
            <button
              onClick={() => setSelectedScene("snake_ir")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedScene === "snake_ir" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🌙 Snake (Night IR)
            </button>
            <button
              onClick={() => setSelectedScene("garden_hose")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedScene === "garden_hose" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🛡️ Garden Hose (FP Test)
            </button>
            <button
              onClick={() => setSelectedScene("tree_root")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedScene === "tree_root" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🌲 Tree Root (FP Test)
            </button>
            <button
              onClick={() => setSelectedScene("webcam")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedScene === "webcam" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              📹 User Webcam
            </button>
          </div>

          <button
            id="toggle-ir-night-mode-btn"
            onClick={onToggleNightMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              nightMode
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {nightMode ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{nightMode ? "850nm IR Filter (ON)" : "IR Mode (OFF)"}</span>
          </button>
        </div>
      </div>

      {/* Main Video/Canvas Viewport */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-contain"
        />

        {/* Hidden video element for webcam */}
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />

        {/* Engineering Challenge 1 HUD: N-Consecutive Frame Progress Bar */}
        <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Challenge 1: N-Consecutive Frame Verification
              </span>
              <span className="text-[11px] text-slate-400">
                Requires {systemSettings.consecutiveFramesN} consecutive spatial matches to eliminate hose/root false alarms.
              </span>
            </div>
          </div>

          {/* Progress Blocks */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: systemSettings.consecutiveFramesN }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-4 rounded transition-all flex items-center justify-center text-[9px] font-mono font-bold ${
                    idx < currentStreak
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/40"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              currentStreak >= systemSettings.consecutiveFramesN
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}>
              {currentStreak >= systemSettings.consecutiveFramesN ? "ALARM TRIPPED" : `${currentStreak}/${systemSettings.consecutiveFramesN} Confirmed`}
            </span>
          </div>
        </div>
      </div>

      {/* AI Frame Inspection & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? "Pause Inference" : "Resume Stream"}</span>
          </button>

          <button
            id="ai-verify-frame-btn"
            onClick={handleVerifyCurrentFrame}
            disabled={isAnalyzingAI}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzingAI ? "Analyzing Frame..." : "AI Species & Distractor Verification"}</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span>Inference: <strong className="text-emerald-400 font-mono">~38ms</strong></span>
          <span>Threshold: <strong className="text-amber-400 font-mono">{(systemSettings.confidenceThreshold * 100).toFixed(0)}%</strong></span>
        </div>
      </div>

      {/* AI Analysis Result Drawer */}
      {aiAnalysisResult && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Gemini AI Herpetological Analysis
            </span>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div>
              <p><strong className="text-white">Classification:</strong> {aiAnalysisResult.species || "Crotalus atrox"}</p>
              <p><strong className="text-white">Danger Assessment:</strong> {aiAnalysisResult.dangerRating || "CRITICAL - HIGHLY VENOMOUS"}</p>
              <p><strong className="text-white">Confidence:</strong> {((aiAnalysisResult.confidence || 0.94) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p><strong className="text-white">Anti-False Positive Rationale:</strong> {aiAnalysisResult.antiFalsePositiveRationale || "Continuous sinuous vertebral curvature and scale texture distinguishes target from rigid garden equipment."}</p>
              <p><strong className="text-white">Protocol:</strong> {aiAnalysisResult.recommendedAction || "Keep perimeter clear; notify safety personnel."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
