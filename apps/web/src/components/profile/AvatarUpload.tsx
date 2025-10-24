'use client';

import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/lib/services/profile';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (newAvatarUrl: string | null) => void;
  disabled?: boolean;
}

export default function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  disabled = false,
}: AvatarUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !user) return;

    const file = fileInputRef.current.files[0];
    setIsUploading(true);
    setError(null);

    try {
      const avatarUrl = await ProfileService.uploadAvatar(user.id, file);
      onAvatarChange(avatarUrl);
      setPreviewUrl(null);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsUploading(true);
    setError(null);

    try {
      await ProfileService.deleteAvatar(user.id);
      onAvatarChange(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Error deleting avatar:', err);
      setError('Failed to delete avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const hasChanges = previewUrl !== null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt="Profile avatar" />
          <AvatarFallback className="text-2xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        {!disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
            disabled={isUploading}
          >
            <Camera className="h-6 w-6 text-white" />
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Actions */}
      <div className="flex flex-col space-y-2 w-full max-w-xs">
        {!hasChanges ? (
          <div className="flex space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={disabled || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentAvatarUrl ? 'Change' : 'Upload'}
            </Button>

            {currentAvatarUrl && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              size="sm"
              className="flex-1"
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Save'}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center max-w-xs">
        Upload a profile picture. Max size: 5MB. Supported formats: JPG, PNG,
        WebP
      </div>
    </div>
  );
}
