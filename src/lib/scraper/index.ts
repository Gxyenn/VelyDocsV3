import * as cheerio from 'cheerio';

// ===================== TYPES =====================
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
  iframeUrl?: string; // Main player iframe
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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================== FETCH HTML =====================
export async function fetchHtml(url: string): Promise<string | null> {
  try {
    // Random delay between 500ms and 1500ms to mimic human behavior
    await delay(500 + Math.random() * 1000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

// ===================== FETCH IFRAME URL =====================
let cachedNonce: string | null = null;

export async function fetchIframeUrl(dataContent: string): Promise<string | null> {
  try {
    const ajaxUrl = `${OtakudesuScraper.baseUrl}/wp-admin/admin-ajax.php`;
    
    // Get nonce if not cached
    if (!cachedNonce) {
      const nonceFormData = new URLSearchParams();
      nonceFormData.append('action', 'aa1208d27f29ca340c92c66d1926f13f');
      
      const nonceResponse = await fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': OtakudesuScraper.baseUrl,
          'Referer': OtakudesuScraper.baseUrl,
        },
        body: nonceFormData.toString(),
      });
      
      const nonceData = await nonceResponse.json() as { data?: string };
      if (nonceData.data) {
        cachedNonce = nonceData.data;
      }
    }
    
    if (!cachedNonce) {
      return null;
    }
    
    // Parse data-content to get id, i, q
    const decodedData = JSON.parse(decodeBase64(dataContent));
    
    // Get iframe
    const iframeFormData = new URLSearchParams();
    iframeFormData.append('action', '2a3505c93b0035d3f455df82bf976b84');
    iframeFormData.append('nonce', cachedNonce);
    iframeFormData.append('id', String(decodedData.id));
    iframeFormData.append('i', String(decodedData.i));
    iframeFormData.append('q', String(decodedData.q));
    
    const iframeResponse = await fetch(ajaxUrl, {
      method: 'POST',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': OtakudesuScraper.baseUrl,
        'Referer': OtakudesuScraper.baseUrl,
      },
      body: iframeFormData.toString(),
    });
    
    const iframeData = await iframeResponse.json() as { data?: string };
    if (iframeData.data) {
      // The response is base64 encoded HTML with iframe
      const html = decodeBase64(iframeData.data);
      // Extract src from iframe
      const srcMatch = html.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        return srcMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching iframe URL:', error);
    return null;
  }
}

