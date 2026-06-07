import React from "react";
import { ListMusic, Music, Play, Trash2, X } from "lucide-react";
import { Song } from "../types";

interface QueueDrawerProps {
  onClose: () => void;
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  onPlaySongAtIndex: (index: number) => void;
  onRemoveSongAtIndex: (index: number) => void;
  onClearPlaylist: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  onClose,
  playlist,
  currentIndex,
  isPlaying,
  onPlaySongAtIndex,
  onRemoveSongAtIndex,
  onClearPlaylist,
}) => {
  // Format utility for seconds -> mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in" id="queue-backdrop-screen">
      <div 
        className="w-full max-w-[380px] h-full border-l border-white/10 bg-slate-950/85 backdrop-blur-2xl text-white shadow-2xl flex flex-col p-5 animate-slide-left"
        id="queue-drawer-panel"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4" id="queue-header">
          <div className="flex items-center gap-2">
            <ListMusic className="text-cyan-400 animate-pulse" size={18} />
            <span className="text-sm font-bold tracking-wider uppercase font-sans">Active Play Queue ({playlist.length})</span>
          </div>
          <div className="flex items-center gap-1">
            {playlist.length > 0 && (
              <button
                type="button"
                onClick={onClearPlaylist}
                className="p-1 px-1.5 rounded-md hover:bg-rose-950/40 text-white/40 hover:text-rose-400 font-sans text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title="Wipe play queue"
                id="clear-queue-btn"
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-white/50 hover:text-white rounded-md hover:bg-white/10 cursor-pointer"
              id="close-queue-drawer-btn"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List of elements */}
        {playlist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-xs text-center p-4 gap-2" id="empty-queue-container">
            <Music size={22} className="text-white/20" />
            <p className="font-sans">The playlist queue is completely empty.</p>
            <p className="text-[10px] text-white/20 max-w-[200px] leading-relaxed">
              Explore your server catalog or play default water ambient tracks to fill up the queue.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 scroll-smooth" id="queue-scroll-container">
            {playlist.map((song, idx) => {
              const worksAsActive = idx === currentIndex;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                    worksAsActive
                      ? "bg-cyan-500/10 border-cyan-400/40 shadow-[rgba(34,211,238,0.05)_0_4px_12px]"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                  }`}
                  id={`queue-song-row-${idx}`}
                >
                  {/* Track info and playing indicator */}
                  <div 
                    onClick={() => onPlaySongAtIndex(idx)}
                    className="flex-1 flex items-center gap-2.5 min-w-0 cursor-pointer"
                  >
                    {worksAsActive ? (
                      <div className="h-4 w-4 flex gap-[2px] items-end justify-center pointer-events-none" id="mini-equalizer-bars">
                        <div className={`w-[2px] bg-cyan-400 rounded-xs ${isPlaying ? "h-3.5 animate-[bounce_0.6s_infinite_alternate]" : "h-1.5"}`} />
                        <div className={`w-[2px] bg-cyan-400 rounded-xs ${isPlaying ? "h-2 animate-[bounce_0.8s_infinite_alternate_0.2s]" : "h-2.5"}`} />
                        <div className={`w-[2px] bg-cyan-400 rounded-xs ${isPlaying ? "h-4 animate-[bounce_0.5s_infinite_alternate_0.1s]" : "h-1"}`} />
                      </div>
                    ) : (
                      <div className="h-4 w-4 flex items-center justify-center font-mono text-[10px] text-white/30 group-hover:hidden">
                        {(idx + 1).toString().padStart(2, "0")}
                      </div>
                    )}
                    
                    {/* Hover play action icon */}
                    {!worksAsActive && (
                      <div className="hidden group-hover:flex items-center justify-center h-4 w-4 text-cyan-400 pointer-events-none">
                        <Play size={10} fill="currentColor" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 flex flex-col text-left">
                      <span className={`text-[12px] font-bold truncate ${worksAsActive ? "text-cyan-300" : "text-white/90"}`}>
                        {song.title}
                      </span>
                      <span className="text-[10px] text-white/50 truncate font-mono">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  {/* Duration and action buttons */}
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-mono text-[10px] text-white/40">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveSongAtIndex(idx)}
                      className="p-1 rounded-sm text-white/20 hover:text-rose-400 hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Expunge from queue"
                      id={`queue-remove-${idx}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
