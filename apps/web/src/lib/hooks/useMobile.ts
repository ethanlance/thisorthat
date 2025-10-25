import { useState, useEffect, useCallback } from 'react';
import { TouchGestures } from '@/lib/mobile/TouchGestures';
import { MobileShare } from '@/lib/mobile/MobileShare';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  );

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setIsMobile(width < 768);
      setIsTouch('ontouchstart' in window);
      setScreenSize({ width, height });

      // Determine device type
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }

      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return {
    isMobile,
    isTouch,
    orientation,
    screenSize,
    deviceType,
  };
}

export function useTouchGestures() {
  const touchGestures = TouchGestures.getInstance();

  const addSwipeListener = useCallback(
    (
      callback: (
        direction: 'left' | 'right' | 'up' | 'down',
        distance: number,
        velocity: number
      ) => void,
      options?: { threshold?: number; velocity?: number }
    ) => {
      return touchGestures.addSwipeListener(callback, options);
    },
    [touchGestures]
  );

  const addTapListener = useCallback(
    (
      callback: (x: number, y: number) => void,
      options?: { threshold?: number; velocity?: number }
    ) => {
      return touchGestures.addTapListener(callback, options);
    },
    [touchGestures]
  );

  const addLongPressListener = useCallback(
    (
      callback: (x: number, y: number, duration: number) => void,
      options?: { threshold?: number; velocity?: number }
    ) => {
      return touchGestures.addLongPressListener(callback, options);
    },
    [touchGestures]
  );

  const addPinchListener = useCallback(
    (
      callback: (scale: number, center: { x: number; y: number }) => void,
      options?: { threshold?: number; velocity?: number }
    ) => {
      return touchGestures.addPinchListener(callback, options);
    },
    [touchGestures]
  );

  const addPullToRefreshListener = useCallback(
    (callback: () => void, options?: { threshold?: number }) => {
      return touchGestures.addPullToRefreshListener(callback, options);
    },
    [touchGestures]
  );

  return {
    addSwipeListener,
    addTapListener,
    addLongPressListener,
    addPinchListener,
    addPullToRefreshListener,
  };
}

export function useMobileShare() {
  const shareService = MobileShare.getInstance();

  const share = useCallback(
    async (
      data: { title: string; text?: string; url: string; files?: File[] },
      options?: {
        fallback?: boolean;
        copyToClipboard?: boolean;
        showToast?: boolean;
      }
    ): Promise<boolean> => {
      return shareService.share(data, options);
    },
    [shareService]
  );

  const sharePoll = useCallback(
    async (pollId: string, pollTitle: string): Promise<boolean> => {
      return shareService.sharePoll(pollId, pollTitle);
    },
    [shareService]
  );

  const shareProfile = useCallback(
    async (userId: string, userName: string): Promise<boolean> => {
      return shareService.shareProfile(userId, userName);
    },
    [shareService]
  );

  const shareApp = useCallback(async (): Promise<boolean> => {
    return shareService.shareApp();
  }, [shareService]);

  const shareToSocial = useCallback(
    async (
      platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram',
      data: { title: string; text?: string; url: string; files?: File[] }
    ): Promise<boolean> => {
      return shareService.shareToSocial(platform, data);
    },
    [shareService]
  );

  return {
    share,
    sharePoll,
    shareProfile,
    shareApp,
    shareToSocial,
    canShare: shareService.canShare(),
    canShareFiles: shareService.canShareFiles(),
    supportedFeatures: shareService.getSupportedFeatures(),
  };
}

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode =
        'standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone;

      setIsPWA(isStandalone || (isIOS && isInStandaloneMode));
    };

    checkPWA();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isPWA,
    isInstallable,
    installPWA,
  };
}

export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if haptic feedback is supported
    const checkSupport = () => {
      const hasVibrate = 'vibrate' in navigator;
      const hasHaptics = 'haptics' in navigator;
      setIsSupported(hasVibrate || hasHaptics);
    };

    checkSupport();
  }, []);

  const vibrate = useCallback(
    (pattern: number | number[] = 100) => {
      if (isSupported && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
    [isSupported]
  );

  const hapticFeedback = useCallback(
    async (type: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (isSupported && 'haptics' in navigator) {
        try {
          const haptics = (
            navigator as {
              haptics?: { vibrate: (type: string) => Promise<void> };
            }
          ).haptics;
          await haptics.vibrate(type);
        } catch (error) {
          console.warn('Haptic feedback failed:', error);
          // Fallback to vibration
          vibrate();
        }
      } else {
        // Fallback to vibration
        vibrate();
      }
    },
    [isSupported, vibrate]
  );

  return {
    isSupported,
    vibrate,
    hapticFeedback,
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [connectionSpeed, setConnectionSpeed] = useState<string>('unknown');

  useEffect(() => {
    const updateConnectionStatus = () => {
      setIsOnline(navigator.onLine);

      if ('connection' in navigator) {
        const connection = (
          navigator as {
            connection?: { effectiveType?: string; downlink?: number };
          }
        ).connection;
        setConnectionType(connection.effectiveType || 'unknown');
        setConnectionSpeed(
          connection.downlink ? `${connection.downlink}Mbps` : 'unknown'
        );
      }
    };

    updateConnectionStatus();

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    connectionSpeed,
  };
}
