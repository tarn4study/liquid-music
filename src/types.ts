/**
 * Types and interfaces for the Glass & Water Navidrome Player
 */

export interface NavidromeConfig {
  serverUrl: string;
  username: string;
  password?: string; // Stored server-side, not exposed to browser once saved
  backgroundFolder: string;
  isConfigured: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverArt?: string; // Subsonic coverArt ID or path
  duration: number; // in seconds
  url?: string; // Stream URL (proxied through backend)
  track?: number;
  year?: number;
  genre?: string;
  fileSize?: number;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // current elapsed time in seconds
  playlist: Song[];
  currentIndex: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isMuted: boolean;
  tempoSpeed: number; // Speed multiplier for water droplets (reacts to audio or set manually)
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface BackgroundImage {
  name: string;
  path: string;
  url: string;
}
