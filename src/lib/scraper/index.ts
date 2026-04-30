import * as cheerio from 'cheerio';
const cloudscraper = require('cloudscraper');

// ===================== TYPES =====================
export interface ScraperResponse<T = any> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
}

export interface AnimeInfo {
  title: string;
  link: string;
  slug: string;
  episode?: string;
  day?: string;
  score?: string;
  type?: string;
  status?: string;
  image?: string;
  uploadedAt?: string;
  studio?: string;
  genre?: string;
  synopsis?: string;
  rating?: string;
}

export interface AnimeDetail {
  title: string;
  japanese?: string;
  score?: string;
  producer?: string;
  type?: string;
  status?: string;
  totalEpisode?: string;
  duration?: string;
  releaseDate?: string;
  studio?: string;
  genre: string[];
  synopsis?: string;
  image?: string;
  episodes: EpisodeInfo[];
  batch?: BatchInfo;
}

export interface EpisodeInfo {
  title: string;
  link: string;
  slug: string;
  date?: string;
}

export interface EpisodeDetail {
  title: string;
  animeTitle?: string;
  animeSlug?: string;
  image?: string;
  iframeUrl?: string;
  download: DownloadQuality[];
}

export interface ServerList {
  title: string;
  qualities: ServerQuality[];
}

export interface ServerQuality {
  quality: string;
  servers: ServerInfo[];
}

export interface ServerInfo {
  name: string;
  serverId: string;
  dataContent: string;
  iframeUrl?: string;
}

export interface StreamingServer {
  name: string;
  link: string;
  iframeUrl?: string;
  quality?: string;
}

export interface DownloadQuality {
  quality: string;
  servers: DownloadServer[];
}

export interface DownloadServer {
  name: string;
  link: string;
  size?: string;
}

export interface BatchInfo {
  link: string;
  quality?: string;
}

export interface GenreInfo {
  name: string;
  link: string;
  slug: string;
  count?: number;
}

export interface ScheduleInfo {
  day: string;
  anime: AnimeInfo[];
}

export interface Pagination {
  totalPages: number;
  currentPage: number;
  nextPage: number | false;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

// ===================== UTILITIES =====================
function cleanText(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&get;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSlug(url: string): string {
  if (!url) return '';
  const cleanUrl = url.replace(/\/$/, '');
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1] || '';
}

function extractNumber(text: string): string {
  const match = text.match(/\d+/);
  return match ? match[0] : '';
}

function decodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

// ===================== ANTI-BAN UTILITIES =====================
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function randomDelay(min: number = 2000, max: number = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================== FETCH WITH RETRY (CLOUDSCRAPER) =====================
export async function fetchWithRetry(
  url: string, 
  options: any = {}, 
  retries: number = 5
): Promise<ScraperResponse<string>> {
  let lastError: any = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Exponentially increase delay on each retry
      const delayTime = i === 0 ? 0 : (2000 * Math.pow(2, i-1)) + (Math.random() * 1000);
      if (delayTime > 0) await new Promise(r => setTimeout(r, delayTime));
      
      // Basic random delay to avoid rapid requests
      await randomDelay(1500, 3000);

      const ua = getRandomUserAgent();
      const defaultOptions = {
        uri: url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        timeout: 20000,
        gzip: true,
        jar: true, // Enable cookies
        formData: options.body, 
        ...options
      };

      const response = await cloudscraper(defaultOptions);
      
      if (!response) {
        throw new Error('Empty response from server');
      }

      return {
        status: 'success',
        data: typeof response === 'string' ? response : JSON.stringify(response),
        message: 'Successfully fetched data'
      };
    } catch (error: any) {
      lastError = error;
      const statusCode = error.statusCode || error.response?.status || 'Unknown';
      console.error(`[Retry ${i + 1}/${retries}] Failed to fetch ${url}. Status: ${statusCode}. Message: ${error.message}`);
      
      // Additional delay on error
      if (i < retries - 1) {
        await randomDelay(2000, 5000);
      }
    }
  }

  return {
    status: 'error',
    data: null,
    message: `Failed after ${retries} retries. Last error: ${lastError?.message || 'Unknown'}`
  };
}

