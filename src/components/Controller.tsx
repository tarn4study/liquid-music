import React, { useRef } from "react";
import {
  HelpCircle,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Song, PlayerState } from "../types";

interface ControllerProps {
  playerState: PlayerState;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleQueue: () => void;
  onToggleSettings: () => void;
  onToggleShortcuts: () => void;
}

export const Controller: React.FC<ControllerProps> = ({
  playerState,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleQueue,
  onToggleSettings,
  onToggleShortcuts,
}) => {
  const { currentSong, isPlaying, volume, progress, isShuffle, isRepeat, isMuted } = playerState;
  const progressContainerRef = useRef<HTMLDivElement | null>(null);

  // Time formatter helper mm:ss
  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return "0:00";
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const duration = currentSong ? currentSong.duration : 0;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // Track layout click for seeking timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !progressContainerRef.current) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickFraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickFraction * duration);
  };

  // Cover image url builder or default gradient
  const coverUrl = currentSong?.coverArt 
    ? `/api/navidrome/coverArt?id=${currentSong.coverArt}&size=120`
    : null;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-[92%] max-w-[560px] p-6 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 transition-transform hover:scale-[1.005]"
      id="bottom-middle-music-deck"
    >
      {/* 1. Scrubber/Progress Timeline */}
      <div className="flex flex-col gap-2 w-full">
        {/* Clickable timeline bar */}
        <div
          ref={progressContainerRef}
          onClick={handleTimelineClick}
          className="h-[3.5px] w-full bg-white/10 rounded-full cursor-pointer relative group"
          id="audio-scrubber-timeline"
        >
          {/* Active play progress */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-end"
            id="timeline-progress-bar"
          >
            {/* Glowing visual handle knob */}
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white] translate-x-1 shrink-0" />
          </div>
        </div>

        <div className="flex justify-between text-[10px] font-bold text-white/40 font-mono">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 2. Core Actions row Split */}
      <div className="flex items-center justify-between gap-4 w-full px-0.5" id="controls-split-row">
        {/* Left pane: Active track metadata details */}
        <div className="flex items-center gap-3 min-w-0 w-[180px] sm:w-[220px]" id="meta-detail-panel">
          {/* Animated thumbnail container */}
          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-900 to-slate-900 border border-white/10 shrink-0 shadow-lg">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Album Cover"
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover transition-transform duration-1000 ${isPlaying ? "scale-105 animate-[spin_20s_linear_infinite]" : ""}`}
                style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              />
            ) : (
              // Default dynamic liquid animation thumbnail
              <div className="absolute inset-0 flex items-center justify-center p-1 uppercase font-bold text-[9px] text-cyan-300">
                <div className="absolute inset-1.5 rounded-full border border-dashed border-cyan-400/30 animate-[spin_6s_linear_infinite]" />
                <span className="text-[14px]">💧</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col text-left">
            <span className="text-[13px] font-bold text-white truncate drop-shadow-xs">
              {currentSong ? currentSong.title : "Water Melodies"}
            </span>
            <span className="text-[10px] text-white/50 truncate font-mono tracking-wide mt-0.5">
              {currentSong ? currentSong.artist : "Select Track to Start"}
            </span>
          </div>
        </div>

        {/* Center: Play/Pause/Skip buttons */}
        <div className="flex items-center gap-3 sm:gap-4 justify-center" id="play-navigation-group">
          {/* Shuffle Toggle */}
          <button
            type="button"
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-lg transition-all hover:bg-white/5 active:scale-90 cursor-pointer ${
              isShuffle ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] bg-cyan-400/5" : "text-white/40 hover:text-white"
            }`}
            title="Shuffle toggle (S)"
            id="control-shuffle-btn"
          >
            <Shuffle size={14} />
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={onPrevious}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 active:scale-90 cursor-pointer"
            title="Previous (Left Arrow)"
            id="control-prev-btn"
          >
            <SkipBack size={16} fill="currentColor" />
          </button>

          {/* Large Liquid Orb Play/Pause Button */}
          <button
            type="button"
            onClick={onPlayPause}
            className="h-12 w-12 rounded-full flex items-center justify-center bg-white text-slate-950 font-bold hover:scale-105 hover:shadow-[0_0_20px_white] cursor-pointer active:scale-95 transition-all outline-hidden shrink-0 shadow-lg"
            title="Play / Pause (Space)"
            id="control-play-pause-btn"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" strokeWidth={1} />
            ) : (
              <Play size={18} className="translate-x-0.5" fill="currentColor" strokeWidth={1} />
            )}
          </button>

          {/* Next Track */}
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 active:scale-90 cursor-pointer"
            title="Next (Right Arrow)"
            id="control-next-btn"
          >
            <SkipForward size={16} fill="currentColor" />
          </button>

          {/* Repeat Toggle */}
          <button
            type="button"
            onClick={onToggleRepeat}
            className={`p-1.5 rounded-lg transition-all hover:bg-white/5 active:scale-90 cursor-pointer ${
              isRepeat ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] bg-cyan-400/5" : "text-white/40 hover:text-white"
            }`}
            title="Repeat toggle (R)"
            id="control-repeat-btn"
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Right side: Volume and Utility Drawer Activators */}
        <div className="flex items-center gap-2 w-[180px] sm:w-[220px] justify-end" id="utilities-group">
          {/* Interactive Volume bar container */}
          <div className="hidden sm:flex items-center gap-1.5 group/vol" id="volume-fader-block">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1 rounded-lg text-white/45 hover:text-white transition-colors cursor-pointer"
              title="Mute / Unmute (M)"
              id="volume-mute-toggle-btn"
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-hidden group-hover/vol:w-20 transition-all duration-300"
              title="Fader volume deck"
              id="volume-fader-input"
            />
          </div>

          <div className="flex items-center gap-1 font-sans border-l border-white/10 pl-2">
            {/* Playlist Queue Activator */}
            <button
              type="button"
              onClick={onToggleQueue}
              className="p-1 px-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-cyan-400 transition-colors flex items-center gap-1 scale-[0.9] cursor-pointer"
              title="Toggle queue drawer"
              id="toolbar-queue-trigger"
            >
              <ListMusic size={15} />
            </button>

            {/* Help / Shortcuts modal toggler */}
            <button
              type="button"
              onClick={onToggleShortcuts}
              className="p-1 px-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-cyan-400 transition-colors flex items-center gap-1 scale-[0.9] cursor-pointer"
              title="Keyboard Shortcuts (H)"
              id="toolbar-shortcuts-trigger"
            >
              <HelpCircle size={15} />
            </button>

            {/* Server Settings Activator */}
            <button
              type="button"
              onClick={onToggleSettings}
              className="p-1 px-[7px] rounded-lg hover:bg-white/5 text-white/40 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Server & Background settings"
              id="toolbar-settings-trigger"
            >
              <Settings size={15} className="group-hover:rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
