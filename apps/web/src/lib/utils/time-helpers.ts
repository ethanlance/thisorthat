import { TimeLeft } from '@/lib/services/expiration';

/**
 * Format a timestamp as a relative time string (e.g., "2 hours ago", "in 5 minutes")
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Format a timestamp as a future relative time string (e.g., "in 2 hours", "in 5 minutes")
 */
export const formatFutureRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `in ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
};

/**
 * Format a timestamp as a readable date string
 */
export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a timestamp as a short date string
 */
export const formatShortDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if a timestamp is in the past
 */
export const isPast = (timestamp: string): boolean => {
  return new Date(timestamp) < new Date();
};

/**
 * Check if a timestamp is in the future
 */
export const isFuture = (timestamp: string): boolean => {
  return new Date(timestamp) > new Date();
};

/**
 * Get the difference between two timestamps in milliseconds
 */
export const getTimeDifference = (
  timestamp1: string,
  timestamp2: string
): number => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return Math.abs(date1.getTime() - date2.getTime());
};

/**
 * Add time to a timestamp
 */
export const addTime = (
  timestamp: string,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): string => {
  const date = new Date(timestamp);
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  date.setTime(date.getTime() + amount * multipliers[unit]);
  return date.toISOString();
};

/**
 * Get a human-readable duration string from milliseconds
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get the time until a timestamp in a human-readable format
 */
export const getTimeUntil = (timestamp: string): string => {
  const now = new Date();
  const target = new Date(timestamp);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  return formatDuration(diff);
};
