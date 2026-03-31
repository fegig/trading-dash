type TimeFormat = '12h' | '24h';

/**
 * Converts a timestamp to a formatted time string
 * @param timestamp Unix timestamp in milliseconds
 * @param format Desired output format ('12h' or '24h')
 * @returns Formatted time string
 */
const formatTime = (timestamp: number, format: TimeFormat = '12h'): string => {
  const date = new Date(timestamp);
  
  if (format === '12h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Converts a timestamp to a formatted date string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "Jan 1, 2024")
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateWithTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Returns a relative time string (e.g., "2 hours ago")
 * @param timestamp Unix timestamp in milliseconds
 * @returns Relative time string
 */
const getRelativeTime = (timestamp: number): string => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = Date.now();
  const diff = timestamp - now;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (Math.abs(days) > 0) return rtf.format(days, 'day');
  if (Math.abs(hours) > 0) return rtf.format(hours, 'hour');
  if (Math.abs(minutes) > 0) return rtf.format(minutes, 'minute');
  return rtf.format(seconds, 'second');
};

/**
 * Formats a duration in milliseconds to a readable string
 * @param duration Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Returns a human-readable string representing the time elapsed since the given timestamp
 * @param timestamp Unix timestamp in milliseconds
 * @returns Human-readable distance string (e.g., "2 hours ago", "just now", "5 minutes ago")
 */
const formatDistanceToNow = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp; // Note: reversed diff from getRelativeTime
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return 'less than a minute ago';
  if (minutes === 1) return 'a minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return 'an hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (months === 1) return 'a month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return 'a year ago';
  return `${years} years ago`;
};

export {
  formatTime,
  formatDate,
  formatDateWithTime,
  getRelativeTime,
  formatDuration,
  formatDistanceToNow,
  type TimeFormat
};
