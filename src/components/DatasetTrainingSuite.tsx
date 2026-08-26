import React, { useState } from "react";
import {
  Database,
  Download,
  Terminal,
  Layers,
  CheckCircle,
  ExternalLink,
  Sliders,
  Sparkles,
  Cpu,
  BarChart3
} from "lucide-react";

export const DatasetTrainingSuite: React.FC = () => {
  const [activeDatasetTab, setActiveDatasetTab] = useState<"roboflow" | "kaggle" | "augmentation">("roboflow");
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownloadDatasetScript = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <div id="dataset-training-suite-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 shadow-xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Dataset Ingestion & YOLOv8/v11 Training Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Roboflow Universe & Kaggle SnakeCLEF Data Harvester with Hard Negative Distractor Injection
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveDatasetTab("roboflow")}
            className={`px-3 py-1 rounded-xl transition font-medium ${
              activeDatasetTab === "roboflow" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Roboflow Universe
          </button>
          <button
            onClick={() => setActiveDatasetTab("kaggle")}
            className={`px-3 py-1 rounded-xl transition font-medium ${
              activeDatasetTab === "kaggle" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Kaggle SnakeCLEF
          </button>
          <button
            onClick={() => setActiveDatasetTab("augmentation")}
            className={`px-3 py-1 rounded-xl transition font-medium ${
              activeDatasetTab === "augmentation" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            IR Augmentation Matrix
          </button>
        </div>
      </div>

      {/* Dataset Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Annotated Images</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">42,850</span>
          <span className="text-[10px] text-emerald-400 font-mono">100% YoloV8 PyTorch</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Venomous Species</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">26,400</span>
          <span className="text-[10px] text-slate-400">Vipers, Cobras, Mambas</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hard Negative Distractors</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">8,200</span>
          <span className="text-[10px] text-slate-400">Hoses, Roots, Cables</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Synthetic IR Augmented</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">18,500</span>
          <span className="text-[10px] text-indigo-300 font-mono">850nm Starvis Profiles</span>
        </div>
      </div>

      {/* Content depending on active tab */}
      {activeDatasetTab === "roboflow" && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Roboflow Universe Snake Datasets</h3>
            <span className="text-[10px] text-amber-400 font-mono">API: v2 / YOLOv8 Export</span>
          </div>
          <p className="text-slate-400">
            Automatically pulls high-resolution bounding box annotations for North American, African, and Asian venomous reptiles from community-curated datasets.
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
            <code>
              curl -L "https://universe.roboflow.com/ds/snake-detection-kaybit?key=YOUR_KEY" &gt; roboflow_snakes.zip
            </code>
          </div>
        </div>
      )}

      {activeDatasetTab === "kaggle" && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Kaggle SnakeCLEF Global Biodiversity Dataset</h3>
            <span className="text-[10px] text-blue-400 font-mono">300,000+ Field Observations</span>
          </div>
          <p className="text-slate-400">
            Extracts species-level geographic distributions and wild field photographs across varying terrain (scrubland, forests, concrete perimeters, agricultural dirt).
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto">
            <code>
              kaggle competitions download -c snakeclef2024-identification
            </code>
          </div>
        </div>
      )}

      {activeDatasetTab === "augmentation" && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Hard Negative Mining & IR Augmentation Pipeline</h3>
            <span className="text-[10px] text-indigo-400 font-mono">OpenCV + Albumentations</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block mb-1">1. Negative Distractor Injection</span>
              <p className="text-slate-400 text-[11px]">8,200 garden hoses, drip pipes, and roots labeled explicitly as class `Negative_Distractor`.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block mb-1">2. Infrared Desaturation</span>
              <p className="text-slate-400 text-[11px]">Dynamic 1-channel luminance extraction matching 850nm night-vision filters.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block mb-1">3. CLAHE & Highlight Bloom</span>
              <p className="text-slate-400 text-[11px]">Simulates infrared spotlight reflectance on smooth reptilian scales.</p>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Training Launch Command */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-amber-400" /> CLI Training Command (train_yolo_snake.py)
          </span>
          <button
            onClick={handleDownloadDatasetScript}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <Download className="w-3 h-3" />
            <span>{downloading ? "Exporting..." : "Export Training Script"}</span>
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
          <code>
            python train_yolo_snake.py --data snake_dataset.yaml --epochs 100 --imgsz 640 --batch 32 --augment-ir --weights yolov8n.pt
          </code>
        </div>
      </div>
    </div>
  );
};
