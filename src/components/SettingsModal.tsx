import React, { useState, useEffect } from "react";
import { Folder, HardDrive, Key, LayoutGrid, Link, RefreshCw, Server, X } from "lucide-react";
import { NavidromeConfig, BackgroundImage } from "../types";

interface SettingsModalProps {
  onClose: () => void;
  config: NavidromeConfig;
  onSaveConfig: (newConfig: Partial<NavidromeConfig>) => Promise<boolean>;
  onTestConnection: () => Promise<{ connected: boolean; version?: string; error?: string | null }>;
  onSelectBackground: (url: string | null) => void;
  currentBgUrl: string | null;
  themeGradient?: string;
  onSelectThemeGradient?: (gradient: string) => void;
}

const PRESET_GRADIENTS = [
  {
    name: "Ocean Glow",
    gradient: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 35%, #415a77 75%, #778da9 100%)",
  },
  {
    name: "Lagoon Mist",
    gradient: "radial-gradient(circle at top left, #013a63 0%, #014f86 33%, #018fcc 66%, #a9d6e5 100%)",
  },
  {
    name: "Deep Abyss",
    gradient: "linear-gradient(160deg, #02010a 0%, #0d0c22 40%, #1a1a40 75%, #270082 100%)",
  },
  {
    name: "Neon Kelp",
    gradient: "linear-gradient(to bottom, #072e33 0%, #0c7075 40%, #0f969c 75%, #6da5c0 100%)",
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
  onSelectBackground,
  currentBgUrl,
  themeGradient,
  onSelectThemeGradient,
}) => {
  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [username, setUsername] = useState(config.username);
  const [password, setPassword] = useState("");
  const [backgroundFolder, setBackgroundFolder] = useState(config.backgroundFolder);
  
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [scannedBackgrounds, setScannedBackgrounds] = useState<BackgroundImage[]>([]);
  const [scannedFolder, setScannedFolder] = useState<string>("");
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  // Load scanned background files on mount/active directory change
  const fetchScannedImages = async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch("/api/backgrounds");
      const data = await response.json();
      if (data.success) {
        setScannedBackgrounds(data.files || []);
        setScannedFolder(data.bgFolder || "");
      }
    } catch (e) {
      console.error("Error loading scanned images:", e);
    } finally {
      setIsLoadingImages(false);
    }
  };

  useEffect(() => {
    fetchScannedImages();
    testCurrentConnection();
  }, []);

  const testCurrentConnection = async () => {
    setConnectionStatus("testing");
    const res = await onTestConnection();
    if (res.connected) {
      setConnectionStatus("success");
      setConnectionError(null);
    } else {
      setConnectionStatus("failed");
      setConnectionError(res.error || "Failed to make ping connect request.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    
    const payload: Partial<NavidromeConfig> = {
      serverUrl,
      username,
      backgroundFolder,
    };
    if (password) {
      payload.password = password;
    }

    const ok = await onSaveConfig(payload);
    if (ok) {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
      setPassword(""); // Clear input password once persistent server saved
      fetchScannedImages(); // refresh scanned background folders
      testCurrentConnection(); // ping test with new credentials
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      id="settings-backdrop-container"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/20 bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl flex flex-col p-6 animate-scale-up"
        id="settings-overlay-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <Server className="text-cyan-400 group-hover:rotate-12 transition-transform" />
            <h2 className="text-xl font-bold font-sans tracking-tight">System Settings</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-[10px] rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            id="close-settings-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Configuration Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6" id="settings-modules-split">
          {/* Navidrome connect config details */}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-white/5">
              <Link size={12} />
              <span>Navidrome Server</span>
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/50 font-semibold font-sans">SERVER URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="e.g. http://192.168.1.100:4533"
                  className="w-full pl-8 pr-3 py-1.5 bg-black/35 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/35 focus:outline-hidden focus:border-cyan-400/50"
                  required
                />
                <Server size={12} className="absolute left-2.5 top-[11px] text-white/40" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/50 font-semibold font-sans">SUBSONIC USERNAME</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-8 pr-3 py-1.5 bg-black/35 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/35 focus:outline-hidden focus:border-cyan-400/50"
                  required
                />
                <HardDrive size={12} className="absolute left-2.5 top-[11px] text-white/40" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/50 font-semibold font-sans">
                PASSWORD {config.isConfigured && <span className="text-[9px] text-emerald-400 font-sans tracking-normal">(Saved)</span>}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={config.isConfigured ? "•••••••• (Enter new to rewrite)" : "Password"}
                  className="w-full pl-8 pr-3 py-1.5 bg-black/35 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/35 focus:outline-hidden focus:border-cyan-400/50"
                  required={!config.isConfigured}
                />
                <Key size={12} className="absolute left-2.5 top-[11px] text-white/40" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/50 font-semibold font-sans">BACKGROUND IMAGE FOLDER</label>
              <div className="relative">
                <input
                  type="text"
                  value={backgroundFolder}
                  onChange={(e) => setBackgroundFolder(e.target.value)}
                  placeholder="e.g. ./backgrounds"
                  className="w-full pl-8 pr-3 py-1.5 bg-black/35 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/35 focus:outline-hidden focus:border-cyan-400/50"
                  required
                />
                <Folder size={12} className="absolute left-2.5 top-[11px] text-white/40" />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveStatus === "saving"}
              className="w-full mt-2 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 font-sans hover:from-cyan-400 hover:to-blue-400 disabled:opacity-55 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
              id="save-config-submit-btn"
            >
              {saveStatus === "saving" ? "Persisting Config..." : saveStatus === "success" ? "Config Saved!" : "Save Credentials"}
            </button>
          </form>

          {/* Setup Connection Status & Presets */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-white/5">
              <Server size={12} />
              <span>Diagnostic Sync</span>
            </h3>

            {/* Connection report indicator panel */}
            <div className="p-3.5 bg-black/35 border border-white/10 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-medium">Link Diagnostics:</span>
                <div className="flex items-center gap-1.5">
                  {connectionStatus === "testing" ? (
                    <span className="flex items-center gap-1 text-cyan-400 font-semibold font-mono animate-pulse">
                      <RefreshCw size={10} className="animate-spin" /> Pinging...
                    </span>
                  ) : connectionStatus === "success" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30 font-sans tracking-wide">
                      ▼ ONLINE
                    </span>
                  ) : connectionStatus === "failed" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/30 font-sans tracking-wide">
                      ▲ FAIL
                    </span>
                  ) : (
                    <span className="text-white/40 text-[10px] font-bold">UNCONFIGURED</span>
                  )}
                  <button
                    type="button"
                    onClick={testCurrentConnection}
                    className="p-1 rounded-sm hover:bg-white/10 text-white/50 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Refresh connection status"
                    id="retest-connection-btn"
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>
              </div>

              {connectionError && (
                <div className="text-[10px] text-rose-300/90 font-mono bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg max-h-[80px] overflow-y-auto leading-relaxed">
                  {connectionError}
                </div>
              )}
              {!connectionError && config.isConfigured && connectionStatus === "success" && (
                <div className="text-[10px] text-emerald-300/90 font-sans bg-emerald-950/25 border border-emerald-900/30 p-2 rounded-lg leading-relaxed">
                  ✓ Successfully paired with Subsonic API. Media catalog synchronized and stream proxy configured.
                </div>
              )}
              {!config.isConfigured && (
                <div className="text-[10px] text-white/40 font-medium font-sans leading-relaxed text-center py-2">
                  Configure server parameters on the left to lock backend stream proxies.
                </div>
              )}
            </div>

            {/* Gradient Options header */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-white/50 font-bold tracking-wider uppercase flex items-center gap-1">
                <LayoutGrid size={11} />
                <span>Liquid Preset Themes</span>
              </span>
              <div className="grid grid-cols-2 gap-2" id="gradient-presets-grid">
                {PRESET_GRADIENTS.map((p) => {
                  const isCurrent = currentBgUrl === null && themeGradient === p.gradient; // Active preset matching both null image background and identical gradient CSS
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        onSelectBackground(null); // clears background image to allow gradient
                        onSelectThemeGradient?.(p.gradient); // sets the selected dynamic gradient style
                      }}
                      style={{ background: p.gradient }}
                      className={`h-11 rounded-xl flex items-end p-2 border relative group overflow-hidden cursor-pointer transition-all ${
                        isCurrent 
                          ? "border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_4px_15px_rgba(34,211,238,0.25)] scale-[1.01]" 
                          : "border-white/15 hover:border-white/30"
                      }`}
                      id={`gradient-preset-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      <span className="text-[10px] font-bold font-sans text-white relative z-10">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic cover art folder background images */}
        <div className="flex flex-col gap-3 mt-2 border-t border-white/10 pt-4" id="folder-scanned-images-module">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
              <Folder size={12} />
              <span>Cover Art Background Directory</span>
            </span>
            <span className="text-[10px] text-white/40 font-mono break-all max-w-[280px]">
              {scannedFolder || backgroundFolder}
            </span>
          </div>

          {isLoadingImages ? (
            <div className="flex justify-center items-center py-8 text-white/50 text-xs gap-2" id="scanned-bg-loader">
              <RefreshCw size={14} className="animate-spin text-cyan-400" /> Scanning folder paths...
            </div>
          ) : scannedBackgrounds.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-black/20 text-white/40 text-xs flex flex-col gap-1.5" id="scanned-bg-empty">
              <span>No image files detected in designated folder path.</span>
              <span className="text-[10px] max-w-[380px] mx-auto text-white/30 leading-snug">
                Drop high-resolution cover photos (JPG, PNG, WEBP) inside <strong>backgrounds/</strong> at your workspace root, and they'll instantly populate here dynamic selection.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto p-1" id="scanned-backgrounds-grid">
              {scannedBackgrounds.map((bg) => {
                const isSelected = currentBgUrl === bg.url;
                return (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => onSelectBackground(bg.url)}
                    className={`aspect-video rounded-xl overflow-hidden border relative group flex flex-col justify-end p-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-cyan-400 ring-2 ring-cyan-400/30 scale-[1.03] shadow-[0_4px_12px_rgba(34,211,238,0.3)] animate-pulse"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    id={`scanned-bg-card-${bg.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="relative z-10 text-[9px] truncate text-white/80 font-mono w-full text-left">
                      {bg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
