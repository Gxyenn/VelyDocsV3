import { NextRequest } from 'next/server';
import { fetchHtml, OtakudesuScraper } from '@/lib/scraper';
import { createApiResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const result = await fetchHtml(`${OtakudesuScraper.baseUrl}/jadwal-rilis/`);
    
    if (result.status === 'error' || !result.data) {
      return createErrorResponse(request, result.message || 'Failed to fetch schedule', 500);
    }
    
    const schedule = OtakudesuScraper.parseSchedule(result.data);
    
    // Convert to object format
    const scheduleData: Record<string, any[]> = {};
    schedule.forEach(day => {
      scheduleData[day.day.toLowerCase()] = day.anime;
    });
    
    return createApiResponse(request, 'schedule', {
      status: 'success',
      source: 'otakudesu',
      data: scheduleData
    });
  } catch (error) {
    console.error('Otakudesu schedule error:', error);
    return createErrorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
