import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const html = await fetchHtml(OtakudesuScraper.baseUrl);
    
    if (!html) {
      return createErrorResponse(request, 'Failed to fetch data from Otakudesu', 500);
    }
    
    const data = OtakudesuScraper.parseHome(html);
    
    return createApiResponse(request, 'home', {
      status: 'success',
      source: 'otakudesu',
      baseUrl: OtakudesuScraper.baseUrl,
      data: {
        ongoing: data.ongoing,
        complete: data.complete,
        totalOngoing: data.ongoing.length,
        totalComplete: data.complete.length
      }
    });
  } catch (error) {
    console.error('Otakudesu home error:', error);
    return createErrorResponse(
      request,
      'Internal server error', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
