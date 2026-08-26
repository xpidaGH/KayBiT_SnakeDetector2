import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { X, BookOpen, Search, Copy, Check, FileText, Terminal, ExternalLink } from "lucide-react";
import { fetchUserGuideText, fetchReadmeText } from "../services/api";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "guide" | "readme";
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, defaultTab = "guide" }) => {
  const [activeTab, setActiveTab] = useState<"guide" | "readme">(defaultTab);
  const [guideContent, setGuideContent] = useState<string>("");
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchUserGuideText(), fetchReadmeText()])
        .then(([guide, readme]) => {
          setGuideContent(guide);
          setReadmeContent(readme);
        })
        .catch((err) => console.error("Failed to load guide docs:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentContent = activeTab === "guide" ? guideContent : readmeContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredContent = searchQuery.trim()
    ? currentContent
        .split("\n\n")
        .filter((paragraph) => paragraph.toLowerCase().includes(searchQuery.toLowerCase()))
        .join("\n\n")
    : currentContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="user-guide-modal-container"
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                KayBiT_SnakeDetector Manual
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  v2.4 Production
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Edge-AI Engineering Guide, N-Frame Filter Specs & FCM Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-user-guide-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
              title="Copy markdown text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy MD"}
            </button>
            <button
              id="close-user-guide-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              id="tab-user-guide-md"
              onClick={() => setActiveTab("guide")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "guide"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              USER_GUIDE.md
            </button>
            <button
              id="tab-readme-md"
              onClick={() => setActiveTab("readme")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "readme"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              README.md
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search guide sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto text-[11px] text-slate-400 scrollbar-thin">
          <span className="font-semibold text-slate-500 whitespace-nowrap uppercase tracking-wider">Jump to:</span>
          <button
            onClick={() => setSearchQuery("Architecture")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            Architecture
          </button>
          <button
            onClick={() => setSearchQuery("Consecutive Frame")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            Hose/Root Rejection (N-Frame)
          </button>
          <button
            onClick={() => setSearchQuery("Night-Vision")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            Night-Vision IR Augmentation
          </button>
          <button
            onClick={() => setSearchQuery("Latency")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            Sub-3s Latency Budget
          </button>
          <button
            onClick={() => setSearchQuery("edge_detector.py")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            Python Edge Daemon
          </button>
          <button
            onClick={() => setSearchQuery("Firebase")}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-700/50"
          >
            FCM Mobile WakeLock
          </button>
        </div>

        {/* Scrollable Markdown Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/60 text-slate-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading documentation from filesystem...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-amber max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-code:text-amber-300 prose-table:border prose-table:border-slate-800">
              <Markdown>{filteredContent}</Markdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Latency: &lt; 3.0s | N-Frame Spatial IoU: Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
