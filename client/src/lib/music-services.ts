// Music platform integration services
import type { AudioTrack } from '@shared/schema';

export interface ExternalTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  previewUrl?: string;
  streamUrl?: string;
  albumArt?: string;
  platform: 'spotify' | 'youtube' | 'apple';
}

export interface SearchResult {
  tracks: ExternalTrack[];
  nextPageToken?: string;
}

// Spotify Web API service
export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Get access token via secure backend proxy
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('/api/music/spotify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken || '';
    } catch (error) {
      console.error('Spotify auth error:', error);
      throw error;
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<SearchResult> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Spotify search failed');
      }

      const data = await response.json();
      const tracks: ExternalTrack[] = data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        duration: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        albumArt: track.album.images[0]?.url,
        platform: 'spotify' as const
      }));

      return { tracks };
    } catch (error) {
      console.error('Spotify search error:', error);
      return { tracks: [] };
    }
  }

  async getTrack(id: string): Promise<ExternalTrack | null> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return null;

      const track = await response.json();
      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        duration: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        albumArt: track.album.images[0]?.url,
        platform: 'spotify'
      };
    } catch (error) {
      console.error('Spotify track fetch error:', error);
      return null;
    }
  }
}

// YouTube API service
export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchTracks(query: string, limit: number = 20): Promise<SearchResult> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${limit}&q=${encodeURIComponent(query + ' music')}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('YouTube search failed');
      }

      const data = await response.json();
      const tracks: ExternalTrack[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        duration: 0, // YouTube API doesn't provide duration in search
        albumArt: item.snippet.thumbnails.medium?.url,
        streamUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        platform: 'youtube' as const
      }));

      return { 
        tracks,
        nextPageToken: data.nextPageToken 
      };
    } catch (error) {
      console.error('YouTube search error:', error);
      return { tracks: [] };
    }
  }

  async getTrack(id: string): Promise<ExternalTrack | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${id}&key=${this.apiKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.items.length) return null;

      const video = data.items[0];
      const duration = this.parseDuration(video.contentDetails.duration);

      return {
        id: video.id,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        duration,
        albumArt: video.snippet.thumbnails.medium?.url,
        streamUrl: `https://www.youtube.com/watch?v=${video.id}`,
        platform: 'youtube'
      };
    } catch (error) {
      console.error('YouTube track fetch error:', error);
      return null;
    }
  }

  private parseDuration(duration: string): number {
    // Parse YouTube duration format (PT4M20S) to seconds
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}

// Apple Music service (placeholder - requires MusicKit.js)
export class AppleMusicService {
  async searchTracks(query: string, limit: number = 20): Promise<SearchResult> {
    // Apple Music integration requires MusicKit.js and proper setup
    // For now, return empty results
    console.warn('Apple Music integration not yet implemented');
    return { tracks: [] };
  }

  async getTrack(id: string): Promise<ExternalTrack | null> {
    console.warn('Apple Music integration not yet implemented');
    return null;
  }
}

// Music service manager
export class MusicServiceManager {
  private spotify = new SpotifyService();
  private youtube = new YouTubeService();
  private appleMusic = new AppleMusicService();

  async searchAllPlatforms(query: string, limit: number = 20): Promise<ExternalTrack[]> {
    const results = await Promise.allSettled([
      this.spotify.searchTracks(query, Math.ceil(limit / 2)),
      this.youtube.searchTracks(query, Math.ceil(limit / 2))
    ]);

    const tracks: ExternalTrack[] = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        tracks.push(...result.value.tracks);
      }
    });

    return tracks.slice(0, limit);
  }

  async getTrackById(platform: string, id: string): Promise<ExternalTrack | null> {
    switch (platform) {
      case 'spotify':
        return this.spotify.getTrack(id);
      case 'youtube':
        return this.youtube.getTrack(id);
      case 'apple':
        return this.appleMusic.getTrack(id);
      default:
        return null;
    }
  }

  // Convert ExternalTrack to AudioTrack format
  convertToAudioTrack(externalTrack: ExternalTrack): AudioTrack {
    return {
      id: parseInt(externalTrack.id.replace(/\D/g, '') || '0'),
      title: externalTrack.title,
      artist: externalTrack.artist,
      filename: `${externalTrack.platform}_${externalTrack.id}`,
      fileUrl: externalTrack.previewUrl || externalTrack.streamUrl || '',
      duration: externalTrack.duration,
      fileSize: null,
      mimeType: 'audio/mpeg',
      uploadedBy: null,
      isPublic: true,
      uploadedAt: new Date()
    };
  }
}

export const musicService = new MusicServiceManager();