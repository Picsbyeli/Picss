import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  username: string;
  initialImage?: string | null;
  onImageChange: (imageUrl: string) => void;
}

export function AvatarUpload({ username, initialImage, onImageChange }: AvatarUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImagePreview(imageUrl);
      onImageChange(imageUrl);
    };
    reader.readAsDataURL(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Create initials for the fallback
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative cursor-pointer group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerFileInput}
      >
        <Avatar className="w-24 h-24 border-2 border-border dark:border-zinc-700">
          {imagePreview ? (
            <AvatarImage src={imagePreview} alt={username} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
              {getInitials(username)}
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-200 bg-black bg-opacity-50 
          ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          <Camera className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="mt-2 text-xs"
        onClick={triggerFileInput}
      >
        <Upload className="w-3 h-3 mr-1" />
        {imagePreview ? 'Change Picture' : 'Upload Picture'}
      </Button>
    </div>
  );
}