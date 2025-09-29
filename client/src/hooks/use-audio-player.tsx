import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import type { AudioTrack } from '@shared/schema';

interface AudioPlayerState {
  // Playback state
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // UI state
  isPopupOpen: boolean;
  isMinimized: boolean;
  popupPosition: { x: number; y: number };
  
  // Playlist state
  playlist: AudioTrack[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}

interface AudioPlayerActions {
  // Playback controls
  play: (track?: AudioTrack) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Track navigation
  nextTrack: () => void;
  previousTrack: () => void;
  playTrackAt: (index: number) => void;
  
  // Playlist management
  setPlaylist: (tracks: AudioTrack[]) => void;
  addToPlaylist: (track: AudioTrack) => void;
  removeFromPlaylist: (trackId: number) => void;
  
  // UI controls
  togglePopup: () => void;
  minimizePopup: () => void;
  maximizePopup: () => void;
  setPopupPosition: (position: { x: number; y: number }) => void;
  
  // Settings
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

type AudioPlayerContext = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContext | null>(null);

const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  
  isPopupOpen: false,
  isMinimized: false,
  popupPosition: { x: window.innerWidth - 420, y: 100 },
  
  playlist: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 'none',
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
  const [state, setState] = useState<AudioPlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  
  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioPlayer:volume');
    const savedShuffle = localStorage.getItem('audioPlayer:shuffle');
    const savedRepeat = localStorage.getItem('audioPlayer:repeat');
    const savedPosition = localStorage.getItem('audioPlayer:popupPosition');
    
