'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { validateImageFile, compressImage, getFileSizeString } from '@/lib/storage/image-validation';
import { uploadPollImage } from '@/lib/storage/image-upload';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onUploadComplete: (url: string) => void;
  onError: (error: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  option: 'a' | 'b';
  pollId?: string;
  currentImage?: string;
}

export default function ImageUpload({
  onImageSelect,
  onUploadComplete,
  onError,
  onRemove,
  disabled = false,
  option,
  pollId,
  currentImage
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      onError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Compress image if needed
      const compressedFile = await compressImage(file);
      setPreview(URL.createObjectURL(compressedFile));
      onImageSelect(compressedFile);

      // Upload if pollId is provided
      if (pollId) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const result = await uploadPollImage(compressedFile, pollId, option);
        
        if (result.success && result.url) {
          onUploadComplete(result.url);
          setUploadProgress(100);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, onUploadComplete, onError, pollId, option]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    onRemove();
  }, [onRemove]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      <Card 
        className={`relative border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="p-6 text-center">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt={`Option ${option.toUpperCase()} preview`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={disabled}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isUploading ? 'Uploading...' : `Upload Option ${option.toUpperCase()}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select
                </p>
              </div>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <Alert variant="destructive" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