// Wrapper for HTML fetching
export async function fetchHtml(url: string): Promise<ScraperResponse<string>> {
  return await fetchWithRetry(url);
}

// ===================== FETCH IFRAME URL =====================
let cachedNonce: string | null = null;

export async function fetchIframeUrl(dataContent: string): Promise<ScraperResponse<string>> {
  try {
    const ajaxUrl = `${OtakudesuScraper.baseUrl}/wp-admin/admin-ajax.php`;
    
    // Get nonce if not cached
    if (!cachedNonce) {
      const nonceResult = await fetchWithRetry(ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': OtakudesuScraper.baseUrl,
          'Referer': OtakudesuScraper.baseUrl,
        },
        body: { action: 'aa1208d27f29ca340c92c66d1926f13f' }
      });
      
      if (nonceResult.status === 'success' && nonceResult.data) {
        try {
          const nonceData = JSON.parse(nonceResult.data);
          if (nonceData.data) {
            cachedNonce = nonceData.data;
          }
        } catch (e) {
          console.error('Failed to parse nonce response');
        }
      }
    }
    
    if (!cachedNonce) {
      return { status: 'error', data: null, message: 'Could not obtain AJAX nonce' };
    }
    
    // Parse data-content
    const decodedData = JSON.parse(decodeBase64(dataContent));
    
    // Get iframe
    const iframeResult = await fetchWithRetry(ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': OtakudesuScraper.baseUrl,
        'Referer': OtakudesuScraper.baseUrl,
      },
      body: {
        action: '2a3505c93b0035d3f455df82bf976b84',
        nonce: cachedNonce,
        id: String(decodedData.id),
        i: String(decodedData.i),
        q: String(decodedData.q)
      }
    });
    
    if (iframeResult.status === 'success' && iframeResult.data) {
      const iframeData = JSON.parse(iframeResult.data);
      if (iframeData.data) {
        const html = decodeBase64(iframeData.data);
        const srcMatch = html.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
          return { status: 'success', data: srcMatch[1], message: 'Successfully fetched iframe URL' };
        }
      }
    }
    
    return { status: 'error', data: null, message: 'Could not extract iframe URL' };
  } catch (error: any) {
    console.error('Error fetching iframe URL:', error);
    return { status: 'error', data: null, message: error.message };
  }
}

