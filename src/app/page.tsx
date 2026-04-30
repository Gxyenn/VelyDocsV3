'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Copy, 
  ExternalLink, 
  Search, 
  ChevronDown, 
  Terminal,
  BookOpen,
  Zap,
  Globe,
  Check,
  X,
  Loader2,
  Moon,
  Sun,
  Menu,
  X as XIcon,
  Database,
  Tv,
  Calendar,
  Film,
  SearchCode,
  Tag,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// API Endpoints Data
const apiEndpoints = {
  otakudesu: {
    name: 'Otakudesu',
    icon: '🎬',
    baseUrl: 'https://otakudesu.cloud',
    description: 'Situs streaming dan download anime subtitle Indonesia',
    endpoints: [
      {
        name: 'Home',
        path: '/api/otakudesu/home',
        method: 'GET',
        description: 'Mendapatkan data anime home page (ongoing & complete)',
        params: [],
        icon: Database,
        exampleResponse: {
          status: 'success',
          data: {
            ongoing: [
              { title: 'Medalist Season 2', episode: '5', day: 'Minggu', slug: 'medalist-s2-sub-indo' }
            ],
            complete: [
              { title: 'Towa no Yuugure', episode: '12', score: '6.52', slug: 'towa-yuugure-sub-indo' }
            ]
          }
        }
      },
      {
        name: 'Anime List',
        path: '/api/otakudesu/anime-list',
        method: 'GET',
        description: 'Mendapatkan daftar semua anime dengan pagination',
        params: [
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' }
        ],
        icon: Film,
        exampleResponse: {
          status: 'success',
          pagination: { currentPage: 1, hasNextPage: true, totalPages: 50 },
          data: [
            { title: 'Medalist Season 2', slug: 'medalist-s2-sub-indo', episode: '5' }
          ]
        }
      },
      {
        name: 'Ongoing Anime',
        path: '/api/otakudesu/ongoing',
        method: 'GET',
        description: 'Mendapatkan daftar anime yang sedang berlangsung',
        params: [
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' }
        ],
        icon: Tv,
        exampleResponse: {
          status: 'success',
          data: [
            { title: 'Medalist Season 2', episode: '5', day: 'Minggu', slug: 'medalist-s2-sub-indo' }
          ]
        }
      },
      {
        name: 'Complete Anime',
        path: '/api/otakudesu/complete',
        method: 'GET',
        description: 'Mendapatkan daftar anime yang sudah tamat',
        params: [
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' }
        ],
        icon: Database,
        exampleResponse: {
          status: 'success',
          data: [
            { title: 'Towa no Yuugure', episode: '12', score: '6.52', slug: 'towa-yuugure-sub-indo' }
          ]
        }
      },
      {
        name: 'Anime Detail',
        path: '/api/otakudesu/anime/{slug}',
        method: 'GET',
        description: 'Mendapatkan detail anime berdasarkan slug, termasuk daftar episode',
        params: [
          { name: 'slug', type: 'string', required: true, description: 'Slug anime (contoh: medalist-s2-sub-indo)' }
        ],
        icon: Film,
        exampleResponse: {
          status: 'success',
          data: {
            title: 'Medalist Season 2',
            japanese: 'メダリスト 第2期',
            score: '7.64',
            producer: 'Kadokawa',
            type: 'TV',
            status: 'Ongoing',
            totalEpisode: '9',
            duration: '23 min. per ep.',
            releaseDate: 'Jan 25, 2026',
            studio: 'ENGI',
            genre: ['Drama', 'Seinen', 'Sports'],
            episodes: [
              { title: 'Episode 5', slug: 'mdl-s2-episode-5-sub-indo', date: '22 Februari, 2026' }
            ]
          }
        }
      },
      {
        name: 'Episode Detail',
        path: '/api/otakudesu/episode/{slug}',
        method: 'GET',
        description: 'Mendapatkan link streaming (iframe default) dan download dengan resolusi/server',
        params: [
          { name: 'slug', type: 'string', required: true, description: 'Slug episode (contoh: mdl-s2-episode-5-sub-indo)' }
        ],
        icon: Play,
        exampleResponse: {
          status: 'success',
          data: {
            title: 'Medalist Season 2 Episode 5 Subtitle Indonesia',
            animeTitle: 'Medalist Season 2',
            animeSlug: 'medalist-s2-sub-indo',
            iframeUrl: 'https://desustream.info/dstream/updesu/v5/index.php?id=...',
            download: [
              { quality: 'Mp4 360p', servers: [{ name: 'ODFiles', link: 'https://otakufiles.net/...' }, { name: 'Pdrain', link: 'https://pixeldrain.com/...' }] },
              { quality: 'Mp4 480p', servers: [{ name: 'Mega', link: 'https://mega.nz/...' }, { name: 'GoFile', link: 'https://gofile.io/...' }] },
              { quality: 'Mp4 720p', servers: [{ name: 'KFiles', link: 'https://krakenfiles.com/...' }] },
              { quality: 'MKV 720p', servers: [{ name: 'Mega', link: 'https://mega.nz/...' }] },
              { quality: 'MKV 1080p', servers: [{ name: 'Acefile', link: 'https://acefile.co/...' }] }
            ]
          }
        }
      },
      {
        name: 'Stream Servers',
        path: '/api/otakudesu/servers/{slug}',
        method: 'GET',
        description: 'Mendapatkan daftar semua server streaming per resolusi dengan id dan dataContent',
        params: [
          { name: 'slug', type: 'string', required: true, description: 'Slug episode (contoh: mdl-s2-episode-5-sub-indo)' }
        ],
        icon: Play,
        exampleResponse: {
          status: 'success',
          data: {
            title: 'Medalist Season 2 Episode 5 Subtitle Indonesia',
            qualities: [
              {
                quality: '360p',
                servers: [
                  { name: 'vidhide', serverId: 'vidhide-193551-0', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://odvidhide.com/embed/v9z9gpi9bzaj' },
                  { name: 'filedon', serverId: 'filedon-193551-1', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://filedon.co/embed/WvXGojiBBr' }
                ]
              },
              {
                quality: '480p',
                servers: [
                  { name: 'updesu', serverId: 'updesu-193551-0', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://desustream.info/dstream/updesu/v5/index.php?id=...' },
                  { name: 'mega', serverId: 'mega-193551-3', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://mega.nz/embed/LtZkxZDA#...' }
                ]
              },
              {
                quality: '720p',
                servers: [
                  { name: 'ondesuhd', serverId: 'ondesuhd-193551-0', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://desustream.info/dstream/ondesu/hd/v2/index.php?id=...' },
                  { name: 'vidhide', serverId: 'vidhide-193551-2', dataContent: 'eyJpZCI6MTkzNTUx...', iframeUrl: 'https://odvidhide.com/embed/xzlie12ykoy1' }
                ]
              }
            ]
          }
        }
      },
      {
        name: 'Search Anime',
        path: '/api/otakudesu/search',
        method: 'GET',
        description: 'Mencari anime berdasarkan judul',
        params: [
          { name: 'q', type: 'string', required: true, description: 'Kata kunci pencarian' },
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' }
        ],
        icon: SearchCode,
        exampleResponse: {
          status: 'success',
          query: 'naruto',
          pagination: { totalPages: 1, currentPage: 1, nextPage: false },
          data: [
            { title: 'Boruto: Naruto Next Generations Subtitle Indonesia', slug: 'borot-sub-indo', image: 'https://otakudesu.best/wp-content/...', genre: 'Action, Adventure, Martial Arts', status: 'Ongoing', score: '6.15' }
          ]
        }
      },
      {
        name: 'Genre List',
        path: '/api/otakudesu/genres',
        method: 'GET',
        description: 'Mendapatkan daftar semua genre',
        params: [],
        icon: Tag,
        exampleResponse: {
          status: 'success',
          data: [
            { name: 'Action', slug: 'action' },
            { name: 'Drama', slug: 'drama' },
            { name: 'Romance', slug: 'romance' }
          ]
        }
      },
      {
        name: 'Anime by Genre',
        path: '/api/otakudesu/genre/{slug}',
        method: 'GET',
        description: 'Mendapatkan anime berdasarkan genre dengan pagination',
        params: [
          { name: 'slug', type: 'string', required: true, description: 'Slug genre (contoh: action)' },
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' }
        ],
        icon: Tag,
        exampleResponse: {
          status: 'success',
          genre: 'action',
          pagination: { totalPages: 44, currentPage: 1, nextPage: 2 },
          data: [
            { title: 'Kizoku Tensei', slug: 'kizoku-tensei-subtitle-indonesia', image: 'https://otakudesu.best/wp-content/...', studio: 'CompTown', genre: 'Action, Adventure, Fantasy' }
          ]
        }
      },
      {
        name: 'Jadwal Rilis',
        path: '/api/otakudesu/schedule',
        method: 'GET',
        description: 'Mendapatkan jadwal rilis anime per hari',
        params: [],
        icon: Calendar,
        exampleResponse: {
          status: 'success',
          data: {
            senin: [{ title: 'Anime A', slug: 'anime-a' }],
            selasa: [{ title: 'Anime B', slug: 'anime-b' }],
            rabu: [],
            kamis: [{ title: 'Anime C', slug: 'anime-c' }],
            jumat: [{ title: 'Anime D', slug: 'anime-d' }],
            sabtu: [{ title: 'Anime E', slug: 'anime-e' }],
            minggu: [{ title: 'Anime F', slug: 'anime-f' }]
          }
        }
      }
    ]
  }
};

// API Status Response
const velyDataResponse = {
  VelyData: {
    Message: "Hai Welcome To Vely Docs, Apikey Anime Free, and Sub Indo.",
    Author: "Gxyenn",
    Status: "active"
  }
};

export default function VelyDocs() {
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [paramInputs, setParamInputs] = useState<Record<string, Record<string, string>>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL disalin ke clipboard!');
  };

  const buildUrl = (endpoint: any, source: string) => {
    let url = endpoint.path;
    const key = `${source}-${endpoint.name}`;
    const inputs = paramInputs[key] || {};
    const queryParams: string[] = [];
    
    endpoint.params.forEach((param: any) => {
      const value = inputs[param.name] || '';
      if (param.name === 'slug') {
        url = url.replace('{slug}', value || 'example-slug');
      } else if (url.includes(`{${param.name}}`)) {
        url = url.replace(`{${param.name}}`, value || 'example');
      } else if (value) {
        queryParams.push(`${param.name}=${encodeURIComponent(value)}`);
      }
    });
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    return url;
  };

  const testEndpoint = async (source: string, endpoint: any) => {
    const key = `${source}-${endpoint.name}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const url = buildUrl(endpoint, source);
      const response = await fetch(url);
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [key]: data }));
      toast.success('Request berhasil!');
    } catch (error) {
      setTestResults(prev => ({ ...prev, [key]: { error: 'Request failed', message: String(error) } }));
      toast.error('Request gagal!');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const openInNewTab = (source: string, endpoint: any) => {
    const url = buildUrl(endpoint, source);
    window.open(url, '_blank');
  };

  const filteredEndpoints = () => {
    const endpoints = apiEndpoints.otakudesu.endpoints;
    if (!searchQuery) return endpoints;
    return endpoints.filter((ep: any) => 
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const source = apiEndpoints.otakudesu;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img 
                src="https://files.catbox.moe/gmwn6y.gif" 
                alt="VelyDocs Logo" 
                className="h-8 sm:h-10 w-auto rounded-xl"
              />
              <span className="text-xl font-bold tracking-tight">VelyDocs</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setActiveSection('home')}
                className={`text-sm font-medium transition-colors ${activeSection === 'home' ? 'text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveSection('docs')}
                className={`text-sm font-medium transition-colors ${activeSection === 'docs' ? 'text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
              >
                Documentation
              </button>
              <button
                onClick={() => setActiveSection('status')}
                className={`text-sm font-medium transition-colors ${activeSection === 'status' ? 'text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
              >
                API Status
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-neutral-800"
            >
              <div className="px-4 py-4 space-y-2">
                <button
                  onClick={() => { setActiveSection('home'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'home' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                >
                  Home
                </button>
                <button
                  onClick={() => { setActiveSection('docs'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'docs' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                >
                  Documentation
                </button>
                <button
                  onClick={() => { setActiveSection('status'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'status' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                >
                  API Status
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-16">
        <AnimatePresence mode="wait">
          {/* Home Section */}
          {activeSection === 'home' && (
            <motion.section
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              {/* Hero Section */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-[#0a0a0a]" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="relative"
                      >
                        <img 
                          src="https://files.catbox.moe/gmwn6y.gif" 
                          alt="VelyDocs Logo" 
                          className="h-20 sm:h-24 w-auto rounded-2xl shadow-2xl"
                        />
                        <div className="absolute -inset-2 bg-black/10 dark:bg-white/10 rounded-3xl blur-xl -z-10" />
                      </motion.div>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                      <span className="gradient-text">VelyDocs</span>
                    </h1>
                    
                    <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-4">
                      API Documentation Anime Indonesia
                    </p>
                    
                    <p className="text-lg text-neutral-500 dark:text-neutral-500 max-w-2xl mx-auto mb-8">
                      API Key Anime Gratis dengan Subtitle Indonesia. Scrape real-time dari Otakudesu dengan streaming link dan download per resolusi.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => setActiveSection('docs')}
                          size="lg"
                          className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Lihat Dokumentasi
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-neutral-300 dark:border-neutral-700"
                          onClick={() => setActiveSection('status')}
                        >
                          <Terminal className="w-4 h-4 mr-2" />
                          API Status
                        </Button>
                      </motion.div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                      {[
                        { icon: Zap, title: 'Gratis', desc: 'API tanpa biaya, gunakan sepuasnya' },
                        { icon: Play, title: 'Streaming Link', desc: 'Link iframe & download per resolusi' },
                        { icon: BookOpen, title: 'Sub Indo', desc: 'Anime dengan subtitle Indonesia' },
                      ].map((feature, index) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          <Card className="card-hover bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                            <CardContent className="pt-6">
                              <feature.icon className="w-8 h-8 mx-auto mb-4 text-black dark:text-white" />
                              <h3 className="font-semibold mb-2">{feature.title}</h3>
                              <p className="text-sm text-neutral-500">{feature.desc}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* API Features Section */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold mb-4">Fitur API</h2>
                  <p className="text-neutral-500 dark:text-neutral-400">Semua yang Anda butuhkan untuk aplikasi anime</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { icon: Database, title: 'Home & List', desc: 'Ongoing, Complete, dan Anime List' },
                    { icon: Film, title: 'Anime Detail', desc: 'Info lengkap dengan daftar episode' },
                    { icon: Play, title: 'Episode Detail', desc: 'Streaming iframe & download multi-resolusi' },
                    { icon: SearchCode, title: 'Search', desc: 'Pencarian dengan pagination' },
                    { icon: Tag, title: 'Genre Filter', desc: 'Filter anime berdasarkan genre' },
                    { icon: Calendar, title: 'Schedule', desc: 'Jadwal rilis per hari' },
                    { icon: Globe, title: 'Real-time', desc: 'Data langsung dari sumber' },
                    { icon: Zap, title: 'Fast Response', desc: 'Respons cepat & reliable' },
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="card-hover bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-full">
                        <CardContent className="pt-6 text-center">
                          <feature.icon className="w-10 h-10 mx-auto mb-4 text-black dark:text-white" />
                          <h3 className="font-semibold mb-2">{feature.title}</h3>
                          <p className="text-sm text-neutral-500">{feature.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Source Section */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold mb-4">Sumber Data</h2>
                  <p className="text-neutral-500 dark:text-neutral-400">Data diambil langsung dari sumber streaming anime</p>
                </motion.div>

                <div className="max-w-xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card 
                      className="card-hover cursor-pointer bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                      onClick={() => setActiveSection('docs')}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-black dark:bg-white flex items-center justify-center text-2xl">
                            🎬
                          </div>
                          <div>
                            <CardTitle>{source.name}</CardTitle>
                            <CardDescription>{source.endpoints.length} endpoints tersedia</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                          {source.description}
                        </p>
                        <p className="text-sm mb-4">
                          Base URL: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">{source.baseUrl}</code>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {source.endpoints.slice(0, 5).map((ep: any) => (
                            <Badge key={ep.name} variant="secondary" className="text-xs">
                              {ep.name}
                            </Badge>
                          ))}
                          {source.endpoints.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{source.endpoints.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* Author Section */}
              <div className="bg-neutral-50 dark:bg-neutral-900 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-2xl font-bold mb-4">Dibuat oleh</h2>
                    <div className="inline-flex items-center gap-3 bg-white dark:bg-neutral-800 px-6 py-3 rounded-full shadow-lg">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold">
                        G
                      </div>
                      <span className="text-lg font-semibold">Gxyenn</span>
                    </div>
                    <p className="mt-6 text-neutral-500 dark:text-neutral-400">
                      VelyDocs adalah proyek API anime gratis dengan subtitle Indonesia. 
                      Menyediakan streaming link dan download per resolusi.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Documentation Section */}
          {activeSection === 'docs' && (
            <motion.section
              key="docs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen py-8"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Sidebar */}
                  <aside className="lg:w-64 shrink-0">
                    <div className="sticky top-24">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <Input
                            placeholder="Cari endpoint..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                          />
                        </div>
                      </div>

                      <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="mb-6">
                          <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
                            <span>{source.icon}</span>
                            {source.name}
                          </h3>
                          <div className="space-y-1">
                            {filteredEndpoints().map((ep: any) => {
                              const IconComponent = ep.icon;
                              return (
                                <button
                                  key={`otakudesu-${ep.name}`}
                                  onClick={() => {
                                    document.getElementById(`otakudesu-${ep.name.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                                >
                                  <IconComponent className="w-4 h-4 text-neutral-400" />
                                  <span className="truncate">{ep.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </aside>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Dokumentasi lengkap untuk semua endpoint API VelyDocs
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Source Header */}
                      <div className="flex items-center gap-3 py-4 border-b border-neutral-200 dark:border-neutral-800">
                        <span className="text-2xl">{source.icon}</span>
                        <h2 className="text-2xl font-bold">{source.name}</h2>
                        <Badge variant="outline" className="ml-2">
                          {source.endpoints.length} endpoints
                        </Badge>
                      </div>

                      {/* Endpoints */}
                      {filteredEndpoints().map((endpoint: any) => {
                        const epKey = `otakudesu-${endpoint.name}`;
                        const isExpanded = expandedEndpoints[epKey] !== false;
                        const IconComponent = endpoint.icon;

                        return (
                          <Card 
                            key={epKey}
                            id={epKey.replace(/\s+/g, '-')}
                            className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 overflow-hidden"
                          >
                            <CardHeader className="cursor-pointer" onClick={() => toggleEndpoint(epKey)}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge className="method-get">
                                    {endpoint.method}
                                  </Badge>
                                  <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <IconComponent className="w-5 h-5" />
                                      {endpoint.name}
                                    </CardTitle>
                                    <code className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                                      {endpoint.path}
                                    </code>
                                  </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                              <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                            </CardHeader>

                            {isExpanded && (
                              <CardContent className="border-t border-neutral-200 dark:border-neutral-800">
                                {/* Parameters */}
                                {endpoint.params.length > 0 && (
                                  <div className="mb-6">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Terminal className="w-4 h-4" />
                                      Parameters
                                    </h4>
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
                                      {endpoint.params.map((param: any) => (
                                        <div key={param.name} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <div className="flex items-center gap-2 min-w-[200px]">
                                            <code className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-sm">
                                              {param.name}
                                            </code>
                                            <Badge variant="outline" className="text-xs">
                                              {param.type}
                                            </Badge>
                                            {param.required && (
                                              <Badge className="text-xs bg-red-500 text-white">
                                                required
                                              </Badge>
                                            )}
                                            {!param.required && (
                                              <Badge variant="outline" className="text-xs">
                                                optional
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-sm text-neutral-500">{param.description}</span>
                                        </div>
                                      ))}
                                      
                                      {/* Input fields for parameters */}
                                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                                        {endpoint.params.map((param: any) => (
                                          <div key={`input-${param.name}`} className="flex items-center gap-2">
                                            <span className="text-sm text-neutral-500 w-24">{param.name}:</span>
                                            <Input
                                              placeholder={param.name === 'q' ? 'naruto' : param.name === 'page' ? '1' : param.name}
                                              value={paramInputs[epKey]?.[param.name] || ''}
                                              onChange={(e) => setParamInputs(prev => ({
                                                ...prev,
                                                [epKey]: { ...prev[epKey], [param.name]: e.target.value }
                                              }))}
                                              className="flex-1 h-8 bg-white dark:bg-neutral-900"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                  <Button
                                    size="sm"
                                    onClick={() => testEndpoint('otakudesu', endpoint)}
                                    disabled={loading[epKey]}
                                    className="bg-black dark:bg-white text-white dark:text-black"
                                  >
                                    {loading[epKey] ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Play className="w-4 h-4 mr-2" />
                                    )}
                                    Test
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openInNewTab('otakudesu', endpoint)}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Get
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const url = buildUrl(endpoint, 'otakudesu');
                                      copyToClipboard(window.location.origin + url);
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                  </Button>
                                </div>

                                {/* Response - Shows real data when tested, otherwise shows example */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    {testResults[epKey] ? (
                                      testResults[epKey].status === 'error' ? (
                                        <>
                                          <X className="w-4 h-4 text-red-500" />
                                          <span>Error Response</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 text-green-500" />
                                          <span>Response (Real Data)</span>
                                        </>
                                      )
                                    ) : (
                                      <span>Example Response</span>
                                    )}
                                  </h4>
                                  <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                                    {JSON.stringify(testResults[epKey] || endpoint.exampleResponse, null, 2)}
                                  </pre>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Status Section */}
          {activeSection === 'status' && (
            <motion.section
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen py-16"
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h1 className="text-3xl font-bold mb-2">API Status</h1>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Status dan informasi API VelyDocs
                  </p>
                </div>

                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      VelyDocs API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-neutral-900 text-neutral-100 p-6 rounded-lg overflow-x-auto text-sm">
                      {JSON.stringify(velyDataResponse, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{source.icon}</span>
                        <CardTitle>{source.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Base URL</span>
                        <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{source.baseUrl}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Endpoints</span>
                        <span className="font-semibold">{source.endpoints.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Features</span>
                        <span className="font-semibold">Streaming, Download, Pagination</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-12 text-center">
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Made with ❤️ by <span className="font-semibold">Gxyenn</span>
                  </p>
                  <p className="text-sm text-neutral-400">
                    © 2026 VelyDocs. All rights reserved.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://files.catbox.moe/gmwn6y.gif" 
                alt="VelyDocs Logo" 
                className="h-6 sm:h-8 w-auto rounded-xl"
              />
              <span className="font-semibold">VelyDocs</span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © 2026 VelyDocs by Gxyenn. API Anime Gratis Sub Indo.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