// ===================== OTAKUDESU SCRAPER =====================
export const OtakudesuScraper = {
  baseUrl: 'https://otakudesu.best',

  // ===================== HOME PAGE =====================
  parseHome(html: string): { ongoing: AnimeInfo[]; complete: AnimeInfo[] } {
    const $ = cheerio.load(html);
    const ongoing: AnimeInfo[] = [];
    const complete: AnimeInfo[] = [];
    
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'random'];

    // Parse each section - support multiple selectors
    $('.rseries, .rapi, .venz').each((_, section) => {
      const $section = $(section);
      
      $section.find('.detpost').each((_, el) => {
        const $el = $(el);
        const link = $el.find('.thumb a').attr('href') || '';
        const title = cleanText($el.find('.jdlflm').text());
        
        // Episode - extract number from "Episode X"
        const epText = cleanText($el.find('.epz').text());
        const episode = extractNumber(epText);
        
        // Day or Score
        const dayOrScore = cleanText($el.find('.epztipe').text());
        
        // Date uploaded
        const uploadedAt = cleanText($el.find('.newnime').text());
        
        // Image
        const image = $el.find('.thumb img').attr('src') || '';

        if (title && link) {
          const animeInfo: AnimeInfo = {
            title,
            link,
            slug: extractSlug(link),
            episode,
            image,
            uploadedAt
          };

          // Determine if ongoing (has day name) or complete (has score)
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

    // If still empty, try more generic selectors
    if (ongoing.length === 0 && complete.length === 0) {
      $('.detpost').each((_, el) => {
        const $el = $(el);
        const link = $el.find('a').first().attr('href') || '';
        const title = cleanText($el.find('h2, .jdlflm').text());
        if (title && link && link.includes('/anime/')) {
          const info: AnimeInfo = {
            title,
            link,
            slug: extractSlug(link),
            image: $el.find('img').attr('src')
          };
          // Heuristic: if it has "Episode", it's likely ongoing
          if ($el.text().includes('Episode')) ongoing.push(info);
          else complete.push(info);
        }
      });
    }

    return { ongoing, complete };
  },

  // ===================== ANIME LIST WITH PAGINATION =====================
  parseAnimeList(html: string): PaginatedResult<AnimeInfo> {
    const $ = cheerio.load(html);
    const list: AnimeInfo[] = [];

    // Parse anime list
    $('.venz .detpost, .col-md-4 .detpost, .archive .detpost').each((_, el) => {
      const $el = $(el);
      const link = $el.find('.thumb a').attr('href') || '';
      const title = cleanText($el.find('.jdlflm').text());
      const image = $el.find('.thumb img').attr('src') || '';
      
      // Try to get episode count or status
      const epText = cleanText($el.find('.epz').text());
      const episode = extractNumber(epText);

      if (title && link && link.includes('/anime/')) {
        list.push({
          title,
          link,
          slug: extractSlug(link),
          episode,
          image
        });
      }
    });

    // If above selector didn't work, try alternative
    if (list.length === 0) {
      $('a[href*="/anime/"]').each((_, el) => {
        const $el = $(el);
        const link = $el.attr('href') || '';
        const title = cleanText($el.find('h4, h2, .jdlflm').text() || $el.text());
        
        if (title && link && link.includes('/anime/') && !link.includes('page') && title.length > 2) {
          list.push({
            title,
            link,
            slug: extractSlug(link)
          });
        }
      });
    }

    // Remove duplicates
    const uniqueList = list.filter((anime, index, self) =>
      index === self.findIndex(a => a.slug === anime.slug)
    );

    // Check pagination
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
  parseAnimeDetail(html: string): AnimeDetail {
    const $ = cheerio.load(html);
    const info: AnimeDetail = {
      title: '',
      genre: [],
      episodes: []
    };

    // Title
    info.title = cleanText($('.jdlrx h1').text()) || cleanText($('h1').first().text());

    // Parse info from infozingle
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

    // Genres
    $('.infozingle a[href*="/genres/"], .genrex a[href*="/genres/"]').each((_, el) => {
      const genre = cleanText($(el).text());
      if (genre) info.genre.push(genre);
    });

    // Image
    info.image = $('.fotoanime img, .thumb img').attr('src') || '';

    // Synopsis
    info.synopsis = cleanText($('.sinopc, .sinopsis, #sinopsis').text());

    // Episodes
    $('.episodelist li, .epslist li').each((_, el) => {
      const $a = $(el).find('a');
      const link = $a.attr('href') || '';
      const title = cleanText($a.text());
      const date = cleanText($(el).find('.zeebr, .date, span').last().text());

      if (link && title && link.includes('/episode/')) {
        info.episodes.push({
          title,
          link,
          slug: extractSlug(link),
          date
        });
      }
    });

    // Batch link
    const batchLink = $('a[href*="batch"]').attr('href');
    if (batchLink) {
      info.batch = {
        link: batchLink,
        quality: cleanText($('a[href*="batch"]').text())
      };
    }

    return info;
  },

  // ===================== EPISODE DETAIL WITH MAXIMAL STREAMING =====================
  parseEpisodeDetail(html: string): EpisodeDetail {
    const $ = cheerio.load(html);
    const result: EpisodeDetail = {
      title: '',
      download: []
    };

    // Title
    result.title = cleanText($('.jdlrx h1, h1.title, .posttl').text());

    // Anime title and slug
    const animeLink = $('.navig a, .prevnext a[href*="/anime/"]').attr('href') || '';
    result.animeSlug = extractSlug(animeLink);
    result.animeTitle = cleanText($('.navig a, .prevnext a[href*="/anime/"]').text());

    // Image
    result.image = $('.post-thumbnail img, .thumb img').attr('src') || '';

    // ===================== MAIN IFRAME PLAYER (Default) =====================
    const mainIframe = $('#embed_holder iframe, .streamiframe iframe, .player iframe').attr('src') || '';
    result.iframeUrl = mainIframe;

    // ===================== DOWNLOAD LINKS =====================
    const downloadMap: Map<string, DownloadQuality> = new Map();

    // Parse download links - multiple patterns
    $('.download ul li, .dl-box li, .downloadlink li, .boxdl li').each((_, el) => {
      const $li = $(el);
      
      // Get quality (360p, 480p, 720p, etc.)
      const qualityText = cleanText($li.find('strong, .quality, .res').first().text());
      const quality = qualityText || 'Unknown';

      // Get all download servers for this quality
      const servers: DownloadServer[] = [];
      
      $li.find('a').each((_, a) => {
        const link = $(a).attr('href') || '';
        const name = cleanText($(a).text());
        const size = cleanText($li.find('.size').text());

        if (link && name) {
          servers.push({
            name,
            link,
            size
          });
        }
      });

      if (servers.length > 0) {
        if (downloadMap.has(quality)) {
          const existing = downloadMap.get(quality)!;
          existing.servers.push(...servers);
        } else {
          downloadMap.set(quality, { quality, servers });
        }
      }
    });

    // Alternative: Look for download table structure
    if (downloadMap.size === 0) {
      $('.download table tr, .dl-table tr').each((_, tr) => {
        const $tr = $(tr);
        const quality = cleanText($tr.find('td').first().text()) || 'Unknown';
        const servers: DownloadServer[] = [];

        $tr.find('a').each((_, a) => {
          const link = $(a).attr('href') || '';
          const name = cleanText($(a).text());
          if (link && name) {
            servers.push({ name, link });
          }
        });

        if (servers.length > 0) {
          downloadMap.set(quality, { quality, servers });
        }
      });
    }

    // Alternative: Simple link parsing
    if (downloadMap.size === 0) {
      let currentQuality = 'Unknown';
      
      $('.download, .dl-box').find('*').each((_, el) => {
        const $el = $(el);
        
        // Check if this is a quality header
        if ($el.is('strong, h4, h5')) {
          const text = cleanText($el.text());
          if (text.match(/\d+p/) || text.toLowerCase().includes('mp4') || text.toLowerCase().includes('mkv')) {
            currentQuality = text;
            if (!downloadMap.has(currentQuality)) {
              downloadMap.set(currentQuality, { quality: currentQuality, servers: [] });
            }
          }
        }
        
        // Check if this is a link
        if ($el.is('a')) {
          const link = $el.attr('href') || '';
          const name = cleanText($el.text());
          
          if (link && name && (link.includes('drive.google') || link.includes('mega.nz') || 
              link.includes('mediafire') || link.includes('mp4upload') || link.includes('zippyshare') ||
              link.includes('acefile') || link.includes('pixeldrain') || link.includes('solidfiles'))) {
            
            if (!downloadMap.has(currentQuality)) {
              downloadMap.set(currentQuality, { quality: currentQuality, servers: [] });
            }
            downloadMap.get(currentQuality)!.servers.push({ name, link });
          }
        }
      });
    }

    result.download = Array.from(downloadMap.values());

    return result;
  },

  // ===================== SEARCH WITH PAGINATION (FIXED) =====================
  parseSearchResults(html: string): PaginatedResult<AnimeInfo> {
    const $ = cheerio.load(html);
    const results: AnimeInfo[] = [];

    // Parse from ul.chivsrc li structure (actual Otakudesu search structure)
    $('ul.chivsrc li').each((_, li) => {
      const $li = $(li);
      
      // Get the anime link from h2 a
      const $link = $li.find('h2 a');
      const link = $link.attr('href') || '';
      const title = cleanText($link.text());
      
      // Get image
      const image = $li.find('img').attr('src') || '';
      
      // Get other details from the list
      let genre = '';
      let status = '';
      let rating = '';
      
      // Find the set elements which contain metadata
      $li.find('.set').each((_, set) => {
        const text = $(set).text();
        if (text.includes('Genre')) {
          genre = cleanText(text.replace('Genre :', ''));
        } else if (text.includes('Status')) {
          status = cleanText(text.replace('Status :', ''));
        } else if (text.includes('Rating')) {
          rating = cleanText(text.replace('Rating :', ''));
        }
      });

      if (title && link && link.includes('/anime/')) {
        results.push({
          title,
          link,
          slug: extractSlug(link),
          image,
          genre,
          status,
          score: rating
        });
      }
    });

    // Alternative: Try other selectors if above doesn't work
    if (results.length === 0) {
      // Try direct link extraction
      $('a[href*="/anime/"]').each((_, el) => {
        const $el = $(el);
        const link = $el.attr('href') || '';
        
        // Check if this is in a search result context
        const $parent = $el.closest('li');
        if ($parent.length > 0 && link.includes('/anime/')) {
          const title = cleanText($el.text()) || cleanText($parent.find('h2, h3, h4').text());
          const image = $parent.find('img').attr('src') || '';
          
          if (title && title.length > 2 && !results.find(r => r.link === link)) {
            results.push({
              title,
              link,
              slug: extractSlug(link),
              image
            });
          }
        }
      });
    }

    // Check pagination
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
  parseGenreList(html: string): GenreInfo[] {
    const $ = cheerio.load(html);
    const genres: GenreInfo[] = [];

    $('a[href*="/genres/"]').each((_, el) => {
      const $el = $(el);
      const link = $el.attr('href') || '';
      const name = cleanText($el.text());

      if (name && link && name.length > 1 && name.length < 30) {
        genres.push({
          name,
          link,
          slug: extractSlug(link)
        });
      }
    });

    // Remove duplicates
    return genres.filter((genre, index, self) =>
      index === self.findIndex(g => g.slug === genre.slug)
    );
  },

  // ===================== ANIME BY GENRE WITH PAGINATION (FIXED) =====================
  parseAnimeByGenre(html: string): PaginatedResult<AnimeInfo> {
    const $ = cheerio.load(html);
    const list: AnimeInfo[] = [];

    // Parse from .col-md-4 > .col-anime structure (actual Otakudesu genre structure)
    $('.col-md-4').each((_, col) => {
      const $col = $(col);
      
      // Get title and link from .col-anime-title a
      const $titleLink = $col.find('.col-anime-title a');
      const link = $titleLink.attr('href') || '';
      const title = cleanText($titleLink.text());
      
      // Get image from .col-anime-cover img
      const image = $col.find('.col-anime-cover img, img').attr('src') || '';
      
      // Get studio
      const studio = cleanText($col.find('.col-anime-studio').text());
      
      // Get episode count
      const episode = cleanText($col.find('.col-anime-eps').text());
      
      // Get rating
      const rating = cleanText($col.find('.col-anime-rating').text());
      
      // Get genres
      const genre = cleanText($col.find('.col-anime-genre').text());
      
      // Get synopsis
      const synopsis = cleanText($col.find('.col-synopsis p').text());
      
      // Get release date
      const releaseDate = cleanText($col.find('.col-anime-date').text());

      if (title && link && link.includes('/anime/')) {
        list.push({
          title,
          link,
          slug: extractSlug(link),
          image,
          studio,
          episode,
          score: rating,
          genre,
          synopsis,
          uploadedAt: releaseDate
        });
      }
    });

    // Check pagination
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
  parseSchedule(html: string): ScheduleInfo[] {
    const $ = cheerio.load(html);
    const schedule: ScheduleInfo[] = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    // Find schedule container
    $('.kgjdwl3, .jadwal, .schedule').each((_, section) => {
      const $section = $(section);
      const dayTitle = cleanText($section.find('h2').text());
      
      // Find which day
      const day = dayNames.find(d => dayTitle.toLowerCase().includes(d.toLowerCase()));
      
      if (day) {
        const anime: AnimeInfo[] = [];
        
        $section.find('li a, .anime-item a').each((_, a) => {
          const link = $(a).attr('href') || '';
          const title = cleanText($(a).text());

          if (title && link) {
            anime.push({
              title,
              link,
              slug: extractSlug(link)
            });
          }
        });

        if (anime.length > 0) {
          schedule.push({ day, anime });
        }
      }
    });

    // Alternative parsing
    if (schedule.length === 0) {
      dayNames.forEach(day => {
        const dayLower = day.toLowerCase();
        const dayRegex = new RegExp(`<h2[^>]*>${day}</h2>`, 'i');
        
        if (dayRegex.test(html)) {
          // Find content after this day header
          const $daySection = $(`h2:contains("${day}")`).parent();
          const anime: AnimeInfo[] = [];
          
          $daySection.find('li a, ul a').each((_, a) => {
            const link = $(a).attr('href') || '';
            const title = cleanText($(a).text());

            if (title && link) {
              anime.push({
                title,
                link,
                slug: extractSlug(link)
              });
            }
          });

          if (anime.length > 0) {
            schedule.push({ day, anime });
          }
        }
      });
    }

    // Another alternative - look for kglist2
    if (schedule.length === 0) {
      $('.kglist2').each((_, el) => {
        const $el = $(el);
        const dayTitle = cleanText($el.find('h2').text());
        const day = dayNames.find(d => dayTitle.toLowerCase().includes(d.toLowerCase()));
        
        if (day) {
          const anime: AnimeInfo[] = [];
          
          $el.find('li a').each((_, a) => {
            const link = $(a).attr('href') || '';
            const title = cleanText($(a).text());

            if (title && link) {
              anime.push({
                title,
                link,
                slug: extractSlug(link)
              });
            }
          });

          if (anime.length > 0) {
            schedule.push({ day, anime });
          }
        }
      });
    }

    return schedule;
  },

  // ===================== BATCH DETAIL =====================
  parseBatchDetail(html: string): { title: string; download: DownloadQuality[] } {
    const $ = cheerio.load(html);
    const result = {
      title: '',
      download: [] as DownloadQuality[]
    };

    result.title = cleanText($('.jdlrx h1, h1.title').text());

    const downloadMap: Map<string, DownloadQuality> = new Map();

    // Parse batch download links
    $('.download ul li, .dl-box li').each((_, el) => {
      const $li = $(el);
      const quality = cleanText($li.find('strong').text()) || 'Unknown';
      const servers: DownloadServer[] = [];

      $li.find('a').each((_, a) => {
        const link = $(a).attr('href') || '';
        const name = cleanText($(a).text());

        if (link && name) {
          servers.push({ name, link });
        }
      });

      if (servers.length > 0) {
        downloadMap.set(quality, { quality, servers });
      }
    });

    result.download = Array.from(downloadMap.values());

    return result;
  },

  // ===================== SERVER LIST (Stream Servers by Quality) =====================
  parseServerList(html: string): ServerList {
    const $ = cheerio.load(html);
    
    const result: ServerList = {
      title: '',
      qualities: []
    };

    // Title
    result.title = cleanText($('.jdlrx h1, h1.title, .posttl').text());

    // Parse from .mirrorstream ul lists
    const qualityMap: Map<string, ServerInfo[]> = new Map();

    $('.mirrorstream ul').each((_, ul) => {
      const $ul = $(ul);
      const ulClass = $ul.attr('class') || '';

      // Extract quality from class (m360p -> 360p, m480p -> 480p)
      const qualityMatch = ulClass.match(/m(\d+p)/);
      const quality = qualityMatch ? qualityMatch[1] : ulClass.replace('m', '');

      const servers: ServerInfo[] = [];

      $ul.find('li a[data-content]').each((idx, a) => {
        const $a = $(a);
        const name = cleanText($a.text());
        const dataContent = $a.attr('data-content') || '';

        if (name && dataContent) {
          // Generate server ID from decoded content
          const decoded = decodeBase64(dataContent);
          let serverId = `${name.toLowerCase()}-${quality}-${idx}`;

          // Try to extract ID from decoded JSON
          try {
            const parsed = JSON.parse(decoded);
            if (parsed.id && parsed.i !== undefined) {
              serverId = `${name.toLowerCase()}-${parsed.id}-${parsed.i}`;
            }
          } catch {
            // Use default serverId
          }

          servers.push({
            name,
            serverId,
            dataContent
          });
        }
      });

      if (servers.length > 0) {
        qualityMap.set(quality, servers);
      }
    });

    // Convert to array
    result.qualities = Array.from(qualityMap.entries()).map(([quality, servers]) => ({
      quality,
      servers
    }));

    return result;
  }
};
