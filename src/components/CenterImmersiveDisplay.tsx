import React from "react";
import { Song } from "../types";

interface CenterImmersiveDisplayProps {
  currentSong: Song | null;
  isPlaying: boolean;
  zenMode: boolean;
}

export function CenterImmersiveDisplay({
  currentSong,
  isPlaying,
  zenMode,
}: CenterImmersiveDisplayProps) {
  return (
    <div
      className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden animate-[fade-in_1.5s_ease-out_forwards]"
      id="immersive-center-rings-backdrop"
    >
      <div className="relative flex flex-col items-center justify-center scale-90 sm:scale-100 transition-all duration-700">
        {/* Dynamic "Water Drop" Visualizers */}
        <div className="absolute flex items-center justify-center pointer-events-none">
          <div
            className={`w-[450px] h-[450px] rounded-full border-2 border-white/5 flex items-center justify-center transition-all duration-1000 ${
              isPlaying ? "animate-[pulse_4s_infinite]" : ""
            }`}
          >
            <div className="w-[380px] h-[380px] rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full border-4 border-cyan-500/20 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm shadow-2xl relative">
                {/* Inner Light Gloss */}
                <div className="absolute top-4 left-1/4 w-1/2 h-2 bg-white/20 blur-sm rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Floating Reactive drops styling */}
          <div className="absolute -top-10 -right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"></div>
          <div className="absolute top-20 -left-12 w-8 h-8 rounded-full bg-cyan-400/20 backdrop-blur-xl border border-cyan-400/30 shadow-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl"></div>
        </div>

        {/* Center Track Info - Shown when ZenMode or when no active card view has contents */}
        {zenMode || !currentSong ? (
          <div className="relative flex flex-col items-center text-center px-6 max-w-xl transition-all duration-500 z-10">
            <span className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-bold mb-1 font-display">
              Now Streaming
            </span>
            <h1 className="text-4xl sm:text-6xl font-light text-white tracking-tight mb-2 font-display">
              {currentSong ? currentSong.title : "Moonlight Digital"}
            </h1>
            <p className="text-cyan-400 text-sm sm:text-md font-medium tracking-[0.2em] uppercase font-display">
              {currentSong ? currentSong.artist : "Syntax Error"}
            </p>
          </div>
        ) : (
          /* Subtle abstract track art outline inside the rings when normal library mode is active */
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex items-center justify-center bg-black/40 backdrop-blur-md">
            {currentSong?.coverArt ? (
              <img
                src={`/api/navidrome/coverArt?id=${currentSong.coverArt}&size=120`}
                alt=""
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover opacity-60 ${
                  isPlaying ? "animate-[spin_40s_linear_infinite]" : ""
                }`}
              />
            ) : (
              <span className="text-3xl animate-pulse">💧</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
