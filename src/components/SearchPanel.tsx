import React from "react";
import { Search, Sparkles } from "lucide-react";
import { Song } from "../types";

interface SearchPanelProps {
  isSearching: boolean;
  searchResults: Song[];
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onTrackClick: (song: Song) => void;
}

export function SearchPanel({
  isSearching,
  searchResults,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onTrackClick,
}: SearchPanelProps) {
  return (
    <div
      className="w-full md:w-[320px] rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 p-6 flex flex-col gap-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500"
      id="utility-search-card"
    >
      {/* Search Form bar */}
      <form onSubmit={onSearchSubmit} className="relative shrink-0" id="search-navidrome-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search titles, artist..."
          className="w-full pl-8 pr-12 py-2 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder-white/35 focus:outline-hidden focus:border-cyan-400/50 focus:bg-black/60 font-sans shadow-inner transition-all duration-300"
          required
        />
        <Search size={12} className="absolute left-3 top-[12px] text-white/40" />
        <button
          type="submit"
          className="absolute right-2 top-2 px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] font-sans rounded-xl cursor-pointer hover:shadow-md transition-all active:scale-95"
          id="search-submit-btn"
        >
          OK
        </button>
      </form>

      {/* Search outcomes list */}
      <div className="flex-1 flex flex-col min-h-[140px]" id="search-outcomes-container">
        <span className="text-[10px] font-bold tracking-widest text-[#22d3ee]/80 uppercase pb-2 mb-2 border-b border-white/5 text-left font-sans flex items-center gap-1 shrink-0">
          <Sparkles
            size={11}
            className="animate-spin"
            style={{ animationDuration: "5s" }}
          />{" "}
          Search Results ({searchResults.length})
        </span>

        {isSearching ? (
          <div
            className="flex-1 flex justify-center items-center text-white/45 text-[11px] font-sans"
            id="search-spinner"
          >
            Refreshing databases...
          </div>
        ) : searchResults.length === 0 ? (
          <div
            className="flex-1 flex flex-col justify-center items-center text-center p-3 text-white/35 text-[11px] font-sans gap-1.5"
            id="search-empty"
          >
            <span>No active queries.</span>
            <span className="text-[10px] text-white/20 leading-relaxed max-w-[200px]">
              Type keywords and hit enter to stream specific tunes directly from Navidrome.
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5" id="search-results-list">
            {searchResults.map((song) => (
              <div
                key={`search-${song.id}`}
                onClick={() => onTrackClick(song)}
                className="group p-2 flex items-center gap-2 rounded-xl bg-black/25 border border-white/5 hover:border-white/12 cursor-pointer hover:bg-neutral-900/40 transition-all text-left"
                id={`search-card-${song.id}`}
              >
                <div className="h-7 w-7 rounded-lg overflow-hidden bg-cyan-950 border border-white/5 flex items-center justify-center shrink-0 text-[10px]">
                  💧
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className="text-[11px] font-extrabold text-white truncate">
                    {song.title}
                  </span>
                  <span className="text-[9px] text-white/40 truncate font-mono mt-0.5">
                    {song.artist}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