// ===================== OTAKUDESU SCRAPER =====================
export const OtakudesuScraper = {
  baseUrl: 'https://otakudesu.cloud',

  // ===================== HOME PAGE =====================
  parseHome(html: string | null): { ongoing: AnimeInfo[]; complete: AnimeInfo[] } {
    if (!html) return { ongoing: [], complete: [] };
    const $ = cheerio.load(html);
    const ongoing: AnimeInfo[] = [];
    const complete: AnimeInfo[] = [];
    
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'random'];

    $('.rseries, .rapi, .venz').each((_, section) => {
      const $section = $(section);
      
      $section.find('.detpost').each((_, el) => {
        const $el = $(el);
        const link = $el.find('.thumb a').attr('href') || '';
        const title = cleanText($el.find('.jdlflm').text());
        const epText = cleanText($el.find('.epz').text());
        const episode = extractNumber(epText);
        const dayOrScore = cleanText($el.find('.epztipe').text());
        const uploadedAt = cleanText($el.find('.newnime').text());
        const image = $el.find('.thumb img').attr('src') || '';

        if (title && link) {
          const animeInfo: AnimeInfo = {
            title, link, slug: extractSlug(link),
            episode, image, uploadedAt
          };

          const isOngoing = days.some(d => dayOrScore.toLowerCase().includes(d));
          if (isOngoing) {
            animeInfo.day = dayOrScore;
            ongoing.push(animeInfo);
          } else {
            animeInfo.score = dayOrScore;
            complete.push(animeInfo);
          }
        }
      });
    });

    return { ongoing, complete };
  },

  // ===================== ANIME LIST =====================
  parseAnimeList(html: string | null): PaginatedResult<AnimeInfo> {
    if (!html) return { data: [], pagination: { totalPages: 1, currentPage: 1, nextPage: false } };
    const $ = cheerio.load(html);
    const list: AnimeInfo[] = [];

    $('.venz .detpost, .col-md-4 .detpost, .archive .detpost').each((_, el) => {
      const $el = $(el);
      const link = $el.find('.thumb a').attr('href') || '';
      const title = cleanText($el.find('.jdlflm').text());
      const image = $el.find('.thumb img').attr('src') || '';
      const epText = cleanText($el.find('.epz').text());
      const episode = extractNumber(epText);

      if (title && link && link.includes('/anime/')) {
        list.push({ title, link, slug: extractSlug(link), episode, image });
      }
    });

    const uniqueList = list.filter((anime, index, self) =>
      index === self.findIndex(a => a.slug === anime.slug)
    );

    const currentPage = parseInt($('.pagination .current, .page-numbers.current').text() || '1');
    const hasNextPage = $('.pagination .next, .page-numbers.next').length > 0;
    const totalPages = parseInt($('.pagination .page-numbers').not('.next').not('.prev').last().text()) || 1;

    return {
      data: uniqueList,
      pagination: {
        totalPages,
        currentPage: currentPage || 1,
        nextPage: hasNextPage ? (currentPage || 1) + 1 : false
      }
    };
  },

  // ===================== ANIME DETAIL =====================
  parseAnimeDetail(html: string | null): AnimeDetail | null {
    if (!html) return null;
    const $ = cheerio.load(html);
    const info: AnimeDetail = {
      title: '',
      genre: [],
      episodes: []
    };

    info.title = cleanText($('.jdlrx h1').text()) || cleanText($('h1').first().text());
    if (!info.title) return null;

    $('.infozingle p, .fotoanime .info p').each((_, el) => {
      const $p = $(el);
      const text = $p.text();
      const $span = $p.find('span');

      if (text.includes('Japanese') || text.includes('Alternatif')) {
        info.japanese = cleanText($span.text().replace(/Japanese:|Alternatif:/gi, ''));
      } else if (text.includes('Skor')) {
        info.score = cleanText(text.replace('Skor:', '').trim());
      } else if (text.includes('Produser')) {
        info.producer = cleanText(text.replace('Produser:', '').trim());
      } else if (text.includes('Tipe')) {
        info.type = cleanText(text.replace('Tipe:', '').trim());
      } else if (text.includes('Status')) {
        info.status = cleanText(text.replace('Status:', '').trim());
      } else if (text.includes('Total Episode')) {
        info.totalEpisode = cleanText(text.replace('Total Episode:', '').trim());
      } else if (text.includes('Durasi')) {
        info.duration = cleanText(text.replace('Durasi:', '').trim());
      } else if (text.includes('Tanggal Rilis')) {
        info.releaseDate = cleanText(text.replace('Tanggal Rilis:', '').trim());
      } else if (text.includes('Studio')) {
        info.studio = cleanText(text.replace('Studio:', '').trim());
      }
    });

    $('.infozingle a[href*="/genres/"], .genrex a[href*="/genres/"]').each((_, el) => {
      const genre = cleanText($(el).text());
      if (genre) info.genre.push(genre);
    });

    info.image = $('.fotoanime img, .thumb img').attr('src') || '';
    info.synopsis = cleanText($('.sinopc, .sinopsis, #sinopsis').text());

    $('.episodelist li, .epslist li').each((_, el) => {
      const $a = $(el).find('a');
      const link = $a.attr('href') || '';
      const title = cleanText($a.text());
      const date = cleanText($(el).find('.zeebr, .date, span').last().text());

      if (link && title && link.includes('/episode/')) {
        info.episodes.push({ title, link, slug: extractSlug(link), date });
      }
    });

    const batchLink = $('a[href*="batch"]').attr('href');
    if (batchLink) {
      info.batch = {
        link: batchLink,
        quality: cleanText($('a[href*="batch"]').text())
      };
    }

    return info;
  },

  // ===================== EPISODE DETAIL =====================
  parseEpisodeDetail(html: string | null): EpisodeDetail | null {
    if (!html) return null;
    const $ = cheerio.load(html);
    const result: EpisodeDetail = {
      title: '',
      download: []
    };

    result.title = cleanText($('.jdlrx h1, h1.title, .posttl').text());
    if (!result.title) return null;

    const animeLink = $('.navig a, .prevnext a[href*="/anime/"]').attr('href') || '';
    result.animeSlug = extractSlug(animeLink);
    result.animeTitle = cleanText($('.navig a, .prevnext a[href*="/anime/"]').text());
    result.image = $('.post-thumbnail img, .thumb img').attr('src') || '';
    result.iframeUrl = $('#embed_holder iframe, .streamiframe iframe, .player iframe').attr('src') || '';

    const downloadMap: Map<string, DownloadQuality> = new Map();

    $('.download ul li, .dl-box li, .downloadlink li, .boxdl li').each((_, el) => {
      const $li = $(el);
      const qualityText = cleanText($li.find('strong, .quality, .res').first().text());
      const quality = qualityText || 'Unknown';
      const servers: DownloadServer[] = [];
      
      $li.find('a').each((_, a) => {
        const link = $(a).attr('href') || '';
        const name = cleanText($(a).text());
        const size = cleanText($li.find('.size').text());
        if (link && name) servers.push({ name, link, size });
      });

      if (servers.length > 0) {
        if (downloadMap.has(quality)) {
          downloadMap.get(quality)!.servers.push(...servers);
        } else {
          downloadMap.set(quality, { quality, servers });
        }
      }
    });

    result.download = Array.from(downloadMap.values());
    return result;
  },

  // ===================== SEARCH RESULTS =====================
  parseSearchResults(html: string | null): PaginatedResult<AnimeInfo> {
    if (!html) return { data: [], pagination: { totalPages: 1, currentPage: 1, nextPage: false } };
    const $ = cheerio.load(html);
    const results: AnimeInfo[] = [];

    $('ul.chivsrc li').each((_, li) => {
      const $li = $(li);
      const $link = $li.find('h2 a');
      const link = $link.attr('href') || '';
      const title = cleanText($link.text());
      const image = $li.find('img').attr('src') || '';
      
      let genre = '';
      let status = '';
      let rating = '';
      
      $li.find('.set').each((_, set) => {
        const text = $(set).text();
        if (text.includes('Genre')) genre = cleanText(text.replace('Genre :', ''));
        else if (text.includes('Status')) status = cleanText(text.replace('Status :', ''));
        else if (text.includes('Rating')) rating = cleanText(text.replace('Rating :', ''));
      });

      if (title && link && link.includes('/anime/')) {
        results.push({
          title, link, slug: extractSlug(link),
          image, genre, status, score: rating
        });
      }
    });

    const currentPage = parseInt($('.pagination .current, .page-numbers.current').text() || '1');
    const hasNextPage = $('.pagination .next, .page-numbers.next').length > 0;
    const totalPages = parseInt($('.pagination .page-numbers').not('.next').not('.prev').last().text()) || 1;

    return {
      data: results,
      pagination: {
        totalPages,
        currentPage: currentPage || 1,
        nextPage: hasNextPage ? (currentPage || 1) + 1 : false
      }
    };
  },

  // ===================== GENRE LIST =====================
  parseGenreList(html: string | null): GenreInfo[] {
    if (!html) return [];
    const $ = cheerio.load(html);
    const genres: GenreInfo[] = [];

    $('a[href*="/genres/"]').each((_, el) => {
      const $el = $(el);
      const link = $el.attr('href') || '';
      const name = cleanText($el.text());
      if (name && link && name.length > 1 && name.length < 30) {
        genres.push({ name, link, slug: extractSlug(link) });
      }
    });

    return genres.filter((genre, index, self) =>
      index === self.findIndex(g => g.slug === genre.slug)
    );
  },

  // ===================== ANIME BY GENRE =====================
  parseAnimeByGenre(html: string | null): PaginatedResult<AnimeInfo> {
    if (!html) return { data: [], pagination: { totalPages: 1, currentPage: 1, nextPage: false } };
    const $ = cheerio.load(html);
    const list: AnimeInfo[] = [];

    $('.col-md-4').each((_, col) => {
      const $col = $(col);
      const $titleLink = $col.find('.col-anime-title a');
      const link = $titleLink.attr('href') || '';
      const title = cleanText($titleLink.text());
      const image = $col.find('.col-anime-cover img, img').attr('src') || '';
      
      if (title && link && link.includes('/anime/')) {
        list.push({
          title, link, slug: extractSlug(link), image,
          studio: cleanText($col.find('.col-anime-studio').text()),
          episode: cleanText($col.find('.col-anime-eps').text()),
          score: cleanText($col.find('.col-anime-rating').text()),
          genre: cleanText($col.find('.col-anime-genre').text()),
          synopsis: cleanText($col.find('.col-synopsis p').text()),
          uploadedAt: cleanText($col.find('.col-anime-date').text())
        });
      }
    });

    const currentPage = parseInt($('.pagination .current, .page-numbers.current').text() || '1');
    const hasNextPage = $('.pagination .next, .page-numbers.next').length > 0;
    const totalPages = parseInt($('.pagination .page-numbers').not('.next').not('.prev').last().text()) || 1;

    return {
      data: list,
      pagination: {
        totalPages,
        currentPage: currentPage || 1,
        nextPage: hasNextPage ? (currentPage || 1) + 1 : false
      }
    };
  },

  // ===================== SCHEDULE =====================
  parseSchedule(html: string | null): ScheduleInfo[] {
    if (!html) return [];
    const $ = cheerio.load(html);
    const schedule: ScheduleInfo[] = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    $('.kgjdwl3, .jadwal, .schedule, .kglist2').each((_, section) => {
      const $section = $(section);
      const dayTitle = cleanText($section.find('h2').text());
      const day = dayNames.find(d => dayTitle.toLowerCase().includes(d.toLowerCase()));
      
      if (day) {
        const anime: AnimeInfo[] = [];
        $section.find('li a, .anime-item a').each((_, a) => {
          const link = $(a).attr('href') || '';
          const title = cleanText($(a).text());
          if (title && link) anime.push({ title, link, slug: extractSlug(link) });
        });
        if (anime.length > 0) schedule.push({ day, anime });
      }
    });

    return schedule;
  },

  // ===================== BATCH DETAIL =====================
  parseBatchDetail(html: string | null): { title: string; download: DownloadQuality[] } {
    if (!html) return { title: '', download: [] };
    const $ = cheerio.load(html);
    const result = { title: '', download: [] as DownloadQuality[] };

    result.title = cleanText($('.jdlrx h1, h1.title').text());
    const downloadMap: Map<string, DownloadQuality> = new Map();

    $('.download ul li, .dl-box li').each((_, el) => {
      const $li = $(el);
      const quality = cleanText($li.find('strong').text()) || 'Unknown';
      const servers: DownloadServer[] = [];
      $li.find('a').each((_, a) => {
        const link = $(a).attr('href') || '';
        const name = cleanText($(a).text());
        if (link && name) servers.push({ name, link });
      });
      if (servers.length > 0) downloadMap.set(quality, { quality, servers });
    });

    result.download = Array.from(downloadMap.values());
    return result;
  },

  // ===================== SERVER LIST =====================
  parseServerList(html: string | null): ServerList {
    if (!html) return { title: '', qualities: [] };
    const $ = cheerio.load(html);
    const result: ServerList = { title: cleanText($('.jdlrx h1, h1.title, .posttl').text()), qualities: [] };
    const qualityMap: Map<string, ServerInfo[]> = new Map();

    $('.mirrorstream ul').each((_, ul) => {
      const $ul = $(ul);
      const ulClass = $ul.attr('class') || '';
      const qualityMatch = ulClass.match(/m(\d+p)/);
      const quality = qualityMatch ? qualityMatch[1] : ulClass.replace('m', '');
      const servers: ServerInfo[] = [];

      $ul.find('li a[data-content]').each((idx, a) => {
        const $a = $(a);
        const name = cleanText($a.text());
        const dataContent = $a.attr('data-content') || '';

        if (name && dataContent) {
          const decoded = decodeBase64(dataContent);
          let serverId = `${name.toLowerCase()}-${quality}-${idx}`;
          try {
            const parsed = JSON.parse(decoded);
            if (parsed.id && parsed.i !== undefined) {
              serverId = `${name.toLowerCase()}-${parsed.id}-${parsed.i}`;
            }
          } catch {}
          servers.push({ name, serverId, dataContent });
        }
      });
      if (servers.length > 0) qualityMap.set(quality, servers);
    });

    result.qualities = Array.from(qualityMap.entries()).map(([quality, servers]) => ({ quality, servers }));
    return result;
  }
};
