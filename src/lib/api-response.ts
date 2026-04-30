import { NextResponse } from 'next/server';
import { 
  extractIP, 
  checkRateLimit, 
  formatResetTime
} from '@/lib/rate-limiter';

// Standard VelyData response wrapper with REAL rate limiting
export function createApiResponse(
  request: Request,
  endpoint: string,
  data: any,
  status: number = 200
): NextResponse {
  // Extract IP from request
  const ip = extractIP(request);
  
  // Extract API Key from headers or query params
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key');
  
  // Check rate limit - REAL check, shared across ALL endpoints
  const rateInfo = checkRateLimit(ip, apiKey);
  
  // If rate limited - RETURN 429 with proper error
  if (!rateInfo.allowed) {
    return NextResponse.json({
      VelyData: {
        Message: "Rate Limit Exceeded - Too many requests",
        Author: "Gxyenn",
        Status: "rate_limited",
        RateLimit: {
          limit: rateInfo.limit,
          used: rateInfo.used,
          remaining: rateInfo.remaining,
          resetTime: new Date(rateInfo.resetTime).toISOString(),
          resetIn: formatResetTime(rateInfo.resetTime)
        }
      }
    }, { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(rateInfo.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(rateInfo.resetTime / 1000)),
        'X-RateLimit-Used': String(rateInfo.used),
        'Retry-After': String(Math.ceil((rateInfo.resetTime - Date.now()) / 1000))
      }
    });
  }
  
  // Build success response with VelyData
  const response = {
    VelyData: {
      Message: "Success",
      Author: "Gxyenn",
      Status: "active",
      Endpoint: endpoint,
      RateLimit: {
        limit: rateInfo.limit,
        used: rateInfo.used,
        remaining: rateInfo.remaining,
        resetTime: new Date(rateInfo.resetTime).toISOString(),
        resetIn: formatResetTime(rateInfo.resetTime)
      }
    },
    ...data
  };
  
  const jsonResponse = NextResponse.json(response, { status });
  
  // Add rate limit headers for client awareness
  jsonResponse.headers.set('X-RateLimit-Limit', String(rateInfo.limit));
  jsonResponse.headers.set('X-RateLimit-Remaining', String(rateInfo.remaining));
  jsonResponse.headers.set('X-RateLimit-Reset', String(Math.floor(rateInfo.resetTime / 1000)));
  jsonResponse.headers.set('X-RateLimit-Used', String(rateInfo.used));
  
  return jsonResponse;
}

// Error response helper - also respects rate limiting
export function createErrorResponse(
  request: Request,
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  // Still count towards rate limit even on errors
  const ip = extractIP(request);
  
  // Extract API Key from headers or query params
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key');
  
  const rateInfo = checkRateLimit(ip, apiKey);
  
  return NextResponse.json({
    VelyData: {
      Message: message,
      Author: "Gxyenn",
      Status: "error",
      Details: details,
      RateLimit: {
        limit: rateInfo.limit,
        used: rateInfo.used,
        remaining: rateInfo.remaining,
        resetTime: new Date(rateInfo.resetTime).toISOString(),
        resetIn: formatResetTime(rateInfo.resetTime)
      }
    }
  }, { 
    status,
    headers: {
      'X-RateLimit-Limit': String(rateInfo.limit),
      'X-RateLimit-Remaining': String(rateInfo.remaining),
      'X-RateLimit-Reset': String(Math.floor(rateInfo.resetTime / 1000)),
      'X-RateLimit-Used': String(rateInfo.used)
    }
  });
}
