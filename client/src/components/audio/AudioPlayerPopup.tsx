import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Maximize2, 
  X,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  GripHorizontal
} from 'lucide-react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export function AudioPlayerPopup() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isPopupOpen,
    isMinimized,
    popupPosition,
    shuffle,
    repeat,
    playlist,
    currentIndex,
    play,
    pause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    togglePopup,
    minimizePopup,
    maximizePopup,
    setPopupPosition,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  
  const popupRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized || !dragHandleRef.current?.contains(e.target as Node)) return;
    
    const rect = popupRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const newX = e.clientX - dragState.offsetX;
    const newY = e.clientY - dragState.offsetY;

    // Keep popup within window bounds
    const maxX = window.innerWidth - (isMinimized ? 200 : 380);
    const maxY = window.innerHeight - (isMinimized ? 60 : 300);

    setPopupPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging]);

  // Handle volume mute/unmute
  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      play();
    }
  };

  // Handle progress seek
  const handleProgressChange = (values: number[]) => {
    const newTime = values[0];
    seek(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Get repeat icon based on state
  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return <Repeat1 className="h-4 w-4" />;
      case 'all':
        return <Repeat className="h-4 w-4" />;
      default:
        return <Repeat className="h-4 w-4" />;
    }
  };

  // Don't render anything if popup is closed
  if (!isPopupOpen) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={popupRef}
        className="fixed z-50 bg-white/80 backdrop-blur-md border border-white/20 rounded-lg shadow-xl cursor-move"
        style={{
          left: popupPosition.x,
          top: popupPosition.y,
          width: '200px',
          height: '60px',
        }}
        onMouseDown={handleMouseDown}
        data-testid="audio-player-minimized"
      >
        <div className="flex items-center justify-between h-full px-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Music className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <div className="text-xs truncate text-gray-700">
              {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : 'No track playing'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="h-6 w-6 p-0"
              data-testid="button-play-pause-mini"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={maximizePopup}
              className="h-6 w-6 p-0"
              data-testid="button-maximize"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full player view
  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white/90 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl"
      style={{
        left: popupPosition.x,
        top: popupPosition.y,
        width: '380px',
        minHeight: '280px',
      }}
      data-testid="audio-player-popup"
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        className="flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl"
        onMouseDown={handleMouseDown}
        data-testid="audio-player-drag-handle"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Audio Player</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={minimizePopup}
            className="h-6 w-6 p-0"
            data-testid="button-minimize"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePopup}
            className="h-6 w-6 p-0"
            data-testid="button-close-popup"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Player Content */}
      <div className="p-4 space-y-4">
        {/* Track Info */}
        {currentTrack ? (
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-gray-800 text-sm truncate" data-testid="text-track-title">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-gray-600 truncate" data-testid="text-track-artist">
              {currentTrack.artist}
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm" data-testid="text-no-track">
            No track selected
          </div>
        )}

        {/* Progress Bar */}
        {currentTrack && (
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleProgressChange}
              className="w-full"
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span data-testid="text-current-time">{formatTime(currentTime)}</span>
              <span data-testid="text-total-duration">{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShuffle}
            className={`h-8 w-8 p-0 ${shuffle ? 'text-purple-600 bg-purple-100' : 'text-gray-600'}`}
            data-testid="button-shuffle"
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={previousTrack}
            className="h-8 w-8 p-0"
            disabled={playlist.length === 0}
            data-testid="button-previous"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePlayPause}
            className="h-10 w-10 p-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={!currentTrack}
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextTrack}
            className="h-8 w-8 p-0"
            disabled={playlist.length === 0}
            data-testid="button-next"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRepeat}
            className={`h-8 w-8 p-0 ${repeat !== 'none' ? 'text-purple-600 bg-purple-100' : 'text-gray-600'}`}
            data-testid="button-repeat"
            title={`Repeat: ${repeat}`}
          >
            {getRepeatIcon()}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVolumeToggle}
            className="h-6 w-6 p-0"
            data-testid="button-volume-toggle"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
            data-testid="slider-volume"
          />
        </div>

        {/* Playlist Info */}
        {playlist.length > 0 && (
          <div className="text-center text-xs text-gray-500" data-testid="text-playlist-info">
            Track {currentIndex + 1} of {playlist.length}
          </div>
        )}
      </div>
    </div>
  );
}