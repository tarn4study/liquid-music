import { useState, useEffect, useRef } from "react";
import { Song, PlayerState } from "../types";
import { SAMPLE_WATER_LOFI } from "../constants";

/**
 * Custom hook managing the audio element, playback state, playlist queue,
 * Web Audio API analyser, and keyboard hotkeys.
 */
export function useAudioPlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: SAMPLE_WATER_LOFI[0],
    isPlaying: false,
    volume: 0.5,
    progress: 0,
    playlist: SAMPLE_WATER_LOFI,
    currentIndex: 0,
    isShuffle: false,
    isRepeat: false,
    isMuted: false,
    tempoSpeed: 1,
  });

  const [zenMode, setZenMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const onPlaylistEndedRef = useRef<(() => void) | null>(null);

  // Initialize Web Audio Context and Analyser Node safely on user interaction
  const initializeWebAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      if (audioRef.current) {
        audioRef.current.crossOrigin = "anonymous";
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
        setAudioAnalyser(analyser);
      }
    } catch (e) {
      console.warn("Unable to trigger Audio Context analyser:", e);
    }
  };

  // Synchronize elapsed play duration and track ending transition triggers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayerState((prev) => ({ ...prev, progress: audio.currentTime }));
    };

    const handleEnded = () => {
      handleNextSong();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [
    playerState.currentIndex,
    playerState.playlist,
    playerState.isRepeat,
    playerState.isShuffle,
  ]);

  // Adjust native audio node volume reflecting local states
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = playerState.isMuted ? 0 : playerState.volume;
    }
  }, [playerState.volume, playerState.isMuted]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    initializeWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    if (playerState.isPlaying) {
      audio.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch((err) => console.error("Playback interrupted:", err));
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  const triggerSongAtIndex = (index: number) => {
    const { playlist } = playerState;
    if (index < 0 || index >= playlist.length) return;

    const targetSong = playlist[index];
    setPlayerState((prev) => ({
      ...prev,
      currentIndex: index,
      currentSong: targetSong,
      progress: 0,
    }));

    setTimeout(() => {
      const audio = audioRef.current;
      if (audio) {
        if (targetSong.url) {
          audio.src = targetSong.url;
        }
        audio.load();
        initializeWebAudio();
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        audio.play()
          .then(() => {
            setPlayerState((prev) => ({ ...prev, isPlaying: true }));
          })
          .catch((err) => {
            console.warn("Autoplay paused stream:", err);
            setPlayerState((prev) => ({ ...prev, isPlaying: false }));
          });
      }
    }, 50);
  };

  const handleNextSong = () => {
    const { playlist, currentIndex, isShuffle, isRepeat } = playerState;
    if (playlist.length === 0) return;

    if (isRepeat) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    // Check if the playlist has finished (only in sequential mode)
    if (!isShuffle && currentIndex === playlist.length - 1) {
      if (onPlaylistEndedRef.current) {
        onPlaylistEndedRef.current();
        return;
      }
    }

    let nextIndex = currentIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    triggerSongAtIndex(nextIndex);
  };

  const handlePreviousSong = () => {
    const { playlist, currentIndex, isShuffle } = playerState;
    if (playlist.length === 0) return;

    let prevIndex = currentIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    }

    triggerSongAtIndex(prevIndex);
  };

  const handleSeek = (newProgress: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newProgress;
      setPlayerState((prev) => ({ ...prev, progress: newProgress }));
    }
  };

  const handleAppendAndPlay = (song: Song) => {
    setPlayerState((prev) => {
      const existingIdx = prev.playlist.findIndex((s) => s.id === song.id);
      let newPlaylist = [...prev.playlist];
      let newIdx = 0;

      if (existingIdx !== -1) {
        newIdx = existingIdx;
      } else {
        newPlaylist.push(song);
        newIdx = newPlaylist.length - 1;
      }

      setTimeout(() => triggerSongAtIndex(newIdx), 50);
      return {
        ...prev,
        playlist: newPlaylist,
      };
    });
  };

  const handleRemoveSong = (idx: number) => {
    setPlayerState((prev) => {
      const newPlaylist = prev.playlist.filter((_, i) => i !== idx);
      let nextIndex = prev.currentIndex;

      if (newPlaylist.length === 0) {
        return {
          ...prev,
          playlist: [],
          currentIndex: -1,
          currentSong: null,
          isPlaying: false,
          progress: 0,
          volume: prev.volume,
          isShuffle: prev.isShuffle,
          isRepeat: prev.isRepeat,
          isMuted: prev.isMuted,
          tempoSpeed: prev.tempoSpeed,
        };
      }

      if (prev.currentIndex === idx) {
        nextIndex = Math.min(idx, newPlaylist.length - 1);
        setTimeout(() => triggerSongAtIndex(nextIndex), 50);
      } else if (prev.currentIndex > idx) {
        nextIndex = prev.currentIndex - 1;
      }

      return {
        ...prev,
        playlist: newPlaylist,
        currentIndex: nextIndex,
      };
    });
  };

  const handleClearPlaylist = () => {
    setPlayerState((prev) => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      return {
        ...prev,
        playlist: [],
        currentIndex: -1,
        currentSong: null,
        isPlaying: false,
        progress: 0,
      };
    });
  };

  // Keyboard hotkey listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeNode = document.activeElement;
      if (
        activeNode && (
          activeNode.tagName === "INPUT" ||
          activeNode.tagName === "TEXTAREA" ||
          activeNode.getAttribute("contenteditable") === "true"
        )
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, playerState.progress - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(playerState.currentSong?.duration || 0, playerState.progress + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          setPlayerState((prev) => ({ ...prev, volume: Math.min(1, prev.volume + 0.05) }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPlayerState((prev) => ({ ...prev, volume: Math.max(0, prev.volume - 0.05) }));
          break;
        case "KeyM":
          setPlayerState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
          break;
        case "KeyS":
          setPlayerState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
          break;
        case "KeyR":
          setPlayerState((prev) => ({ ...prev, isRepeat: !prev.isRepeat }));
          break;
        case "KeyH":
          setZenMode((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerState]);

  const setPlaylist = (playlist: Song[]) => {
    setPlayerState((prev) => ({ ...prev, playlist }));
  };

  const setCurrentSong = (currentSong: Song | null) => {
    setPlayerState((prev) => ({ ...prev, currentSong }));
  };

  const setCurrentIndex = (currentIndex: number) => {
    setPlayerState((prev) => ({ ...prev, currentIndex }));
  };

  const replaceQueue = (newPlaylist: Song[], autoPlay = false) => {
    const firstSong = newPlaylist[0] || null;
    setPlayerState((prev) => ({
      ...prev,
      playlist: newPlaylist,
      currentSong: firstSong,
      currentIndex: 0,
      progress: 0,
    }));

    if (autoPlay && firstSong && firstSong.url) {
      setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.src = firstSong.url;
          audio.load();
          initializeWebAudio();
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
          }

          audio.play()
            .then(() => {
              setPlayerState((prev) => ({ ...prev, isPlaying: true }));
            })
            .catch((err) => {
              console.warn("Autoplay paused stream:", err);
              setPlayerState((prev) => ({ ...prev, isPlaying: false }));
            });
        }
      }, 50);
    }
  };

  const setVolume = (volume: number) => {
    setPlayerState((prev) => ({ ...prev, volume }));
  };

  const setIsMuted = (isMuted: boolean) => {
    setPlayerState((prev) => ({ ...prev, isMuted }));
  };

  const setIsShuffle = (isShuffle: boolean) => {
    setPlayerState((prev) => ({ ...prev, isShuffle }));
  };

  const setIsRepeat = (isRepeat: boolean) => {
    setPlayerState((prev) => ({ ...prev, isRepeat }));
  };

  const calculateDropletTempo = () => {
    const duration = playerState.currentSong?.duration || 200;
    if (playerState.currentSong?.genre?.toLowerCase().includes("synth") || duration < 240) {
      return 1.4;
    }
    return 0.8;
  };

  const setOnPlaylistEnded = (fn: () => void) => {
    onPlaylistEndedRef.current = fn;
  };

  return {
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
    setPlaylist,
    setCurrentSong,
    setCurrentIndex,
    replaceQueue,
    setVolume,
    setIsMuted,
    setIsShuffle,
    setIsRepeat,
    calculateDropletTempo,
    setOnPlaylistEnded,
  };
}
