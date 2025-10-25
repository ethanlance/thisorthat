'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePerformance } from '@/lib/hooks/usePerformance';
import { useIntersectionObserver } from '@/lib/hooks/usePerformance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  const { recordImageLoadTime } = usePerformance();
  const imageRef = useRef<HTMLDivElement>(null);

  const { observe, unobserve } = useIntersectionObserver(
    useCallback(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            unobserve();
          }
        });
      },
      [unobserve]
    ),
    {
      rootMargin: '50px',
      threshold: 0.1,
    }
  );

  useEffect(() => {
    if (!priority && imageRef.current) {
      observe(imageRef.current);
    }
  }, [priority, observe]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);

    if (loadStartTime) {
      const loadTime = Date.now() - loadStartTime;
      recordImageLoadTime(src, loadTime);
    }

    onLoad?.();
  }, [loadStartTime, recordImageLoadTime, src, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  const handleLoadStart = useCallback(() => {
    setLoadStartTime(Date.now());
  }, []);

  // Generate responsive sizes if not provided
  const responsiveSizes =
    sizes ||
    `
    (max-width: 768px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  `;

  // Generate blur placeholder if not provided
  const defaultBlurDataURL =
    blurDataURL ||
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  if (hasError) {
    return (
      <div
        ref={imageRef}
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Image failed to load</div>
        </div>
      </div>
    );
  }

  if (!isInView && !priority) {
    return (
      <div
        ref={imageRef}
        className={cn('bg-muted animate-pulse', className)}
        style={{ width, height, ...style }}
      >
        <div className="w-full h-full bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  return (
    <div
      ref={imageRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        sizes={responsiveSizes}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        style={{
          objectFit: 'cover',
        }}
      />

      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="w-full h-full bg-muted-foreground/20 rounded" />
        </div>
      )}
    </div>
  );
}
