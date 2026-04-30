import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return createErrorResponse(request, 'Slug parameter is required', 400);
    }
    
    const url = `${OtakudesuScraper.baseUrl}/anime/${slug}/`;
    const html = await fetchHtml(url);
    
    if (!html) {
      return createErrorResponse(request, 'Anime not found', 404, { slug });
    }
    
    const data = OtakudesuScraper.parseAnimeDetail(html);
    
    if (!data.title) {
      return createErrorResponse(request, 'Anime not found', 404, { slug });
    }
    
    return createApiResponse(request, 'anime/detail', {
      status: 'success',
      source: 'otakudesu',
      url,
      data
    });
  } catch (error) {
    console.error('Otakudesu anime detail error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
