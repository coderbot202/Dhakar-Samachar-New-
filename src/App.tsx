import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Menu, Search, Bell, Home, PlayCircle, Newspaper, Compass, User, 
  ChevronRight, Clock, MapPin, Share2, Bookmark, MessageSquare,
  PlusCircle, LayoutDashboard, FileText, Video, Users, BarChart, Settings,
  LogOut, CheckCircle, Send, Save, Image as ImageIcon, Quote, List, ListOrdered,
  Bold, Italic, Link as LinkIcon, Camera, Mic, 
  X, ChevronLeft, ZoomIn, Calendar, TrendingUp, Radio, Timer, Megaphone,
  ImagePlus, UserSearch, AlertCircle, CheckCircle2, BookOpen,
  FileEdit, ChevronDown, Check, ArrowRight, ArrowLeft, MoreVertical,
  Navigation, Eye, UserCog, LayoutGrid,
  Upload, Hourglass, Tag, Edit, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- AI Service ---
const generateSummary = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Summarize the following news article in 3 short bullet points in Hindi: ${content}`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "क्षमा करें, सारांश तैयार करने में त्रुटि हुई।";
  }
};

const generateArticleDraft = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Write a detailed Hindi news article about: ${topic}. Include a catchy headline and structured paragraphs.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};

// --- Types ---

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface Short {
  id: number;
  video_url: string;
  title: string;
  author_id: number;
  author_name: string;
  author_avatar: string;
  likes: number;
  views: number;
  created_at: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  image_url: string;
  category_id: number;
  category_name: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  status: string;
  location: string;
  is_breaking: boolean;
  views: number;
  created_at: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

// --- Mock Data for UI ---
const MOCK_CATEGORIES = [
  { id: 1, name: 'होम', slug: 'home' },
  { id: 2, name: 'राज्य', slug: 'state' },
  { id: 3, name: 'बिजनेस', slug: 'business' },
  { id: 4, name: 'बॉलीवुड', slug: 'bollywood' },
  { id: 5, name: 'खेल', slug: 'sports' },
  { id: 6, name: 'टेक', slug: 'tech' },
  { id: 7, name: 'लाइफस्टाइल', slug: 'lifestyle' },
];

const MOCK_NEWS: Article[] = [
  {
    id: 1,
    title: "वंदे भारत एक्सप्रेस: अब इन नए रूटों पर भी दौड़ेगी रफ्तार, जानें पूरा शेड्यूल",
    content: "भारत सरकार ने हाल ही में देश की आर्थिक स्थिति को सुदृढ़ करने के उद्देश्य से एक नई आर्थिक नीति की घोषणा की है...",
    image_url: "https://picsum.photos/seed/train/800/450",
    category_id: 1,
    category_name: "मुख्य समाचार",
    author_id: 1,
    author_name: "आदित्य शर्मा",
    status: "published",
    location: "नई दिल्ली",
    is_breaking: true,
    views: 124500,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "विपक्ष की बैठक में हुआ बड़ा फैसला, आगामी चुनावों के लिए नई रणनीति तैयार",
    content: "विपक्ष की बैठक में हुआ बड़ा फैसला...",
    image_url: "https://picsum.photos/seed/politics/400/300",
    category_id: 2,
    category_name: "राजनीति",
    author_id: 1,
    author_name: "राजेश कुमार",
    status: "published",
    location: "नई दिल्ली",
    is_breaking: false,
    views: 45200,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "सैमसंग ने लॉन्च किया नया फोल्डेबल फोन, जानें क्या हैं फीचर्स और भारत में कीमत",
    content: "सैमसंग ने लॉन्च किया नया फोल्डेबल फोन...",
    image_url: "https://picsum.photos/seed/phone/400/300",
    category_id: 6,
    category_name: "टेक",
    author_id: 1,
    author_name: "राजेश कुमार",
    status: "published",
    location: "बेंगलुरु",
    is_breaking: false,
    views: 12800,
    created_at: new Date().toISOString(),
  }
];

// --- Hooks ---
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// --- Components ---

const BottomNav = ({ activeTab }: { activeTab: string }) => (
  <nav className="fixed bottom-0 w-full bg-white dark:bg-[#211112] border-t border-slate-200 dark:border-slate-800 z-50">
    <div className="flex items-center justify-around h-16 max-w-screen-md mx-auto">
      <Link to="/" className={cn("flex flex-col items-center justify-center", activeTab === 'home' ? "text-[#e42127]" : "text-slate-500")}>
        <Home size={24} />
        <span className="text-[10px] font-bold">होम</span>
      </Link>
      <Link to="/shorts" className={cn("flex flex-col items-center justify-center", activeTab === 'shorts' ? "text-[#e42127]" : "text-slate-500")}>
        <PlayCircle size={24} />
        <span className="text-[10px] font-medium">वीडियो</span>
      </Link>
      <Link to="/epaper" className={cn("flex flex-col items-center justify-center", activeTab === 'epaper' ? "text-[#e42127]" : "text-slate-500")}>
        <Newspaper size={24} />
        <span className="text-[10px] font-medium">ई-पेपर</span>
      </Link>
      <Link to="/explore" className={cn("flex flex-col items-center justify-center", activeTab === 'explore' ? "text-[#e42127]" : "text-slate-500")}>
        <Compass size={24} />
        <span className="text-[10px] font-medium">खोजें</span>
      </Link>
      <Link to="/profile" className={cn("flex flex-col items-center justify-center relative", activeTab === 'profile' ? "text-[#e42127]" : "text-slate-500")}>
        <User size={24} />
        <span className="text-[10px] font-medium">प्रोफाइल</span>
        <div className="absolute -top-1 -right-1 size-2 bg-indigo-500 rounded-full border border-white animate-pulse"></div>
      </Link>
    </div>
  </nav>
);

const Header = ({ categories = [] }: { categories?: Category[] }) => (
  <header className="sticky top-0 z-50 bg-[#e42127] shadow-lg">
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <Link to="/" className="text-white text-xl font-bold tracking-tight">Dainik Hindi News</Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center bg-white/10 rounded-full px-3 py-1 gap-2 border border-white/20">
          <Radio size={14} className="text-white animate-pulse" />
          <span className="text-[10px] text-white font-bold uppercase">AI Search</span>
        </div>
        <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
          <Search size={24} />
        </button>
        <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
          <Bell size={24} />
        </button>
      </div>
    </div>
    <nav className="bg-white dark:bg-[#211112]/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
      <div className="flex px-4 gap-6 whitespace-nowrap">
        <Link to="/" className="border-b-4 py-3 font-bold text-sm border-[#e42127] text-[#e42127]">होम</Link>
        {categories.map((cat) => (
          <Link key={cat.id} to={`/?category=${cat.slug}`} className="border-b-4 py-3 font-bold text-sm border-transparent text-slate-600 dark:text-slate-400 hover:text-[#e42127]">
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  </header>
);

// --- Pages ---

const HomePage = () => {
  const { data: news, loading: newsLoading } = useFetch<Article[]>('/api/news');
  const { data: categories } = useFetch<Category[]>('/api/categories');

  if (newsLoading) return <div className="flex items-center justify-center h-screen"><Hourglass className="animate-spin text-[#e42127]" /></div>;

  const displayNews = news && news.length > 0 ? news : MOCK_NEWS;
  const breakingNews = displayNews.find(n => n.is_breaking) || displayNews[0];

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#211112] min-h-screen pb-24">
      <Header categories={categories || []} />
      <main className="max-w-screen-md mx-auto">
        {/* Breaking News Ticker */}
        <div className="bg-[#e42127]/5 dark:bg-[#e42127]/10 px-4 py-2 flex items-center gap-3 border-b border-[#e42127]/10">
          <span className="bg-[#e42127] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Breaking</span>
          <p className="text-sm font-medium truncate text-[#e42127] dark:text-[#e42127]">{breakingNews.title}</p>
        </div>

        {/* Hero Section */}
        <div className="p-4">
          <Link to={`/article/${breakingNews.id}`} className="relative group cursor-pointer block overflow-hidden rounded-xl shadow-md">
            <div 
              className="aspect-video w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
              style={{ 
                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 60%), url('${breakingNews.image_url}')` 
              }}
            />
            <div className="absolute bottom-0 p-4 w-full">
              <span className="bg-[#e42127] text-white text-[10px] font-bold px-2 py-1 rounded-sm mb-2 inline-block">{breakingNews.category_name}</span>
              <h2 className="text-white text-2xl font-bold leading-tight mb-2">{breakingNews.title}</h2>
              <div className="flex items-center text-white/80 text-xs gap-3">
                <span className="flex items-center gap-1"><Clock size={14} /> 2 घंटे पहले</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {breakingNews.location}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* News Feed Section */}
        <section className="px-4 space-y-4">
          <div className="flex items-center justify-between border-l-4 border-[#e42127] pl-3 py-1">
            <h3 className="font-bold text-lg">ताजा खबरें</h3>
            <Link className="text-[#e42127] text-sm font-bold flex items-center gap-1" to="/explore">सभी देखें <ChevronRight size={16} /></Link>
          </div>

          {displayNews.filter(n => n.id !== breakingNews.id).map((news, idx) => (
            <Link key={news.id} to={`/article/${news.id}`} className="bg-white dark:bg-[#211112]/40 rounded-xl p-3 shadow-sm flex gap-4 border border-slate-100 dark:border-slate-800 hover:border-[#e42127]/30 transition-all cursor-pointer">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#e42127] text-[11px] font-bold uppercase tracking-wider">{news.category_name}</span>
                    {idx === 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Radio size={10} className="animate-pulse" /> AI TRENDING
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base mt-1 line-clamp-2">{news.title}</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 flex items-center gap-1">
                  <Clock size={14} /> 1 घंटा पहले
                </p>
              </div>
              <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden">
                <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
              </div>
            </Link>
          ))}

          {/* Ad/Promo Section */}
          <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-2 text-center my-6">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Advertisement</p>
            <div className="h-24 bg-[#e42127]/10 rounded flex items-center justify-center border border-dashed border-[#e42127]/20">
              <p className="text-[#e42127] font-bold">Premium Subscription - 50% OFF</p>
            </div>
          </div>
        </section>
      </main>
      <BottomNav activeTab="home" />
    </div>
  );
};

