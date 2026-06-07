import React from "react";
import { HelpCircle, KeyRound, MonitorOff, X } from "lucide-react";

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUT_ITEMS = [
  { key: "Space", desc: "Toggle Play / Pause" },
  { key: "← Left", desc: "Seek Backward 5 seconds" },
  { key: "→ Right", desc: "Seek Forward 5 seconds" },
  { key: "↑ Up", desc: "Volume Up 5%" },
  { key: "↓ Down", desc: "Volume Down 5%" },
  { key: "M", desc: "Mute / Unmute Audio" },
  { key: "S", desc: "Toggle Playlist Shuffle" },
  { key: "R", desc: "Toggle Playlist Repeat" },
  { key: "H", desc: "Show/Hide UI (Enter Zen mode)" },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      id="shortcuts-overlay-screen"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-3xl border border-white/20 bg-slate-950/85 backdrop-blur-xl text-white shadow-2xl p-5 flex flex-col gap-4 animate-scale-up"
        id="shortcuts-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10" id="shortcuts-header">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-cyan-400 rotate-12" />
            <span className="text-sm font-bold tracking-wider uppercase font-sans">Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            id="close-shortcuts-btn"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mappings view */}
        <div className="flex flex-col gap-2.5 my-1" id="shortcuts-list">
          {SHORTCUT_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-xs font-sans">
              <span className="text-white/50 text-left font-medium">{item.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-white/15 border border-white/15 font-mono text-[10px] text-cyan-300 font-extrabold shadow-sm tracking-wider">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Zen instructions banner */}
        <div className="p-2.5 bg-cyan-950/20 border border-cyan-700/25 rounded-xl flex gap-2 items-start text-[10px] text-cyan-200/80 leading-relaxed font-sans" id="zen-mode-info-block">
          <MonitorOff size={28} className="text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Press <strong>H</strong> to hide all overlays and enter <strong>Zen mode</strong>, allowing you to enjoy the music and interactive water droplets without distraction.
          </p>
        </div>
      </div>
    </div>
  );
};
