import * as cheerio from 'cheerio';
const cloudscraper = require('cloudscraper');

// ===================== TYPES & INTERFACES =====================
export interface ScraperResponse<T = any> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
}

// ... (Interface lainnya tetap sama seperti sebelumnya)
export interface AnimeInfo { title: string; link: string; slug: string; episode?: string; day?: string; score?: string; image?: string; uploadedAt?: string; }
export interface PaginatedResult<T> { data: T[]; pagination: any; }

// ===================== CONFIGURATION =====================
const OTAKUDESU_MIRRORS = [
  'https://otakudesu.cloud',
  'https://otakudesu.cam',
  'https://otakudesu.ltd',
  'https://otakudesu.tube',
  'https://otakudesu.best'
];

// Public Proxy untuk bypass jika IP Vercel/Netlify kena Block
const PUBLIC_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?url=',
  '' // Kosong artinya direct
];

// ===================== UTILITIES =====================
function cleanText(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractSlug(url: string): string {
  if (!url) return '';
  const parts = url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || '';
}

function decodeBase64(str: string): string {
  try { return Buffer.from(str, 'base64').toString('utf-8'); } catch { return str; }
}

// ===================== THE ULTIMATE FETCH (ANTI-BLOCK) =====================
export async function fetchHtml(urlPath: string): Promise<ScraperResponse<string>> {
  const path = urlPath.replace(/https?:\/\/[^\/]+/, '');
  let lastError: any = null;

  // Algoritma: Coba setiap Mirror x Coba setiap Proxy
  for (const baseUrl of OTAKUDESU_MIRRORS) {
    for (const proxy of PUBLIC_PROXIES) {
      try {
        const targetUrl = `${baseUrl}${path}`;
        const finalUrl = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
        
        const response = await cloudscraper({
          uri: finalUrl,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': baseUrl + '/',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 6000,
          jar: true
        });

        // Jika lewat AllOrigins, data ada di field 'contents'
        let html = response;
        if (proxy.includes('allorigins')) {
          const parsed = JSON.parse(response);
          html = parsed.contents;
        }

        if (html && html.length > 500 && !html.includes('Attention Required')) {
          return { 
            status: 'success', 
            data: html, 
            message: `Success via ${baseUrl} ${proxy ? '(Proxy)' : '(Direct)'}` 
          };
        }
      } catch (error: any) {
        lastError = error;
        continue; // Coba kombinasi berikutnya
      }
    }
  }

  return { 
    status: 'error', 
    data: null, 
    message: `Anti-Block System Gagal. Cloudflare terlalu kuat. Error: ${lastError?.message}` 
  };
}

// ===================== OTAKUDESU SCRAPER METHODS =====================
export const OtakudesuScraper = {
  baseUrl: OTAKUDESU_MIRRORS[0],

  parseHome(html: string | null) {
    if (!html) return { ongoing: [], complete: [] };
    const $ = cheerio.load(html);
    const ongoing: any[] = [];
    const complete: any[] = [];
    $('.detpost').each((_, el) => {
      const link = $(el).find('.thumb a').attr('href') || '';
      const info = {
        title: cleanText($(el).find('.jdlflm').text()),
        link, slug: extractSlug(link),
        image: $(el).find('.thumb img').attr('src'),
        episode: $(el).find('.epz').text().trim(),
        uploadedAt: $(el).find('.newnime').text().trim()
      };
      const type = $(el).find('.epztipe').text().toLowerCase();
      if (type.match(/senin|selasa|rabu|kamis|jumat|sabtu|minggu/i)) ongoing.push(info);
      else complete.push(info);
    });
    return { ongoing, complete };
  },

  parseAnimeList(html: string | null) {
    const $ = cheerio.load(html || '');
    const list: any[] = [];
    $('.detpost').each((_, el) => {
      const link = $(el).find('.thumb a').attr('href') || '';
      list.push({ title: cleanText($(el).find('.jdlflm').text()), slug: extractSlug(link), image: $(el).find('.thumb img').attr('src') });
    });
    return { data: list, pagination: { totalPages: 1, currentPage: 1, nextPage: false } };
  },

  parseAnimeDetail(html: string | null) {
    const $ = cheerio.load(html || '');
    const info: any = { 
        title: cleanText($('.jdlrx h1').text()), 
        genre: [], 
        episodes: [],
        image: $('.fotoanime img').attr('src'),
        synopsis: cleanText($('.sinopc').text())
    };
    $('.infozingle p').each((_, el) => {
      const t = $(el).text();
      if (t.includes('Skor')) info.score = cleanText(t.replace('Skor:', ''));
      if (t.includes('Status')) info.status = cleanText(t.replace('Status:', ''));
      if (t.includes('Studio')) info.studio = cleanText(t.replace('Studio:', ''));
    });
    $('.episodelist li').each((_, el) => {
      const a = $(el).find('a');
      info.episodes.push({ title: cleanText(a.text()), slug: extractSlug(a.attr('href') || ''), date: $(el).find('.zeebr').text() });
    });
    return info;
  },

  parseEpisodeDetail(html: string | null) {
    const $ = cheerio.load(html || '');
    const res: any = { 
        title: cleanText($('.jdlrx h1').text()), 
        iframeUrl: $('#embed_holder iframe').attr('src'),
        download: [] 
    };
    $('.download ul li').each((_, el) => {
      const servers: any[] = [];
      $(el).find('a').each((_, a) => { servers.push({ name: cleanText($(a).text()), link: $(a).attr('href') }); });
      res.download.push({ quality: cleanText($(el).find('strong').text()), servers });
    });
    return res;
  },

  parseSearchResults(html: string | null) {
    const $ = cheerio.load(html || '');
    const results: any[] = [];
    $('ul.chivsrc li').each((_, li) => {
      const a = $(li).find('h2 a');
      results.push({ title: cleanText(a.text()), slug: extractSlug(a.attr('href') || ''), image: $(li).find('img').attr('src') });
    });
    return { data: results, pagination: { totalPages: 1, currentPage: 1, nextPage: false } };
  },

  parseGenreList(html: string | null) {
    const $ = cheerio.load(html || '');
    const genres: any[] = [];
    $('a[href*="/genres/"]').each((_, el) => { genres.push({ name: cleanText($(el).text()), slug: extractSlug($(el).attr('href') || '') }); });
    return genres;
  },

  parseSchedule(html: string | null) {
    const $ = cheerio.load(html || '');
    const schedule: any[] = [];
    $('.kgjdwl3').each((_, el) => {
      const anime: any[] = [];
      $(el).find('li a').each((_, a) => { anime.push({ title: cleanText($(a).text()), slug: extractSlug($(a).attr('href') || '') }); });
      schedule.push({ day: cleanText($(el).find('h2').text()), anime });
    });
    return schedule;
  },

  parseServerList(html: string | null) {
    const $ = cheerio.load(html || '');
    const result: any = { qualities: [] };
    $('.mirrorstream ul').each((_, ul) => {
      const servers: any[] = [];
      $(ul).find('li a').each((_, a) => { servers.push({ name: cleanText($(a).text()), dataContent: $(a).attr('data-content') }); });
      result.qualities.push({ quality: $(ul).attr('class')?.replace('m', ''), servers });
    });
    return result;
  }
};

export async function fetchIframeUrl(dataContent: string): Promise<ScraperResponse<string>> {
    // Iframe fetcher tetap menggunakan mirror pertama
    try {
        const ajaxUrl = `${OTAKUDESU_MIRRORS[0]}/wp-admin/admin-ajax.php`;
        const decodedData = JSON.parse(decodeBase64(dataContent));
        const nonceRes = await cloudscraper({ uri: ajaxUrl, method: 'POST', formData: { action: 'aa1208d27f29ca340c92c66d1926f13f' }, jar: true });
        const nonceData = JSON.parse(nonceRes);
        const iframeRes = await cloudscraper({
            uri: ajaxUrl,
            method: 'POST',
            formData: { action: '2a3505c93b0035d3f455df82bf976b84', nonce: nonceData.data, id: decodedData.id, i: decodedData.i, q: decodedData.q },
            jar: true
        });
        const iframeData = JSON.parse(iframeRes);
        const html = decodeBase64(iframeData.data);
        const srcMatch = html.match(/src=["']([^"']+)["']/);
        return srcMatch ? { status: 'success', data: srcMatch[1], message: 'OK' } : { status: 'error', data: null, message: 'No src' };
    } catch (e: any) {
        return { status: 'error', data: null, message: e.message };
    }
}
