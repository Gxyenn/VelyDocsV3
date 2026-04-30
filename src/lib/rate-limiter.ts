// Rate Limiter with IP tracking
// REAL Rate Limiting: 100 requests per minute PER IP across ALL endpoints

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  used: number;
}

interface GlobalStats {
  totalRequests: number;
  activeIPs: number;
  rateLimitedCount: number;
}

// Global in-memory storage - shared across ALL API endpoints
const rateLimitStore = new Map<string, RateLimitEntry>();

// Global counters for stats
let totalRequests = 0;
let rateLimitedCount = 0;

// Configuration - SHARED across all endpoints
export const DEFAULT_LIMIT = 100; // 100 requests per minute
export const WINDOW_MS = 60 * 1000; // 1 minute window

// Clean up old entries every 30 seconds to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 30000);
}

// Extract IP from request - handles proxies and CDNs
export function extractIP(request: Request): string {
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > unknown
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();
  
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list, first is client
    return forwarded.split(',')[0].trim();
  }
  
  return 'unknown';
}

// Check rate limit - ONE limit per IP across ALL endpoints
export function checkRateLimit(ip: string, apiKey?: string | null): RateLimitResult {
  // UNLIMITED Access for Gxyenn969
  if (apiKey === 'Gxyenn969') {
    return {
      allowed: true,
      limit: Infinity,
      remaining: Infinity,
      resetTime: Date.now() + WINDOW_MS,
      used: 0
    };
  }

  // Use ONLY IP as identifier - so all endpoints share the same limit
  const identifier = ip;
  const limit = DEFAULT_LIMIT;
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  totalRequests++;
  
  // If no entry or window expired, create new window
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + WINDOW_MS,
      firstRequest: now
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime: now + WINDOW_MS,
      used: 1
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= limit) {
    rateLimitedCount++;
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime,
      used: entry.count
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
    used: entry.count
  };
}

// Get global stats for debugging
export function getGlobalStats(): GlobalStats {
  return {
    totalRequests,
    uniqueIPs: rateLimitStore.size,
    rateLimitedCount
  };
}

// Get current usage for an IP
export function getCurrentUsage(ip: string): { used: number; limit: number; remaining: number } | null {
  const entry = rateLimitStore.get(ip);
  if (!entry) return null;
  
  return {
    used: entry.count,
    limit: DEFAULT_LIMIT,
    remaining: Math.max(0, DEFAULT_LIMIT - entry.count)
  };
}

// Format reset time for display
export function formatResetTime(resetTime: number): string {
  const seconds = Math.ceil((resetTime - Date.now()) / 1000);
  return `${seconds}s`;
}

// Get exact reset timestamp
export function getResetTimestamp(): number {
  return Date.now() + WINDOW_MS;
}
