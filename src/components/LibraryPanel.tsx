import React from "react";
import { Music, RotateCcw } from "lucide-react";
import { Song } from "../types";

interface LibraryPanelProps {
  isConfigured: boolean;
  serverConnected: boolean | null;
  isLoadingCatalog: boolean;
  catalogSongs: Song[];
  demoSongs: Song[];
  currentSongId?: string;
  onSyncRefresh: () => void;
  onTrackClick: (song: Song) => void;
}

export function LibraryPanel({
  isConfigured,
  serverConnected,
  isLoadingCatalog,
  catalogSongs,
  demoSongs,
  currentSongId,
  onSyncRefresh,
  onTrackClick,
}: LibraryPanelProps) {
  const songs = isConfigured ? catalogSongs : demoSongs;

  return (
    <div
      className="flex-1 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 p-6 flex flex-col gap-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] min-w-0 transition-all duration-500"
      id="library-catalog-card"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Music className="text-cyan-400" size={16} />
          <h1 className="text-sm font-extrabold tracking-wider uppercase font-sans">
            {isConfigured ? "Sync Library" : "Quick Start Demo Mode"}
          </h1>
        </div>

        {isConfigured && serverConnected && (
          <button
            type="button"
            onClick={onSyncRefresh}
            disabled={isLoadingCatalog}
            className="p-1 px-2.5 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 hover:text-white rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
            title="Draw another set of random tunes"
            id="refetch-library-btn"
          >
            <RotateCcw size={10} className={isLoadingCatalog ? "animate-spin" : ""} /> Sync Refresh
          </button>
        )}
      </div>

      {/* Loader */}
      {isLoadingCatalog ? (
        <div
          className="flex-1 flex flex-col justify-center items-center text-white/50 text-xs gap-3 font-sans"
          id="catalog-songs-loader"
        >
          <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Drawing music feeds from Navidrome...</span>
        </div>
      ) : (
        /* Track list map */
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5" id="catalog-item-list">
          {songs.map((song) => {
            const isPlayingCurrent = currentSongId === song.id;
            return (
              <div
                key={song.id}
                onClick={() => onTrackClick(song)}
                className={`group flex items-center justify-between gap-4 p-2.5 rounded-2xl border transition-all duration-300 hover:scale-[1.005] cursor-pointer ${
                  isPlayingCurrent
                    ? "bg-cyan-500/12 border-cyan-400/40 shadow-lg shadow-cyan-500/5 text-cyan-300"
                    : "bg-black/25 border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                }`}
                id={`catalog-track-card-${song.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-950 to-blue-950 flex items-center justify-center font-bold text-lg select-none border border-white/5 shrink-0">
                    {song.coverArt ? (
                      <img
                        src={`/api/navidrome/coverArt?id=${song.coverArt}&size=80`}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">💧</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col text-left">
                    <span className="text-xs font-extrabold truncate drop-shadow-xs">
                      {song.title}
                    </span>
                    <span className="text-[10px] text-white/40 truncate font-mono tracking-wide mt-0.5 group-hover:text-cyan-200/50 transition-colors">
                      {song.artist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-white/30 shrink-0">
                  {song.genre && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] uppercase font-sans font-bold">
                      {song.genre}
                    </span>
                  )}
                  <span className="group-hover:text-white/80 transition-colors">
                    {Math.floor(song.duration / 60)}:
                    {(song.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
