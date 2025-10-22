import { createClient } from '@/lib/supabase/client';
import { Poll } from '@/lib/supabase/types';

export type PollStatus = 'active' | 'closed' | 'deleted';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // total milliseconds
}

/**
 * Check and update expired polls in the database
 */
export const checkAndUpdateExpiredPolls = async (): Promise<number> => {
  const supabase = createClient();
  const now = new Date();
  
  const { data, error } = await supabase
    .from('polls')
    .update({ status: 'closed' })
    .lt('expires_at', now.toISOString())
    .eq('status', 'active')
    .select('id');
    
  if (error) throw error;
  
  return data?.length || 0;
};

/**
 * Get the current status of a poll based on expiration time
 */
export const getPollStatus = (poll: Poll): PollStatus => {
  if (poll.status === 'closed' || poll.status === 'deleted') {
    return poll.status;
  }
  
  const now = new Date();
  const expiresAt = new Date(poll.expires_at);
  
  if (now >= expiresAt) {
    return 'closed';
  }
  
  return 'active';
};

/**
 * Check if a poll is expired
 */
export const isPollExpired = (poll: Poll): boolean => {
  return getPollStatus(poll) === 'closed';
};

/**
 * Check if a poll is active (not expired and not deleted)
 */
export const isPollActive = (poll: Poll): boolean => {
  return getPollStatus(poll) === 'active';
};

/**
 * Calculate time left until expiration
 */
export const calculateTimeLeft = (expiresAt: string): TimeLeft | null => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration.getTime() - now.getTime();
  
  if (diff <= 0) {
    return null;
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    total: diff
  };
};

/**
 * Format time left as a human-readable string
 */
export const formatTimeLeft = (timeLeft: TimeLeft): string => {
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
  } else if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
  } else if (timeLeft.minutes > 0) {
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  } else {
    return `${timeLeft.seconds}s`;
  }
};

/**
 * Get expiration warning level based on time left
 */
export const getExpirationWarningLevel = (timeLeft: TimeLeft | null): 'none' | 'warning' | 'critical' => {
  if (!timeLeft) return 'none';
  
  const totalMinutes = timeLeft.total / (1000 * 60);
  
  if (totalMinutes <= 5) return 'critical';
  if (totalMinutes <= 30) return 'warning';
  return 'none';
};

/**
 * Close a specific poll by ID
 */
export const closePoll = async (pollId: string): Promise<void> => {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('polls')
    .update({ status: 'closed' })
    .eq('id', pollId);
    
  if (error) throw error;
};

/**
 * Get polls that are expiring soon (within the next hour)
 */
export const getPollsExpiringSoon = async (): Promise<Poll[]> => {
  const supabase = createClient();
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('status', 'active')
    .gte('expires_at', now.toISOString())
    .lte('expires_at', oneHourFromNow.toISOString())
    .order('expires_at', { ascending: true });
    
  if (error) throw error;
  return data || [];
};
