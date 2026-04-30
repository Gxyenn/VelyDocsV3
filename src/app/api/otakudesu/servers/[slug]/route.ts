import { NextRequest } from 'next/server';
import { fetchHtml, fetchIframeUrl, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = `${OtakudesuScraper.baseUrl}/episode/${slug}/`;

    const result = await fetchHtml(url);
    
    if (result.status === 'error' || !result.data) {
      return createErrorResponse(request, result.message || 'Failed to fetch episode page', 404, { url });
    }

    const servers = OtakudesuScraper.parseServerList(result.data);

    // Fetch iframe URLs for each server
    const qualitiesWithIframe = await Promise.all(
      servers.qualities.map(async (quality) => ({
        quality: quality.quality,
        servers: await Promise.all(
          quality.servers.map(async (server) => {
            const iframeResult = await fetchIframeUrl(server.dataContent);
            return {
              ...server,
              iframeUrl: iframeResult.status === 'success' && iframeResult.data ? iframeResult.data : undefined
            };
          })
        )
      }))
    );

    return createApiResponse(request, 'servers', {
      status: 'success',
      source: 'otakudesu',
      url,
      data: {
        title: servers.title,
        qualities: qualitiesWithIframe
      }
    });
  } catch (error) {
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      String(error)
    );
  }
}
