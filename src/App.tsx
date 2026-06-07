import React, { useState, useEffect } from "react";
import { Song, NavidromeConfig } from "./types";
import { SAMPLE_WATER_LOFI, DEFAULT_THEME_GRADIENT } from "./constants";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useNavidrome } from "./hooks/useNavidrome";

import { WaterVisualizer } from "./components/WaterVisualizer";
import { DraggableTimeWidget } from "./components/DraggableTimeWidget";
import { SettingsModal } from "./components/SettingsModal";
import { QueueDrawer } from "./components/QueueDrawer";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { Controller } from "./components/Controller";
import { LibraryPanel } from "./components/LibraryPanel";
import { SearchPanel } from "./components/SearchPanel";
import { CenterImmersiveDisplay } from "./components/CenterImmersiveDisplay";

export default function App() {
  // Interface view triggers
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Background selected cover overlay
  const [activeBgUrl, setActiveBgUrl] = useState<string | null>(() => {
    return localStorage.getItem("active_bg_url");
  });

  const changeBgUrl = (url: string | null) => {
    setActiveBgUrl(url);
    if (url) {
      localStorage.setItem("active_bg_url", url);
    } else {
      localStorage.removeItem("active_bg_url");
    }
  };

  // Liquid thematic active preset gradient state
  const [themeGradient, setThemeGradient] = useState<string>(() => {
    return localStorage.getItem("theme_gradient") || DEFAULT_THEME_GRADIENT;
  });

  // Custom hooks encapsulating features
  const {
    playerState,
    audioRef,
    audioAnalyser,
    zenMode,
    setZenMode,
    handlePlayPause,
    handleNextSong,
    handlePreviousSong,
    triggerSongAtIndex,
    handleSeek,
    handleAppendAndPlay,
    handleRemoveSong,
    handleClearPlaylist,
    replaceQueue,
    setVolume,
    setIsMuted,
    setIsShuffle,
    setIsRepeat,
    calculateDropletTempo,
    setOnPlaylistEnded,
  } = useAudioPlayer();

  const {
    config,
    serverConnected,
    catalogSongs,
    searchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    isLoadingCatalog,
    loadNavidromeRandomLibrary,
    handleSearchCommit,
    saveConfigToServer,
    pingDiagnosticTest,
  } = useNavidrome(
    // Callback: Sync loaded Navidrome library queue to player state
    (songs) => replaceQueue(songs),
    // Callback: Hydrate queue with local sample media in Demo Mode
    () => replaceQueue(SAMPLE_WATER_LOFI)
  );

  // Auto-fetch and play a fresh set of songs when the current queue completes
  useEffect(() => {
    setOnPlaylistEnded(() => {
      if (config.isConfigured && serverConnected) {
        loadNavidromeRandomLibrary(true);
      } else {
        triggerSongAtIndex(0);
      }
    });
  }, [config.isConfigured, serverConnected, loadNavidromeRandomLibrary, triggerSongAtIndex, setOnPlaylistEnded]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0a0c10] flex flex-col font-sans select-none"
      id="water-player-root"
    >
      {/* 1. Underlying Audio Source Element */}
      <audio
        ref={audioRef}
        src={playerState.currentSong?.url || undefined}
        preload="auto"
        id="native-audio-player-element"
      />

      {/* 2. Audio-Reactive Water Particle Canvas backdrop */}
      <WaterVisualizer
        isPlaying={playerState.isPlaying}
        audioAnalyser={audioAnalyser}
        tempoSpeed={calculateDropletTempo()}
        themeGradient={themeGradient}
        bgImageUrl={activeBgUrl}
      />

      {/* 3. Immersive Center Visualizer Background Rings & Track Details */}
      <CenterImmersiveDisplay
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        zenMode={zenMode}
      />

      {/* 4. Floating Free Draggable Time & Now Playing Orb */}
      <DraggableTimeWidget
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
      />

      {/* 5. Overlay Heads-Up Displays (HUD) - Hidden when ZenMode is activated */}
      {!zenMode ? (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none flex flex-col z-[10]"
          id="hud-master-frame"
        >
          {/* Top Panel row */}
          <div
            className="w-full flex items-center justify-between p-5 pointer-events-auto shrink-0 pb-0 z-20"
            id="hud-top-shelf"
          >
            <div className="flex flex-col gap-1 items-start text-left">
              <span className="text-white/40 text-[10px] tracking-[0.22em] uppercase font-bold font-display select-none">
                Now Streaming
              </span>
              <div className="flex items-center gap-2 select-none">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !config.isConfigured
                      ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                      : serverConnected === null
                      ? "bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]"
                      : serverConnected
                      ? "bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"
                      : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  }`}
                />
                <span className="text-white/80 text-xs font-medium font-sans">
                  {!config.isConfigured
                    ? "Local Server: Demo Mode"
                    : serverConnected === null
                    ? "Connecting to Local Server..."
                    : serverConnected
                    ? `Local Server: ${config.username}@Navidrome`
                    : "Local Server: Offline"}
                </span>
              </div>
            </div>

            {/* Nav Tabs styled pill box representing active player focus */}
            <div className="flex gap-6 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg items-center">
              <button
                type="button"
                onClick={() => setZenMode(false)}
                className={`text-[11px] font-semibold tracking-widest transition-colors cursor-pointer ${
                  !zenMode ? "text-white" : "text-white/40 hover:text-white"
                }`}
              >
                LIBRARY
              </button>
              <button
                type="button"
                onClick={() => {
                  setZenMode(false);
                  setIsQueueOpen(true);
                }}
                className="text-white/40 hover:text-white text-[11px] font-semibold tracking-widest transition-colors cursor-pointer"
              >
                PLAYLISTS
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-white/40 hover:text-white text-[11px] font-semibold tracking-widest transition-colors cursor-pointer"
              >
                SERVER
              </button>
            </div>
          </div>

          {/* Central Main Panel: Catalog drawer list */}
          <div
            className="flex-1 w-full max-w-[1020px] mx-auto p-5 pb-28 md:pb-32 overflow-y-auto pointer-events-auto flex flex-col md:flex-row gap-5 items-stretch mt-4"
            id="hud-hud-panels-grid"
          >
            {/* Play catalog dashboard (Left card) */}
            <LibraryPanel
              isConfigured={config.isConfigured}
              serverConnected={serverConnected}
              isLoadingCatalog={isLoadingCatalog}
              catalogSongs={catalogSongs}
              demoSongs={SAMPLE_WATER_LOFI}
              currentSongId={playerState.currentSong?.id}
              onSyncRefresh={loadNavidromeRandomLibrary}
              onTrackClick={handleAppendAndPlay}
            />

            {/* Dynamic Search & Server Meta (Right Card) */}
            {config.isConfigured && (
              <SearchPanel
                isSearching={isSearching}
                searchResults={searchResults}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearchSubmit={handleSearchCommit}
                onTrackClick={handleAppendAndPlay}
              />
            )}
          </div>
        </div>
      ) : (
        // Mini indicator in Zen Mode to escape
        <button
          type="button"
          onClick={() => setZenMode(false)}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-[30] px-4 py-1.5 rounded-full border border-cyan-400/20 bg-slate-950/20 text-cyan-300 text-[10px] font-bold font-sans animate-pulse hover:bg-cyan-500/10 cursor-pointer pointer-events-auto"
          id="escape-zen-btn"
        >
          Zen Mode Active • Press H or click here to escape
        </button>
      )}

      {/* 6. Music Controller floating capsule */}
      <div className="pointer-events-none w-full" id="controller-deck-frame">
        <div className="pointer-events-auto" id="controller-deck-wrapper">
          <Controller
            playerState={playerState}
            onPlayPause={handlePlayPause}
            onNext={handleNextSong}
            onPrevious={handlePreviousSong}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onToggleMute={() => setIsMuted(!playerState.isMuted)}
            onToggleShuffle={() => setIsShuffle(!playerState.isShuffle)}
            onToggleRepeat={() => setIsRepeat(!playerState.isRepeat)}
            onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
            onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
            onToggleShortcuts={() => setIsShortcutsOpen((prev) => !prev)}
          />
        </div>
      </div>

      {/* 7. Active Play Queue Slide-Out Drawer overlay */}
      {isQueueOpen && (
        <QueueDrawer
          onClose={() => setIsQueueOpen(false)}
          playlist={playerState.playlist}
          currentIndex={playerState.currentIndex}
          isPlaying={playerState.isPlaying}
          onPlaySongAtIndex={triggerSongAtIndex}
          onRemoveSongAtIndex={handleRemoveSong}
          onClearPlaylist={handleClearPlaylist}
        />
      )}

      {/* 8. Settings Drawer Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSaveConfig={saveConfigToServer}
          onTestConnection={pingDiagnosticTest}
          onSelectBackground={changeBgUrl}
          currentBgUrl={activeBgUrl}
          themeGradient={themeGradient}
          onSelectThemeGradient={(gradient) => {
            setThemeGradient(gradient);
            localStorage.setItem("theme_gradient", gradient);
          }}
        />
      )}

      {/* 9. Help / Keyboard Shortcuts list modal */}
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}
    </div>
  );
}