const ArticlePage = () => {
  const { id } = useParams();
  const { data: news, loading } = useFetch<Article>(`/api/news/${id}`);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!news) return;
    setIsSummarizing(true);
    const summary = await generateSummary(news.content);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Hourglass className="animate-spin text-[#e42127]" /></div>;
  if (!news) return <div className="p-10 text-center">लेख नहीं मिला।</div>;

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#211112] min-h-screen pb-24">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-[#211112] p-4 border-b border-[#e42127]/10 justify-between">
        <Link to="/" className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold flex-1 text-center">दैनिक हिंदी न्यूज़</h2>
        <div className="flex w-10 items-center justify-end">
          <Share2 size={24} className="cursor-pointer" />
        </div>
      </header>

      <main className="max-w-screen-md mx-auto">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#e42127] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{news.category_name}</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">5 मिनट पढ़ने के लिए</span>
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-4">
            {news.title}
          </h1>
          
          <div className="flex items-center gap-3 py-2 border-y border-[#e42127]/5">
            <div className="h-12 w-12 rounded-full border-2 border-[#e42127]/20 overflow-hidden">
              <img src={news.author_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya"} alt="Author" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1">
              <p className="text-slate-900 dark:text-slate-100 text-sm font-bold">{news.author_name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{new Date(news.created_at).toLocaleDateString('hi-IN')} • {news.location}</p>
            </div>
            <button className="bg-[#e42127]/10 text-[#e42127] rounded-full p-2">
              <Bookmark size={20} />
            </button>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-[#e42127]/10 to-transparent p-4 rounded-2xl border border-[#e42127]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="text-[#e42127] animate-pulse" size={18} />
                <span className="text-sm font-bold text-[#e42127]">AI न्यूज़ सारांश</span>
              </div>
              {!aiSummary && (
                <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="text-xs bg-[#e42127] text-white px-3 py-1 rounded-full font-bold disabled:opacity-50"
                >
                  {isSummarizing ? "तैयार हो रहा है..." : "सारांश देखें"}
                </button>
              )}
            </div>
            {aiSummary && (
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {aiSummary}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-bold shrink-0">
            व्हाट्सएप
          </button>
          <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-full text-sm font-bold shrink-0">
            फेसबुक
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold shrink-0">
            ट्विटर
          </button>
        </div>

        <article className="px-4 text-slate-800 dark:text-slate-200 leading-relaxed text-lg mb-8 space-y-6">
          <p>{news.content}</p>
          <blockquote className="border-l-4 border-[#e42127] pl-4 py-2 italic font-medium text-slate-600 dark:text-slate-400">
            "यह नीति केवल आंकड़ों के बारे में नहीं है, बल्कि यह हर भारतीय के जीवन स्तर में सुधार लाने के लिए एक रोडमैप है।" - वित्त मंत्री
          </blockquote>
          <p>डिजिटल इंफ्रास्ट्रक्चर में निवेश इस नीति का दूसरा सबसे महत्वपूर्ण स्तंभ है। ग्रामीण क्षेत्रों में हाई-स्पीड इंटरनेट की पहुंच सुनिश्चित करने से कृषि और शिक्षा जैसे क्षेत्रों में क्रांतिकारी बदलाव आने की संभावना है।</p>
        </article>

        <div className="px-4 flex flex-wrap gap-2 mb-10">
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded text-sm">#Economy</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded text-sm">#IndiaGrowth</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded text-sm">#Finance</span>
        </div>

        <section className="bg-[#e42127]/5 py-8 border-y border-[#e42127]/10">
          <div className="px-4 mb-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">संबंधित खबरें</h3>
            <a className="text-[#e42127] text-sm font-bold" href="#">सभी देखें</a>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
            {[1, 2].map(i => (
              <div key={i} className="min-w-[280px] bg-white dark:bg-[#211112] rounded-xl overflow-hidden shadow-sm border border-[#e42127]/10">
                <img src={`https://picsum.photos/seed/rel-${i}/400/200`} className="h-40 w-full object-cover" alt="Related" />
                <div className="p-3">
                  <h4 className="font-bold text-sm line-clamp-2">शेयर बाजार में भारी उछाल, निवेशकों की चांदी</h4>
                  <p className="text-[10px] text-slate-500 mt-2">2 घंटे पहले</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-8 mb-20">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <MessageSquare className="text-[#e42127]" /> टिप्पणियां (12)
          </h3>
          <div className="mb-8">
            <textarea className="w-full p-4 rounded-xl border border-[#e42127]/20 bg-white dark:bg-slate-900 text-sm focus:ring-[#e42127] focus:border-[#e42127]" placeholder="अपनी राय लिखें..."></textarea>
            <div className="flex justify-end mt-2">
              <button className="bg-[#e42127] text-white px-6 py-2 rounded-full font-bold text-sm shadow-md">पोस्ट करें</button>
            </div>
          </div>
        </section>
      </main>
      <BottomNav activeTab="home" />
    </div>
  );
};

const ShortsPage = () => {
  const { data: shorts, loading } = useFetch<Short[]>('/api/shorts');
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) return <div className="flex items-center justify-center h-screen bg-black"><Hourglass className="animate-spin text-[#e42127]" /></div>;

  const currentShort = shorts?.[currentIndex];

  return (
    <div className="h-screen w-full max-w-md mx-auto flex flex-col bg-black overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <Link to="/"><ArrowLeft className="text-white" /></Link>
          <h1 className="text-white text-lg font-bold">शॉर्ट्स</h1>
        </div>
        <div className="flex items-center gap-4">
          <Search className="text-white" />
          <MoreVertical className="text-white" />
        </div>
      </div>

      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        {currentShort ? (
          <>
            <video 
              src={currentShort.video_url} 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
            
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
              <div className="relative pb-4">
                <div className="size-12 rounded-full border-2 border-white overflow-hidden bg-[#e42127]/20">
                  <img src={currentShort.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentShort.author_name}`} alt="Author" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#e42127] text-white rounded-full size-5 flex items-center justify-center">
                  <PlusCircle size={14} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button className="text-white bg-black/20 p-2 rounded-full"><Bookmark size={24} /></button>
                <span className="text-white text-xs font-semibold mt-1">{currentShort.likes}</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="text-white bg-black/20 p-2 rounded-full"><MessageSquare size={24} /></button>
                <span className="text-white text-xs font-semibold mt-1">456</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="text-white bg-black/20 p-2 rounded-full"><Share2 size={24} /></button>
                <span className="text-white text-xs font-semibold mt-1">शेयर</span>
              </div>
            </div>

            <div className="absolute bottom-20 left-0 right-16 z-10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#e42127] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                  <span className="size-1.5 rounded-full bg-white animate-pulse"></span> लाइव
                </span>
                <p className="text-white font-semibold text-sm">@{currentShort.author_name}</p>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight mb-2">
                {currentShort.title}
              </h2>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white">कोई वीडियो नहीं मिला।</div>
        )}
      </div>
      <BottomNav activeTab="shorts" />
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'shorts' | 'categories' | 'users'>('articles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'views' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { data: stats } = useFetch<{ views: number, articles: number, users: number }>('/api/stats');
  const { data: recentNews } = useFetch<Article[]>(`/api/news?status=${statusFilter}`);
  const { data: shorts } = useFetch<Short[]>('/api/shorts');
  const { data: categories } = useFetch<Category[]>('/api/categories');
  const { data: users } = useFetch<User[]>('/api/users');

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedNews = [...(recentNews || [])].sort((a, b) => {
    if (sortBy === 'views') {
      return sortOrder === 'asc' ? a.views - b.views : b.views - a.views;
    }
    if (sortBy === 'status') {
      const order = { 'draft': 0, 'pending': 1, 'published': 2 };
      const valA = order[a.status as keyof typeof order] ?? 0;
      const valB = order[b.status as keyof typeof order] ?? 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc' 
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDeleteShort = async (id: number) => {
    if (confirm('क्या आप वाकई इस वीडियो को हटाना चाहते हैं?')) {
      const res = await fetch(`/api/shorts/${id}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('क्या आप वाकई इस श्रेणी को हटाना चाहते हैं?')) {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?')) {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#211112]">
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#e42127] p-1.5 rounded-lg">
            <Newspaper className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#e42127]">Hindi न्यूज़</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => setActiveTab('articles')}
            className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors", activeTab === 'articles' ? "bg-[#e42127]/10 border-r-4 border-[#e42127] text-[#e42127]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100")}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">लेख (Articles)</span>
          </button>
          <button 
            onClick={() => setActiveTab('shorts')}
            className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors", activeTab === 'shorts' ? "bg-[#e42127]/10 border-r-4 border-[#e42127] text-[#e42127]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100")}
          >
            <Video size={20} />
            <span className="font-medium">शॉर्ट्स (Shorts)</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors", activeTab === 'categories' ? "bg-[#e42127]/10 border-r-4 border-[#e42127] text-[#e42127]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100")}
          >
            <Tag size={20} />
            <span className="font-medium">श्रेणियां</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors", activeTab === 'users' ? "bg-[#e42127]/10 border-r-4 border-[#e42127] text-[#e42127]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100")}
          >
            <Users size={20} />
            <span className="font-medium">उपयोगकर्ता</span>
          </button>
          <Link to="/publisher" className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100">
            <PlusCircle size={20} />
            <span className="font-medium">नया कंटेंट</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">नमस्ते, राजेश 👋</h1>
            <p className="text-slate-500">यहाँ आज के समाचार पोर्टल का प्रदर्शन है।</p>
          </div>
          <Link to="/publisher" className="bg-[#e42127] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
            <PlusCircle size={20} /> नया लेख लिखें
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium">कुल व्यूज</span>
              <Eye className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.views.toLocaleString() || '0'}</p>
            <p className="text-emerald-500 text-sm font-semibold flex items-center gap-1">
              <TrendingUp size={14} /> +12.5%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium">लेख</span>
              <FileText className="text-[#e42127]" />
            </div>
            <p className="text-3xl font-bold">{stats?.articles || '0'}</p>
            <p className="text-[#e42127] text-sm font-semibold flex items-center gap-1">
              <TrendingUp size={14} /> +5.2%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium">लाइव पाठक</span>
              <Radio className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold">3,245</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium">उपयोगकर्ता</span>
              <Users className="text-amber-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.users || '0'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {activeTab === 'articles' && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">लेखों की सूची</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">फिल्टर:</span>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-1 focus:ring-[#e42127]"
                    >
                      <option value="all">सभी (All)</option>
                      <option value="published">प्रकाशित (Published)</option>
                      <option value="pending">लंबित (Pending)</option>
                      <option value="draft">ड्राफ्ट (Draft)</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4 cursor-pointer hover:text-[#e42127]" onClick={() => handleSort('created_at')}>लेख का शीर्षक</th>
                        <th className="px-6 py-4">श्रेणी</th>
                        <th className="px-6 py-4 cursor-pointer hover:text-[#e42127]" onClick={() => handleSort('views')}>व्यूज</th>
                        <th className="px-6 py-4 cursor-pointer hover:text-[#e42127]" onClick={() => handleSort('status')}>स्थिति</th>
                        <th className="px-6 py-4">एक्शन</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sortedNews.length ? sortedNews.map(news => (
                        <tr key={news.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium truncate max-w-xs">{news.title}</td>
                          <td className="px-6 py-4">{news.category_name}</td>
                          <td className="px-6 py-4">{news.views}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-bold",
                              news.status === 'published' ? "bg-emerald-100 text-emerald-800" :
                              news.status === 'pending' ? "bg-amber-100 text-amber-800" :
                              "bg-slate-100 text-slate-800"
                            )}>
                              {news.status === 'published' ? 'लाइव' : news.status === 'pending' ? 'लंबित' : 'ड्राफ्ट'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link to={`/publisher?edit=${news.id}`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                <Edit size={16} />
                              </Link>
                              <button 
                                onClick={async () => {
                                  if (confirm('क्या आप वाकई इस लेख को हटाना चाहते हैं?')) {
                                    const res = await fetch(`/api/news/${news.id}`, { method: 'DELETE' });
                                    if (res.ok) window.location.reload();
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-500">कोई लेख नहीं मिला।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'shorts' && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">शॉर्ट्स की सूची</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">शीर्षक</th>
                        <th className="px-6 py-4">व्यूज</th>
                        <th className="px-6 py-4">लाइक्स</th>
                        <th className="px-6 py-4">एक्शन</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {shorts?.length ? shorts.map(short => (
                        <tr key={short.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium truncate max-w-xs">{short.title}</td>
                          <td className="px-6 py-4">{short.views}</td>
                          <td className="px-6 py-4">{short.likes}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDeleteShort(short.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-500">कोई शॉर्ट्स नहीं मिला।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">श्रेणियों की सूची</h3>
                  <button 
                    onClick={async () => {
                      const name = prompt('श्रेणी का नाम:');
                      const slug = prompt('स्लग (Slug):');
                      if (name && slug) {
                        const res = await fetch('/api/categories', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name, slug })
                        });
                        if (res.ok) window.location.reload();
                      }
                    }}
                    className="bg-[#e42127] text-white px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    + नई श्रेणी
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">नाम</th>
                        <th className="px-6 py-4">स्लग</th>
                        <th className="px-6 py-4">एक्शन</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categories?.length ? categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{cat.name}</td>
                          <td className="px-6 py-4">{cat.slug}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={async () => {
                                  const name = prompt('नया नाम:', cat.name);
                                  const slug = prompt('नया स्लग:', cat.slug);
                                  if (name && slug) {
                                    const res = await fetch(`/api/categories/${cat.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name, slug })
                                    });
                                    if (res.ok) window.location.reload();
                                  }
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-10 text-center text-slate-500">कोई श्रेणी नहीं मिली।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">उपयोगकर्ताओं की सूची</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">नाम</th>
                        <th className="px-6 py-4">ईमेल</th>
                        <th className="px-6 py-4">रोल</th>
                        <th className="px-6 py-4">एक्शन</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users?.length ? users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={user.avatar} className="size-8 rounded-full" alt="" />
                            <span className="font-medium">{user.name}</span>
                          </td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              user.role === 'admin' ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"
                            )}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === 'admin'}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-500">कोई उपयोगकर्ता नहीं मिला।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Radio className="text-indigo-600 animate-pulse" size={20} /> AI Insights
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-xs font-bold text-indigo-600 mb-1 uppercase">Content Suggestion</p>
                <p className="text-sm font-medium">"भारत की नई आर्थिक नीति" पर एक विस्तृत लेख लिखें, यह वर्तमान में ट्रेंड कर रहा है।</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-600 mb-1 uppercase">Performance Tip</p>
                <p className="text-sm font-medium">शॉर्ट वीडियो में "टेक" श्रेणी के वीडियो 40% अधिक देखे जा रहे हैं।</p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mt-8 mb-6">ट्रेंडिंग टॉपिक्स</h3>
            <div className="space-y-4">
              {['#G20Summit', '#WeatherAlert', '#BollyNews'].map((tag, i) => (
                <div key={tag} className="flex items-center gap-4">
                  <div className="bg-[#e42127]/10 text-[#e42127] text-sm font-bold size-8 rounded-full flex items-center justify-center">{i+1}</div>
                  <div className="flex-1">
                    <p className="font-medium">{tag}</p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                      <div className="bg-[#e42127] h-full rounded-full" style={{ width: `${85 - i*20}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const PublisherPage = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [type, setType] = useState<'article' | 'short'>('article');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    category_id: 1,
    location: '',
    is_breaking: false,
    status: 'published'
  });
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: categories } = useFetch<Category[]>('/api/categories');
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'video_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, [field]: data.url }));
      } else {
        alert('अपलोड विफल रहा।');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('अपलोड के दौरान त्रुटि हुई।');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editId) {
      fetch(`/api/news/${editId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            title: data.title,
            content: data.content,
            image_url: data.image_url,
            video_url: data.video_url || '',
            category_id: data.category_id,
            location: data.location,
            is_breaking: data.is_breaking === 1,
            status: data.status
          });
        });
    }
  }, [editId]);

  const handleAiAssist = async () => {
    if (!formData.title) {
      alert("कृपया पहले एक शीर्षक या विषय लिखें।");
      return;
    }
    setIsAiWriting(true);
    const draft = await generateArticleDraft(formData.title);
    if (draft) {
      setFormData(prev => ({ ...prev, content: draft }));
    }
    setIsAiWriting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editId ? `/api/news/${editId}` : (type === 'article' ? '/api/news' : '/api/shorts');
    const method = editId ? 'PUT' : 'POST';
    
    const payload = type === 'article' ? {
      ...formData,
      author_id: 1, // Mock admin user
    } : {
      title: formData.title,
      video_url: formData.video_url,
      author_id: 1
    };

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(editId ? 'सफलतापूर्वक अपडेट किया गया!' : 'सफलतापूर्वक प्रकाशित किया गया!');
      navigate(type === 'article' ? '/admin' : '/shorts');
    }
  };

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#211112] min-h-screen pb-24">
      <header className="bg-white dark:bg-[#211112] p-4 border-b border-[#e42127]/10 flex items-center gap-4">
        <Link to="/admin"><ArrowLeft /></Link>
        <h1 className="text-xl font-bold">नया कंटेंट जोड़ें</h1>
      </header>
      
      <main className="max-w-screen-md mx-auto p-4">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setType('article')}
            className={cn("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", type === 'article' ? "bg-[#e42127] text-white" : "bg-white text-slate-600")}
          >
            <FileText size={20} /> न्यूज़ लेख
          </button>
          <button 
            onClick={() => setType('short')}
            className={cn("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", type === 'short' ? "bg-[#e42127] text-white" : "bg-white text-slate-600")}
          >
            <Video size={20} /> शॉर्ट वीडियो
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">शीर्षक (Title)</label>
              <input 
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                placeholder="यहाँ शीर्षक लिखें..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {type === 'article' ? (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">श्रेणी (Category)</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}
                  >
                    {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">स्थान (Location)</label>
                  <input 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    placeholder="जैसे: नई दिल्ली"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">इमेज अपलोड करें</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                        placeholder="अपलोड किया गया पाथ यहाँ दिखेगा..."
                        value={formData.image_url}
                        readOnly
                      />
                      {isUploading && <div className="absolute right-3 top-3 animate-spin"><Hourglass size={18} /></div>}
                    </div>
                    <label className="bg-[#e42127] text-white p-3 rounded-xl cursor-pointer hover:bg-[#c41b21] transition-colors">
                      <Upload size={20} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleFileUpload(e, 'image_url')}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 relative group">
                      <img src={formData.image_url} className="w-full h-40 object-cover rounded-xl border border-slate-200" alt="Preview" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, image_url: ''})}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 flex justify-between items-center">
                    <span>कंटेंट (Content)</span>
                    <button 
                      type="button"
                      onClick={handleAiAssist}
                      disabled={isAiWriting}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Radio size={14} className={isAiWriting ? "animate-pulse" : ""} />
                      {isAiWriting ? "AI लिख रहा है..." : "AI से लिखवाएं"}
                    </button>
                  </label>
                  <textarea 
                    required
                    rows={8}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    placeholder="यहाँ समाचार का विवरण लिखें..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="breaking"
                    checked={formData.is_breaking}
                    onChange={e => setFormData({...formData, is_breaking: e.target.checked})}
                  />
                  <label htmlFor="breaking" className="text-sm font-bold">ब्रेकिंग न्यूज़ के रूप में सेट करें</label>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-bold mb-2">वीडियो अपलोड करें</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                      placeholder="अपलोड किया गया वीडियो पाथ..."
                      value={formData.video_url}
                      readOnly
                    />
                    {isUploading && <div className="absolute right-3 top-3 animate-spin"><Hourglass size={18} /></div>}
                  </div>
                  <label className="bg-[#e42127] text-white p-3 rounded-xl cursor-pointer hover:bg-[#c41b21] transition-colors">
                    <Video size={20} />
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, 'video_url')}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {formData.video_url && (
                  <div className="mt-2 relative group">
                    <video src={formData.video_url} className="w-full h-40 object-cover rounded-xl border border-slate-200" controls />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, video_url: ''})}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-[#e42127] text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
            <Send size={20} /> अभी प्रकाशित करें
          </button>
        </form>
      </main>
    </div>
  );
};

const ProfilePage = () => (
  <div className="bg-[#f8f6f6] dark:bg-[#211112] min-h-screen pb-24">
    <header className="bg-white dark:bg-[#211112] p-6 border-b border-[#e42127]/10 flex flex-col items-center">
      <div className="size-24 rounded-full border-4 border-[#e42127] p-1 mb-4">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" className="w-full h-full rounded-full" alt="Profile" />
      </div>
      <h2 className="text-2xl font-bold">राजेश कुमार</h2>
      <p className="text-slate-500">rajesh@news.com</p>
      <Link to="/admin" className="mt-4 bg-[#e42127] text-white px-6 py-2 rounded-full font-bold text-sm">एडमिन डैशबोर्ड</Link>
    </header>
    <main className="p-4 space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bookmark className="text-slate-400" />
            <span className="font-medium">बुकमार्क किए गए लेख</span>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </div>
        <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="text-slate-400" />
            <span className="font-medium">नोटिफिकेशन सेटिंग्स</span>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </div>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <Settings className="text-slate-400" />
            <span className="font-medium">अकाउंट सेटिंग्स</span>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </div>
      </div>
      <button className="w-full bg-white dark:bg-slate-900 text-red-500 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2">
        <LogOut size={20} /> लॉग आउट
      </button>
    </main>
    <BottomNav activeTab="profile" />
  </div>
);

const EpaperPage = () => (
  <div className="bg-[#f8f6f6] dark:bg-[#211112] min-h-screen pb-24">
    <Header />
    <main className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">आज का ई-पेपर</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar size={18} className="text-[#e42127]" />
          <span className="text-sm font-bold">10 मार्च, 2026</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="aspect-[3/4] bg-slate-200 relative group">
              <img src={`https://picsum.photos/seed/paper-${i}/600/800`} className="w-full h-full object-cover" alt="E-paper" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="text-white" size={32} />
              </div>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm">पेज {i}</p>
              <p className="text-xs text-slate-500">मुख्य संस्करण</p>
            </div>
          </div>
        ))}
      </div>
    </main>
    <BottomNav activeTab="epaper" />
  </div>
);

// --- Main App Component ---

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/shorts" element={<ShortsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/publisher" element={<PublisherPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/epaper" element={<EpaperPage />} />
      </Routes>
    </Router>
  );
}