    setState(prev => ({
      ...prev,
      volume: savedVolume ? parseFloat(savedVolume) : 0.7,
      shuffle: savedShuffle === 'true',
      repeat: (savedRepeat as 'none' | 'one' | 'all') || 'none',
      popupPosition: savedPosition ? JSON.parse(savedPosition) : prev.popupPosition,
    }));
  }, []);
  
  // Update audio element when volume changes
  useEffect(() => {
    audioRef.current.volume = state.volume;
    localStorage.setItem('audioPlayer:volume', state.volume.toString());
  }, [state.volume]);
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('audioPlayer:shuffle', state.shuffle.toString());
  }, [state.shuffle]);
  
  useEffect(() => {
    localStorage.setItem('audioPlayer:repeat', state.repeat);
  }, [state.repeat]);
  
  useEffect(() => {
    localStorage.setItem('audioPlayer:popupPosition', JSON.stringify(state.popupPosition));
  }, [state.popupPosition]);
  
  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };
    
    const handleDurationChange = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration || 0,
      }));
    };
    
    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
      }));
      
      // Handle repeat and next track
      if (state.repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      } else {
        nextTrack();
      }
    };
    
    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration || 0,
      }));
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [state.repeat]);
  
  // Playback controls
  const play = async (track?: AudioTrack) => {
    if (track && track !== state.currentTrack) {
      // Load new track
      audioRef.current.src = track.fileUrl;
      audioRef.current.load();
      setState(prev => ({
        ...prev,
        currentTrack: track,
        currentIndex: prev.playlist.findIndex(t => t.id === track.id),
      }));
    }
    
    try {
      await audioRef.current.play();
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };
  
  const pause = () => {
    audioRef.current.pause();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));
  };
  
  const stop = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));
  };
  
  const seek = (time: number) => {
    audioRef.current.currentTime = time;
    setState(prev => ({
      ...prev,
      currentTime: time,
    }));
  };
  
  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({
      ...prev,
      volume: clampedVolume,
    }));
  };
  
  // Track navigation
  const getNextIndex = () => {
    if (state.playlist.length === 0) return -1;
    
    if (state.shuffle) {
      // Random index that's different from current
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * state.playlist.length);
      } while (nextIndex === state.currentIndex && state.playlist.length > 1);
      return nextIndex;
    } else {
      // Sequential next
      return (state.currentIndex + 1) % state.playlist.length;
    }
  };
  
  const getPreviousIndex = () => {
    if (state.playlist.length === 0) return -1;
    
    if (state.shuffle) {
      // For previous in shuffle, just go to random track
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * state.playlist.length);
      } while (prevIndex === state.currentIndex && state.playlist.length > 1);
      return prevIndex;
    } else {
      // Sequential previous
      return state.currentIndex <= 0 
        ? state.playlist.length - 1 
        : state.currentIndex - 1;
    }
  };
  
  const nextTrack = () => {
    if (state.playlist.length === 0) return;
    
    if (state.repeat === 'all' || state.currentIndex < state.playlist.length - 1 || state.shuffle) {
      const nextIndex = getNextIndex();
      if (nextIndex >= 0 && nextIndex < state.playlist.length) {
        const nextTrack = state.playlist[nextIndex];
        setState(prev => ({ ...prev, currentIndex: nextIndex }));
        play(nextTrack);
      }
    } else {
      // End of playlist and not repeating
      stop();
    }
  };
  
  const previousTrack = () => {
    if (state.playlist.length === 0) return;
    
    const prevIndex = getPreviousIndex();
    if (prevIndex >= 0 && prevIndex < state.playlist.length) {
      const prevTrack = state.playlist[prevIndex];
      setState(prev => ({ ...prev, currentIndex: prevIndex }));
      play(prevTrack);
    }
  };
  
  const playTrackAt = (index: number) => {
    if (index >= 0 && index < state.playlist.length) {
      const track = state.playlist[index];
      setState(prev => ({ ...prev, currentIndex: index }));
      play(track);
    }
  };
  
  // Playlist management
  const setPlaylist = (tracks: AudioTrack[]) => {
    setState(prev => ({
      ...prev,
      playlist: tracks,
      currentIndex: tracks.length > 0 ? 0 : -1,
    }));
  };
  
  const addToPlaylist = (track: AudioTrack) => {
    setState(prev => ({
      ...prev,
      playlist: [...prev.playlist, track],
    }));
  };
  
  const removeFromPlaylist = (trackId: number) => {
    setState(prev => {
      const newPlaylist = prev.playlist.filter(t => t.id !== trackId);
      const currentTrack = prev.currentTrack;
      let newCurrentIndex = prev.currentIndex;
      
      // Adjust current index if necessary
      if (currentTrack && currentTrack.id === trackId) {
        // Current track was removed
        newCurrentIndex = -1;
        stop();
      } else if (prev.currentIndex >= 0) {
        // Find new index of current track
        newCurrentIndex = newPlaylist.findIndex(t => t.id === currentTrack?.id);
      }
      
      return {
        ...prev,
        playlist: newPlaylist,
        currentIndex: newCurrentIndex,
      };
    });
  };
  
  // UI controls
  const togglePopup = () => {
    setState(prev => ({
      ...prev,
      isPopupOpen: !prev.isPopupOpen,
      isMinimized: false,
    }));
  };
  
  const minimizePopup = () => {
    setState(prev => ({
      ...prev,
      isMinimized: true,
    }));
  };
  
  const maximizePopup = () => {
    setState(prev => ({
      ...prev,
      isMinimized: false,
    }));
  };
  
  const setPopupPosition = (position: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      popupPosition: position,
    }));
  };
  
  // Settings
  const toggleShuffle = () => {
    setState(prev => ({
      ...prev,
      shuffle: !prev.shuffle,
    }));
  };
  
  const toggleRepeat = () => {
    setState(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'all' : prev.repeat === 'all' ? 'one' : 'none',
    }));
  };
  
  const contextValue: AudioPlayerContext = {
    ...state,
    play,
    pause,
    stop,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
    playTrackAt,
    setPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    togglePopup,
    minimizePopup,
    maximizePopup,
    setPopupPosition,
    toggleShuffle,
    toggleRepeat,
  };
  
  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}