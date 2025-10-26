'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Search,
  Plus,
  Bell,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TouchGestures } from '@/lib/mobile/TouchGestures';

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: Home, path: '/' },
      { id: 'discover', label: 'Discover', icon: Search, path: '/discover' },
      { id: 'create', label: 'Create', icon: Plus, path: '/poll/create' },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/notifications',
      },
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    ],
    []
  );

  const menuItems = [
    { label: 'My Polls', path: '/polls' },
    { label: 'Saved', path: '/saved' },
    { label: 'Trending', path: '/trending' },
    { label: 'Settings', path: '/settings' },
    { label: 'Help', path: '/help' },
  ];

  useEffect(() => {
    // Update active tab based on current path
    const currentTab =
      navigationItems.find(item => item.path === pathname)?.id || 'home';
    setActiveTab(currentTab);

    // Update navigation history
    setCanGoBack(window.history.length > 1);
    setCanGoForward(false); // Forward navigation is not easily detectable
  }, [pathname, navigationItems]);

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      router.back();
    }
  }, [canGoBack, router]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      router.forward();
    }
  }, [canGoForward, router]);

  useEffect(() => {
    const touchGestures = TouchGestures.getInstance();

    // Add swipe gesture for navigation
    const removeSwipeListener = touchGestures.addSwipeListener(
      (direction, distance, velocity) => {
        if (direction === 'left' && distance > 100 && velocity > 0.5) {
          // Swipe left to go back
          handleGoBack();
        } else if (direction === 'right' && distance > 100 && velocity > 0.5) {
          // Swipe right to go forward
          handleGoForward();
        }
      },
      { threshold: 100, velocity: 0.5 }
    );

    // Add pull-to-refresh
    const removePullToRefresh = touchGestures.addPullToRefreshListener(() => {
      window.location.reload();
    });

    return () => {
      removeSwipeListener();
      removePullToRefresh();
    };
  }, [handleGoBack, handleGoForward]);

  const handleTabClick = (item: (typeof navigationItems)[0]) => {
    setActiveTab(item.id);
    router.push(item.path);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background border-t border-border',
          'flex items-center justify-around px-2 py-1',
          'safe-area-pb',
          className
        )}
      >
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                'flex flex-col items-center space-y-1 h-16 w-16',
                'touch-manipulation',
                isActive && 'text-primary'
              )}
              onClick={() => handleTabClick(item)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
      {/* Top Navigation Bar */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border',
          'flex items-center justify-between px-4 py-3',
          'safe-area-pt z-50'
        )}
      >
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="touch-manipulation"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold truncate">
            {navigationItems.find(item => item.id === activeTab)?.label ||
              'ThisOrThat'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="touch-manipulation"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={toggleMenu}>
          <div className="absolute right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMenu}
                  className="touch-manipulation"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="space-y-2">
                {menuItems.map(item => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start h-12 text-left touch-manipulation"
                    onClick={() => handleMenuClick(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>

              <div className="mt-8 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <p>ThisOrThat v1.0.0</p>
                  <p>Built with ❤️ for mobile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Spacer for fixed navigation */}
      <div className="h-16" /> {/* Bottom navigation height */}
      <div className="h-16" /> {/* Top navigation height */}
    </>
  );
}
