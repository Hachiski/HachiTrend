import React, { useState } from 'react';
import { Niche, Trend, VideoIdea, AppView } from './types';
import { fetchTrends, generateVideoIdeas } from './services/geminiService';
import TrendCard from './components/TrendCard';
import IdeaCard from './components/IdeaCard';
import ScriptView from './components/ScriptView';
import ChannelAnalyzer from './components/ChannelAnalyzer';
import SettingsModal from './components/SettingsModal';
import { Youtube, Sparkles, LayoutGrid, Loader2, RefreshCw, Search, Settings, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.TRENDS);
  const [selectedNiche, setSelectedNiche] = useState<Niche>(Niche.GAMING);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
  
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search/Keyword State
  const [trendSearchQuery, setTrendSearchQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  // API Key State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');

  // Initial load
  React.useEffect(() => {
    handleFetchTrends(selectedNiche);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = (key: string) => {
    setYoutubeApiKey(key);
    localStorage.setItem('youtube_api_key', key);
    setIsSettingsOpen(false);
    // Optionally refresh trends if on trends view
    if (currentView === AppView.TRENDS) {
        setTimeout(() => handleFetchTrends(selectedNiche, key, activeKeyword || undefined), 100);
    }
  };

  const handleFetchTrends = async (niche: Niche, overrideKey?: string, keyword?: string) => {
    setLoadingTrends(true);
    setError(null);
    setTrends([]);
    
    // Update active keyword state
    if (keyword !== undefined) {
        setActiveKeyword(keyword || null);
    }
    const kw = keyword !== undefined ? keyword : activeKeyword || undefined;

    try {
      const keyToUse = overrideKey !== undefined ? overrideKey : youtubeApiKey;
      const fetchedTrends = await fetchTrends(niche, keyToUse, kw);
      setTrends(fetchedTrends);
    } catch (e: any) {
      console.error(e);
      let msg = "Failed to fetch trends.";
      if (e.message.includes("YouTube API")) msg += " Please check your YouTube API Key in settings.";
      else msg += " Gemini might be busy or Search Grounding quota exceeded.";
      setError(msg);
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trendSearchQuery.trim()) return;
    handleFetchTrends(selectedNiche, undefined, trendSearchQuery);
  };

  const clearSearch = () => {
      setTrendSearchQuery('');
      setActiveKeyword(null);
      handleFetchTrends(selectedNiche, undefined, '');
  };

  const handleNicheChange = (niche: Niche) => {
    setSelectedNiche(niche);
    // If we switch niche, we typically clear the keyword search to see that niche's trends
    // unless we want to search the keyword WITHIN the niche.
    // The current service logic prioritizes keyword over niche if keyword exists.
    // Let's clear keyword to avoid confusion when clicking a niche button.
    setTrendSearchQuery('');
    setActiveKeyword(null);

    setSelectedTrend(null);
    setIdeas([]);
    setCurrentView(AppView.TRENDS);
    handleFetchTrends(niche, undefined, '');
  };

  const handleTrendSelect = async (trend: Trend) => {
    setSelectedTrend(trend);
    setLoadingIdeas(true);
    setCurrentView(AppView.IDEAS);
    try {
      const generatedIdeas = await generateVideoIdeas(trend);
      setIdeas(generatedIdeas);
    } catch (e) {
      console.error(e);
      setError("Failed to generate ideas.");
    } finally {
      setLoadingIdeas(false);
    }
  };

  const handleIdeaSelect = (idea: VideoIdea) => {
    setSelectedIdea(idea);
    setCurrentView(AppView.SCRIPT);
  };

  const handleBackToTrends = () => {
    setCurrentView(AppView.TRENDS);
    setSelectedTrend(null);
    setIdeas([]);
  };

  const handleBackToIdeas = () => {
    if (selectedTrend) {
      setCurrentView(AppView.IDEAS);
    } else {
      // Came from Channel Search
      setCurrentView(AppView.CHANNEL_SEARCH);
    }
    setSelectedIdea(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white selection:bg-red-500 selection:text-white">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveSettings}
        currentKey={youtubeApiKey}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#333] h-16 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView(AppView.TRENDS)}>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
            <Youtube size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Hachi<span className="text-red-500">Trend</span></span>
        </div>
        
        {/* Navigation / Niche Selector */}
        <div className="flex items-center space-x-2">
            {currentView !== AppView.CHANNEL_SEARCH && currentView !== AppView.SCRIPT ? (
              <div className="hidden md:flex items-center space-x-1 bg-[#1a1a1a] p-1 rounded-full border border-[#333]">
                {Object.values(Niche).map((niche) => (
                  <button
                    key={niche}
                    onClick={() => handleNicheChange(niche)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedNiche === niche && !activeKeyword
                        ? 'bg-[#333] text-white shadow-sm' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="h-6 w-px bg-[#333] mx-2 hidden md:block"></div>
            
            <button
                onClick={() => setCurrentView(AppView.CHANNEL_SEARCH)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    currentView === AppView.CHANNEL_SEARCH
                    ? 'bg-red-600 text-white' 
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                }`}
            >
                <Search size={14} />
                <span className="hidden sm:inline">Channel Spy</span>
            </button>
             <button
                onClick={() => {
                  setCurrentView(AppView.TRENDS);
                  if (trends.length === 0) handleFetchTrends(selectedNiche);
                }}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    currentView === AppView.TRENDS || currentView === AppView.IDEAS
                    ? 'bg-red-600 text-white' 
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                }`}
            >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Trends</span>
            </button>
            
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="ml-2 p-2 rounded-full hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-200 hover:text-white">&times;</button>
          </div>
        )}

        {/* View: TRENDS */}
        {currentView === AppView.TRENDS && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                    {activeKeyword ? (
                        <span>Results for <span className="text-red-500">"{activeKeyword}"</span></span>
                    ) : (
                        <span>Trending in <span className="text-red-500">{selectedNiche}</span></span>
                    )}
                </h1>
                <p className="text-gray-400 flex items-center text-sm mb-4">
                    {youtubeApiKey ? (
                        <span className="flex items-center text-green-400">
                             <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                             Live Data from YouTube API
                        </span>
                    ) : (
                        <span className="flex items-center">
                            AI-Curated Trends powered by Google Search.
                        </span>
                    )}
                </p>

                {/* Keyword Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative max-w-md">
                    <input 
                        type="text" 
                        value={trendSearchQuery}
                        onChange={(e) => setTrendSearchQuery(e.target.value)}
                        placeholder="Search specific keywords (e.g. 'Minecraft', 'AI Tools')..."
                        className="w-full bg-[#1a1a1a] border border-[#333] text-white pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600 text-sm"
                    />
                    {trendSearchQuery && (
                         <button 
                            type="button" 
                            onClick={clearSearch}
                            className="absolute right-2 top-2.5 text-gray-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {!trendSearchQuery && (
                         <button 
                            type="submit" 
                            className="absolute right-3 top-2.5 text-gray-500"
                        >
                            <Search size={16} />
                        </button>
                    )}
                </form>

              </div>
              <button 
                onClick={() => handleFetchTrends(selectedNiche, undefined, activeKeyword || undefined)}
                className="flex items-center space-x-2 bg-[#222] hover:bg-[#333] px-4 py-2 rounded-lg text-sm transition-colors"
                disabled={loadingTrends}
              >
                <RefreshCw size={16} className={loadingTrends ? 'animate-spin' : ''} />
                <span>Refresh Trends</span>
              </button>
            </div>

            {loadingTrends ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#333]"></div>
                ))}
              </div>
            ) : trends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                {trends.map((trend) => (
                  <TrendCard key={trend.id} trend={trend} onSelect={handleTrendSelect} />
                ))}
              </div>
            ) : (
                <div className="text-center py-20 text-gray-500 bg-[#151515] rounded-xl border border-[#222]">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No trends found.</p>
                    <p className="text-sm mt-2">Try a different keyword or check your API settings.</p>
                </div>
            )}
          </div>
        )}

        {/* View: CHANNEL SEARCH */}
        {currentView === AppView.CHANNEL_SEARCH && (
             <ChannelAnalyzer onIdeaSelect={handleIdeaSelect} />
        )}

        {/* View: IDEAS */}
        {currentView === AppView.IDEAS && (
          <div className="space-y-6">
            <button onClick={handleBackToTrends} className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
              <LayoutGrid size={18} className="mr-2" /> Back to Trends
            </button>

            <div className="bg-gradient-to-r from-red-900/20 to-transparent border-l-4 border-red-500 p-6 rounded-r-xl mb-8">
               <h2 className="text-2xl font-bold text-white mb-1">{selectedTrend?.title}</h2>
               <p className="text-gray-300">{selectedTrend?.description}</p>
            </div>

            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="text-yellow-400" />
              <h3 className="text-xl font-bold">Generated Viral Concepts</h3>
            </div>

            {loadingIdeas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="h-48 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#333]"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                {ideas.map((idea, idx) => (
                  <IdeaCard key={idx} index={idx} idea={idea} onSelect={handleIdeaSelect} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View: SCRIPT */}
        {currentView === AppView.SCRIPT && selectedIdea && (
          <ScriptView idea={selectedIdea} onBack={handleBackToIdeas} />
        )}

      </main>
      
      <footer className="py-8 text-center text-gray-600 text-sm">
        <p>&copy; 2024 HachiTrend. Powered by Gemini 3 Flash & Pro.</p>
      </footer>
    </div>
  );
};

export default App;
