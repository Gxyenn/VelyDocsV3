import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';
    
    if (!query) {
      return createErrorResponse(request, 'Query parameter "q" is required', 400);
    }
    
    const url = page === '1'
      ? `${OtakudesuScraper.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`
      : `${OtakudesuScraper.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}&post_type=anime`;
    
    const html = await fetchHtml(url);
    
    if (!html) {
      return createErrorResponse(request, 'Failed to perform search', 500);
    }
    
    const result = OtakudesuScraper.parseSearchResults(html);
    
    return createApiResponse(request, 'search', {
      status: 'success',
      source: 'otakudesu',
      query,
      pagination: result.pagination,
      total: result.data.length,
      data: result.data
    });
  } catch (error) {
    console.error('Otakudesu search error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
