import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    const url = page === '1' 
      ? `${OtakudesuScraper.baseUrl}/anime-list/`
      : `${OtakudesuScraper.baseUrl}/anime-list/page/${page}/`;
    
    const fetchResult = await fetchHtml(url);
    
    if (fetchResult.status === 'error' || !fetchResult.data) {
      return createErrorResponse(request, fetchResult.message || 'Failed to fetch anime list', 500);
    }
    
    const result = OtakudesuScraper.parseAnimeList(fetchResult.data);
    
    return createApiResponse(request, 'anime-list', {
      status: 'success',
      source: 'otakudesu',
      baseUrl: OtakudesuScraper.baseUrl,
      pagination: result.pagination,
      total: result.data.length,
      data: result.data
    });
  } catch (error) {
    console.error('Otakudesu anime-list error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
