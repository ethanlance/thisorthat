'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CameraOff,
  RotateCcw,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCameraProps {
  onImageCapture: (file: File) => void;
  onClose: () => void;
  className?: string;
}

export default function MobileCamera({ 
  onImageCapture, 
  onClose, 
  className 
}: MobileCameraProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      
      // Convert canvas to file
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'poll-image.jpg', { type: 'image/jpeg' });
          onImageCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onImageCapture, onClose]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
    }
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [stopCamera, capturedImage]);

  return (
    <div className={cn('fixed inset-0 bg-black z-50', className)}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Take Photo</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Camera Controls Overlay */}
          {!capturedImage && (
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-black/50">
          {!capturedImage ? (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={openFilePicker}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <ImageIcon className="h-6 w-6 mr-2" />
                Gallery
              </Button>

              <Button
                size="lg"
                onClick={isStreaming ? capturePhoto : startCamera}
                className="bg-white text-black hover:bg-gray-200 w-16 h-16 rounded-full"
              >
                {isStreaming ? (
                  <Camera className="h-8 w-8" />
                ) : (
                  <CameraOff className="h-8 w-8" />
                )}
              </Button>

              <div className="w-16" /> {/* Spacer */}
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={retakePhoto}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <X className="h-5 w-5 mr-2" />
                Retake
              </Button>

              <Button
                size="lg"
                onClick={confirmPhoto}
                disabled={isProcessing}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Use Photo'}
              </Button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
