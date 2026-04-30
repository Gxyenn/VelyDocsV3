import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const result = await fetchHtml(`${OtakudesuScraper.baseUrl}/genre-list/`);
    
    if (result.status === 'error' || !result.data) {
      return createErrorResponse(request, result.message || 'Failed to fetch genres', 500);
    }
    
    const genres = OtakudesuScraper.parseGenreList(result.data);
    
    return createApiResponse(request, 'genres', {
      status: 'success',
      source: 'otakudesu',
      total: genres.length,
      data: genres
    });
  } catch (error) {
    console.error('Otakudesu genres error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
