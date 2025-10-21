'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  className?: string;
  showRemoveButton?: boolean;
}

export default function ImagePreview({
  src,
  alt,
  onRemove,
  className = '',
  showRemoveButton = true
}: ImagePreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <>
      <Card className={`relative group ${className}`}>
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoom}
                className="bg-white/90 hover:bg-white"
                aria-label="Zoom image"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {showRemoveButton && onRemove && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                  className="bg-white/90 hover:bg-white"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setIsZoomed(false)}
              aria-label="Close zoom"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
