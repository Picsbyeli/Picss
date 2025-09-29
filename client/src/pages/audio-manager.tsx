import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Upload, Trash2, Play, Pause, Cloud, User, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/hooks/use-firebase";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { MusicSearch } from "@/components/audio/MusicSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { musicService } from "@/lib/music-services";
import type { InsertAudioTrack } from "@shared/schema";

interface AudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
  uploadDate: string;
}

export default function AudioManager() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(() => {
    const saved = localStorage.getItem('burbleAudioFiles');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();
  const { firebaseUser, userProfile, updatePreferences } = useFirebase();
  const { play, addToPlaylist, setPlaylist, currentTrack, isPlaying, togglePopup } = useAudioPlayer();

  // Default theme songs to auto-load
  const defaultThemeSongs = [
    "Jeopardy theme song",
    "Price is Right theme song", 
    "Pokemon theme song"
  ];

  // Load Firebase audio files if signed in
  useEffect(() => {
    if (userProfile?.preferences?.audioFiles) {
      setAudioFiles(userProfile.preferences.audioFiles);
    }
  }, [userProfile]);

  // Auto-load default theme songs on component mount
  useEffect(() => {
    const loadDefaultSongs = async () => {
      try {
        const defaultTracks = [];
        
        for (const songQuery of defaultThemeSongs) {
          try {
            const results = await musicService.searchAllPlatforms(songQuery, 1);
            if (results.length > 0) {
              const track = musicService.convertToAudioTrack(results[0]);
              defaultTracks.push(track);
            }
          } catch (error) {
            console.log(`Could not load ${songQuery}:`, error);
          }
        }

        if (defaultTracks.length > 0) {
          // Add to playlist and start playing automatically
          setPlaylist(defaultTracks);
          toast({
            title: "🎵 Theme Songs Loaded!",
            description: `Added ${defaultTracks.length} classic theme songs to your playlist`,
          });
        }
      } catch (error) {
        console.log('Error loading default theme songs:', error);
      }
    };

    // Only load if we don't already have files
    if (audioFiles.length === 0) {
      loadDefaultSongs();
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const audioData: AudioFile = {
            id: Date.now() + Math.random().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target?.result as string,
            uploadDate: new Date().toISOString()
          };
          
          setAudioFiles(prev => {
            const updated = [...prev, audioData];
            localStorage.setItem('burbleAudioFiles', JSON.stringify(updated));
            
            // Save to Firebase if signed in
            if (firebaseUser) {
              updatePreferences({ audioFiles: updated });
            }
            
            return updated;
          });
          
          toast({
            title: "File Uploaded",
            description: `${file.name} has been uploaded successfully.`,
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload only audio files.",
          variant: "destructive",
        });
      }
    });
  };

  const deleteAudioFile = (fileId: string) => {
    setAudioFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId);
      localStorage.setItem('burbleAudioFiles', JSON.stringify(updated));
      
      // Save to Firebase if signed in
      if (firebaseUser) {
        updatePreferences({ audioFiles: updated });
      }
      
      return updated;
    });
    
    toast({
      title: "File Deleted",
      description: "Audio file has been removed.",
    });
  };

  // Convert AudioFile to AudioTrack format for the audio player
  const convertToAudioTrack = (file: AudioFile) => {
    // Extract title from filename (remove extension)
    const title = file.name.replace(/\.[^/.]+$/, "");
    
    return {
      title,
      artist: "Unknown Artist" as string | null,
      filename: file.name,
      fileUrl: file.data, // Use the base64 data URL
      duration: null as number | null, // Will be determined when loaded
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: firebaseUser?.uid ? parseInt(firebaseUser.uid.slice(-8), 16) : null,
      isPublic: false,
    };
  };

  // Play a single track
  const playTrack = (file: AudioFile) => {
    const audioTrack = convertToAudioTrack(file);
    const mockTrack = {
      id: parseInt(file.id.replace(/\D/g, '') || '1'),
      ...audioTrack,
      uploadedAt: new Date(file.uploadDate),
    };
    
    // Set as playlist and play
    setPlaylist([mockTrack]);
    play(mockTrack);
    
    // Open popup if not already open
    togglePopup();
    
    toast({
      title: "Playing Track",
      description: `Now playing: ${mockTrack.title}`,
    });
  };

  // Add track to current playlist
  const addToCurrentPlaylist = (file: AudioFile) => {
    const audioTrack = convertToAudioTrack(file);
    const mockTrack = {
      id: parseInt(file.id.replace(/\D/g, '') || '1'),
      ...audioTrack,
      uploadedAt: new Date(file.uploadDate),
    };
    
    addToPlaylist(mockTrack);
    
    toast({
      title: "Added to Playlist",
      description: `${mockTrack.title} added to playlist`,
    });
  };

  // Play all files as playlist
  const playAllFiles = () => {
    if (audioFiles.length === 0) return;
    
    const playlist = audioFiles.map(file => {
      const audioTrack = convertToAudioTrack(file);
      return {
        id: parseInt(file.id.replace(/\D/g, '') || '1'),
        ...audioTrack,
        uploadedAt: new Date(file.uploadDate),
      };
    });
    
    setPlaylist(playlist);
    play(playlist[0]);
    
    // Open popup if not already open
    togglePopup();
    
    toast({
      title: "Playing All Files",
      description: `Playing ${playlist.length} tracks`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-red-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Volume2 className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Audio Manager</h1>
            <p className="text-xl md:text-2xl opacity-90">
              Upload and manage your audio files
            </p>
            {firebaseUser && (
              <div className="flex items-center justify-center mt-4 text-sm opacity-75">
                <Cloud className="h-4 w-4 mr-2" />
                <span>Files synced to cloud • Signed in as {userProfile?.displayName || userProfile?.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        <Tabs defaultValue="search" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" data-testid="tab-music-search">
              🔍 Search Music
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-upload">
              📤 Upload Files
            </TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library">
              📂 My Library
            </TabsTrigger>
          </TabsList>

          {/* Music Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎵 Stream from Music Platforms
                </CardTitle>
                <CardDescription>
                  Search and play music from Spotify, YouTube, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MusicSearch />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Section */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Audio Files
                </CardTitle>
                <CardDescription>
                  Select audio files to upload and manage in your personal collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="audio-upload">Choose Audio Files</Label>
                    <Input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: MP3, WAV, OGG, M4A and other audio formats
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Audio Files</h2>
                {audioFiles.length > 0 && (
                  <Button 
                    onClick={playAllFiles}
                    className="flex items-center gap-2"
                    data-testid="button-play-all"
                  >
                    <Play className="h-4 w-4" />
                    Play All ({audioFiles.length})
                  </Button>
                )}
              </div>
              
              {audioFiles.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Volume2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No audio files uploaded yet</h3>
                    <p className="text-gray-500">Upload your first audio file to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {audioFiles.map(file => (
                    <Card key={file.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{file.name}</h3>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadDate).toLocaleDateString()}
                            </p>
                            <div className="mt-3">
                              <audio controls className="w-full max-w-md">
                                <source src={file.data} type={file.type} />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => playTrack(file)}
                              className="flex items-center gap-1"
                              data-testid={`button-play-${file.id}`}
                            >
                              <Play className="h-3 w-3" />
                              Play
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCurrentPlaylist(file)}
                              data-testid={`button-add-playlist-${file.id}`}
                              title="Add to current playlist"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAudioFile(file.id)}
                              data-testid={`button-delete-${file.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}