import React, { useState, useEffect } from "react";
import { NavidromeConfig, Song } from "../types";

/**
 * Custom hook wrapping state and methods for connecting to and interacting
 * with the Navidrome Subsonic proxy service.
 */
export function useNavidrome(
  onSyncPlaylist: (songs: Song[], autoPlay?: boolean) => void,
  onLocalDemoHydration: () => void
) {
  const [config, setConfig] = useState<NavidromeConfig>({
    serverUrl: "",
    username: "",
    backgroundFolder: "./backgrounds",
    isConfigured: false,
  });

  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [catalogSongs, setCatalogSongs] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      setConfig(data);

      if (data.isConfigured) {
        checkServerStatus();
      } else {
        setServerConnected(false);
        onLocalDemoHydration();
      }
    } catch (e) {
      console.error("Failed to load server configurations:", e);
    }
  };

  const checkServerStatus = async () => {
    try {
      const statusResponse = await fetch("/api/navidrome/status");
      const statusData = await statusResponse.json();
      setServerConnected(statusData.connected);

      if (statusData.connected) {
        loadNavidromeRandomLibrary();
      }
    } catch (e) {
      setServerConnected(false);
    }
  };

  const loadNavidromeRandomLibrary = async (autoPlayAfterSync = false) => {
    setIsLoadingCatalog(true);
    try {
      const response = await fetch(
        "/api/navidrome/proxy?endpoint=getRandomSongs&size=28"
      );
      const data = await response.json();
      const subsonicSongs = data["subsonic-response"]?.randomSongs?.song || [];

      if (subsonicSongs.length > 0) {
        const formattedSongs: Song[] = subsonicSongs.map((s: any) => ({
          id: s.id,
          title: s.title || "Unknown track",
          artist: s.artist || "Unknown artist",
          album: s.album || "Unknown album",
          coverArt: s.coverArt,
          duration: s.duration || 180,
          url: `/api/navidrome/stream?id=${s.id}`,
          genre: s.genre,
        }));

        setCatalogSongs(formattedSongs);
        onSyncPlaylist(formattedSongs, autoPlayAfterSync);
      }
    } catch (err) {
      console.error("Error drawing server lists:", err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleSearchCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !config.isConfigured) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/navidrome/proxy?endpoint=search3&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      const subsonicResults = data["subsonic-response"]?.searchResult3?.song || [];

      const formattedResults: Song[] = subsonicResults.map((s: any) => ({
        id: s.id,
        title: s.title || "Untitled",
        artist: s.artist || "Unknown",
        album: s.album || "Unknown",
        coverArt: s.coverArt,
        duration: s.duration || 180,
        url: `/api/navidrome/stream?id=${s.id}`,
        genre: s.genre,
      }));

      setSearchResults(formattedResults);
    } catch (err) {
      console.error("Search query failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const saveConfigToServer = async (payload: Partial<NavidromeConfig>) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Save config error:", e);
      return false;
    }
  };

  const pingDiagnosticTest = async () => {
    try {
      const response = await fetch("/api/navidrome/status");
      const data = await response.json();
      return {
        connected: data.connected,
        version: data.version,
        error: data.error,
      };
    } catch (err: any) {
      return { connected: false, error: err.message };
    }
  };

  return {
    config,
    setConfig,
    serverConnected,
    setServerConnected,
    catalogSongs,
    setCatalogSongs,
    searchResults,
    setSearchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    isLoadingCatalog,
    fetchConfig,
    checkServerStatus,
    loadNavidromeRandomLibrary,
    handleSearchCommit,
    saveConfigToServer,
    pingDiagnosticTest,
  };
}
