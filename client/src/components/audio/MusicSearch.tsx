import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Play, Plus, Loader2 } from 'lucide-react';
import { musicService } from '@/lib/music-services';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useToast } from '@/hooks/use-toast';
import type { ExternalTrack } from '@/lib/music-services';

export function MusicSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { play, addToPlaylist, setPlaylist } = useAudioPlayer();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const tracks = await musicService.searchAllPlatforms(query, 20);
      setResults(tracks);
      
      if (tracks.length === 0) {
        toast({
          title: "No Results",
          description: "No tracks found. Try a different search term.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search Error", 
        description: "Failed to search music platforms. Please try again.",
        variant: "destructive"
      });
      console.error('Music search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const playTrack = (externalTrack: ExternalTrack) => {
    const audioTrack = musicService.convertToAudioTrack(externalTrack);
    setPlaylist([audioTrack]);
    play(audioTrack);
    
    toast({
      title: "Now Playing",
      description: `${externalTrack.title} - ${externalTrack.artist}`,
    });
  };

  const addToCurrentPlaylist = (externalTrack: ExternalTrack) => {
    const audioTrack = musicService.convertToAudioTrack(externalTrack);
    addToPlaylist(audioTrack);
    
    toast({
      title: "Added to Playlist",
      description: `${externalTrack.title} added to current playlist`,
    });
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'spotify':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Spotify
          </span>
        );
      case 'youtube':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            YouTube
          </span>
        );
      case 'apple':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Apple Music
          </span>
        );
      default:
        return null;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Search songs, artists, albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
          data-testid="input-music-search"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          data-testid="button-search-music"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Found {results.length} tracks
          </h3>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {results.map((track, index) => (
              <Card key={`${track.platform}-${track.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Album Art */}
                    {track.albumArt ? (
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        🎵
                      </div>
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate" title={track.title}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-600 truncate" title={track.artist}>
                        {track.artist}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPlatformBadge(track.platform)}
                        <span className="text-xs text-gray-500">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => playTrack(track)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-play-${track.platform}-${track.id}`}
                        title="Play now"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCurrentPlaylist(track)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-add-${track.platform}-${track.id}`}
                        title="Add to playlist"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Search for music across Spotify and YouTube</p>
          <p className="text-sm mt-1">Enter a song name, artist, or album</p>
        </div>
      )}
    </div>
  );
}