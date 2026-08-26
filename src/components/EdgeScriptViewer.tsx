import React, { useState, useEffect } from "react";
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Download,
  FileCode,
  Play,
  Layers,
  Cpu
} from "lucide-react";
import { fetchEdgeScript, fetchTrainingScript } from "../services/api";

export const EdgeScriptViewer: React.FC = () => {
  const [activeScript, setActiveScript] = useState<"edge" | "train">("edge");
  const [edgeCode, setEdgeCode] = useState<string>("");
  const [trainCode, setTrainCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchEdgeScript().then(setEdgeCode).catch(console.error);
    fetchTrainingScript().then(setTrainCode).catch(console.error);
  }, []);

  const currentCode = activeScript === "edge" ? edgeCode : trainCode;
  const currentFilename = activeScript === "edge" ? "edge_detector.py" : "train_yolo_snake.py";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="edge-script-viewer-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Edge Python Daemon & Training Code
            </h2>
            <p className="text-xs text-slate-400">
              Production Python scripts for Jetson Orin / Raspberry Pi 5 + Hailo NPU deployments
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveScript("edge")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeScript === "edge" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🐍 edge_detector.py
            </button>
            <button
              onClick={() => setActiveScript("train")}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeScript === "train" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🧠 train_yolo_snake.py
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 max-h-[420px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <FileCode className="w-3.5 h-3.5" /> {currentFilename}
          </span>
          <span>Target: Linux (ARM64 / x86_64) • Python 3.9+</span>
        </div>
        <pre className="leading-relaxed whitespace-pre font-mono text-[11px]">
          {currentCode || "# Loading script..."}
        </pre>
      </div>

      {/* Execution Instructions */}
      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <span className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Deploy directly to Edge Device: Run <code>python edge_detector.py --camera 0 --conf 0.60</code></span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          N-Frame Ring Buffer: Active • Webhook Latency: ~88ms
        </span>
      </div>
    </div>
  );
};
