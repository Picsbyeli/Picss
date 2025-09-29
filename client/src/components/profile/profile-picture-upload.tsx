import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  username: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export function ProfilePictureUpload({ 
  currentImageUrl, 
  username, 
  onUploadComplete 
}: ProfilePictureUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Mutation for updating profile picture URL
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return apiRequest('PUT', '/api/user/profile-picture', { imageUrl });
    },
    onSuccess: (data, imageUrl) => {
      toast({
        title: 'Profile picture updated!',
        description: 'Your profile picture has been successfully updated.',
      });
      onUploadComplete?.(imageUrl);
      // Invalidate user queries to refetch updated user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile picture. Please try again.',
        variant: 'destructive',
      });
      console.error('Profile picture update error:', error);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, GIF, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get upload URL from backend
      const response = await apiRequest('POST', '/api/profile-pictures/upload', {});
      const responseBody = await response.json() as { uploadURL: string };
      const { uploadURL } = responseBody;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file to signed URL
      const uploadResult = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      // Extract the permanent URL from the upload URL
      const permanentUrl = uploadURL.split('?')[0]; // Remove query parameters
      
      // Update user profile with new image URL
      updateProfilePictureMutation.mutate(permanentUrl);

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      setPreviewUrl(currentImageUrl || null); // Reset preview on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Update user profile to remove image URL
      updateProfilePictureMutation.mutate('');
      setPreviewUrl(null);
    } catch (error) {
      toast({
        title: 'Remove failed',
        description: 'Failed to remove profile picture. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile picture to personalize your account. Supports JPEG, PNG, GIF up to 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Preview */}
          <Avatar className="w-24 h-24">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={username} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                {getInitials(username)}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Upload Controls */}
          <div className="flex gap-2">
            <Button
              onClick={triggerFileInput}
              disabled={isUploading || updateProfilePictureMutation.isPending}
              className="flex items-center gap-2"
            >
              {isUploading || updateProfilePictureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {previewUrl ? 'Change Picture' : 'Upload Picture'}
            </Button>

            {previewUrl && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isUploading || updateProfilePictureMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}