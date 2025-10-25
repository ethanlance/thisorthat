import { useCallback } from 'react';

export interface ShareData {
  title: string;
  text?: string;
  url: string;
  files?: File[];
}

export interface ShareOptions {
  fallback?: boolean;
  copyToClipboard?: boolean;
  showToast?: boolean;
}

export class MobileShare {
  private static instance: MobileShare;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = this.checkSupport();
  }

  public static getInstance(): MobileShare {
    if (!MobileShare.instance) {
      MobileShare.instance = new MobileShare();
    }
    return MobileShare.instance;
  }

  private checkSupport(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  public async share(
    data: ShareData,
    options: ShareOptions = {}
  ): Promise<boolean> {
    const {
      fallback = true,
      copyToClipboard = true,
      showToast = true,
    } = options;

    try {
      if (this.isSupported) {
        await navigator.share(data);
        return true;
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      console.warn('Native sharing failed:', error);

      if (fallback) {
        return this.fallbackShare(data, { copyToClipboard, showToast });
      }

      return false;
    }
  }

  private async fallbackShare(
    data: ShareData,
    options: { copyToClipboard: boolean; showToast: boolean }
  ): Promise<boolean> {
    const { copyToClipboard, showToast } = options;

    try {
      // Try to copy URL to clipboard
      if (copyToClipboard && data.url) {
        await navigator.clipboard.writeText(data.url);

        if (showToast) {
          this.showToast('Link copied to clipboard!');
        }

        return true;
      }

      // Fallback to opening share dialog
      this.openShareDialog(data);
      return true;
    } catch (error) {
      console.error('Fallback sharing failed:', error);

      if (showToast) {
        this.showToast('Sharing not available on this device');
      }

      return false;
    }
  }

  private openShareDialog(data: ShareData): void {
    // Create a temporary share dialog
    const shareDialog = document.createElement('div');
    shareDialog.className =
      'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    shareDialog.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">Share Poll</h3>
        <p class="text-gray-600 mb-4">${data.title}</p>
        <div class="flex space-x-2">
          <button id="copy-link" class="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Copy Link
          </button>
          <button id="close-share" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(shareDialog);

    // Add event listeners
    const copyButton = shareDialog.querySelector('#copy-link');
    const closeButton = shareDialog.querySelector('#close-share');

    copyButton?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.url);
        this.showToast('Link copied to clipboard!');
        document.body.removeChild(shareDialog);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        this.showToast('Failed to copy link');
      }
    });

    closeButton?.addEventListener('click', () => {
      document.body.removeChild(shareDialog);
    });

    // Close on backdrop click
    shareDialog.addEventListener('click', e => {
      if (e.target === shareDialog) {
        document.body.removeChild(shareDialog);
      }
    });
  }

  private showToast(message: string): void {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-50';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }

  public async sharePoll(pollId: string, pollTitle: string): Promise<boolean> {
    const shareData: ShareData = {
      title: `Check out this poll: ${pollTitle}`,
      text: `Vote on "${pollTitle}" on ThisOrThat!`,
      url: `${window.location.origin}/poll/${pollId}`,
    };

    return this.share(shareData);
  }

  public async shareProfile(
    userId: string,
    userName: string
  ): Promise<boolean> {
    const shareData: ShareData = {
      title: `Check out ${userName}'s profile on ThisOrThat`,
      text: `Follow ${userName} on ThisOrThat to see their polls!`,
      url: `${window.location.origin}/users/${userId}`,
    };

    return this.share(shareData);
  }

  public async shareApp(): Promise<boolean> {
    const shareData: ShareData = {
      title: 'ThisOrThat - Poll & Vote',
      text: 'Create, share, and vote on polls with friends!',
      url: window.location.origin,
    };

    return this.share(shareData);
  }

  public async shareToSocial(
    platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram',
    data: ShareData
  ): Promise<boolean> {
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.title)}&url=${encodeURIComponent(data.url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(data.title + ' ' + data.url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`,
    };

    try {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      return true;
    } catch (error) {
      console.error('Failed to share to social media:', error);
      return false;
    }
  }

  public canShare(): boolean {
    return this.isSupported;
  }

  public canShareFiles(): boolean {
    return this.isSupported && 'files' in navigator.share;
  }

  public getSupportedFeatures(): {
    text: boolean;
    url: boolean;
    files: boolean;
    title: boolean;
  } {
    return {
      text: this.isSupported,
      url: this.isSupported,
      files: this.canShareFiles(),
      title: this.isSupported,
    };
  }
}

// Hook for using mobile share functionality
export function useMobileShare() {
  const shareService = MobileShare.getInstance();

  const share = useCallback(
    async (data: ShareData, options?: ShareOptions): Promise<boolean> => {
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
      data: ShareData
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
