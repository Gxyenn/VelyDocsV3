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

    const html = await fetchHtml(url);
    
    if (!html) {
      return createErrorResponse(request, 'Failed to fetch episode page', 404, { url });
    }

    const servers = OtakudesuScraper.parseServerList(html);

    // Fetch iframe URLs for each server
    const qualitiesWithIframe = await Promise.all(
      servers.qualities.map(async (quality) => ({
        quality: quality.quality,
        servers: await Promise.all(
          quality.servers.map(async (server) => {
            const iframeUrl = await fetchIframeUrl(server.dataContent);
            return {
              ...server,
              iframeUrl: iframeUrl || undefined
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
