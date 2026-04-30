import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    const url = page === '1'
      ? `${OtakudesuScraper.baseUrl}/ongoing-anime/`
      : `${OtakudesuScraper.baseUrl}/ongoing-anime/page/${page}/`;
    
    const result = await fetchHtml(url);
    
    if (result.status === 'error' || !result.data) {
      return createErrorResponse(request, result.message || 'Failed to fetch ongoing anime data', 500);
    }
    
    const data = OtakudesuScraper.parseAnimeList(result.data);
    
    return createApiResponse(request, 'ongoing', {
      status: 'success',
      source: 'otakudesu',
      baseUrl: OtakudesuScraper.baseUrl,
      pagination: data.pagination,
      total: data.data.length,
      data: data.data
    });
  } catch (error) {
    console.error('Otakudesu ongoing error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
