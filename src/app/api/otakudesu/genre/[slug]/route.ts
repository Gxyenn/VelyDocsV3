import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    if (!slug) {
      return createErrorResponse(request, 'Genre slug is required', 400);
    }
    
    const url = page === '1'
      ? `${OtakudesuScraper.baseUrl}/genres/${slug}/`
      : `${OtakudesuScraper.baseUrl}/genres/${slug}/page/${page}/`;
    
    const fetchResult = await fetchHtml(url);
    
    if (fetchResult.status === 'error' || !fetchResult.data) {
      return createErrorResponse(request, fetchResult.message || 'Genre not found', 404, { slug });
    }
    
    const result = OtakudesuScraper.parseAnimeByGenre(fetchResult.data);
    
    return createApiResponse(request, `genre/${slug}`, {
      status: 'success',
      source: 'otakudesu',
      genre: slug,
      pagination: result.pagination,
      total: result.data.length,
      data: result.data
    });
  } catch (error) {
    console.error('Otakudesu genre error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
