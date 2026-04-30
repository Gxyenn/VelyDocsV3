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
    
    const url = `${OtakudesuScraper.baseUrl}/episode/${slug}/`;
    const result = await fetchHtml(url);
    
    if (result.status === 'error' || !result.data) {
      return createErrorResponse(request, result.message || 'Episode not found', 404, { slug });
    }
    
    const data = OtakudesuScraper.parseEpisodeDetail(result.data);
    
    if (!data || !data.title) {
      return createErrorResponse(request, 'Episode detail parsing failed', 500, { slug });
    }
    
    return createApiResponse(request, 'episode/detail', {
      status: 'success',
      source: 'otakudesu',
      url,
      data
    });
  } catch (error) {
    console.error('Otakudesu episode detail error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
