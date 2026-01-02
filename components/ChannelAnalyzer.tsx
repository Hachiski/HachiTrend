import React, { useState } from 'react';
import { ChannelAnalysisResult, VideoIdea } from '../types';
import { analyzeChannel } from '../services/geminiService';
import { Search, Loader2, User, Sparkles } from 'lucide-react';
import IdeaCard from './IdeaCard';

interface ChannelAnalyzerProps {
  onIdeaSelect: (idea: VideoIdea) => void;
}

const ChannelAnalyzer: React.FC<ChannelAnalyzerProps> = ({ onIdeaSelect }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChannelAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeChannel(query);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze channel. Please ensure the name is correct and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Channel <span className="text-red-500">Spy</span></h1>
        <p className="text-gray-400 mb-8">
          Enter a YouTube channel name to analyze their content strategy and generate tailored viral ideas.
        </p>

        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. MrBeast, Marquess Brownlee, Lofi Girl..."
            className="w-full bg-[#1f1f1f] border border-[#333] text-white px-6 py-4 rounded-full focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-lg placeholder-gray-600"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
          </button>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#333]"></div>
            ))}
        </div>
      )}

      {result && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          {/* Analysis Header */}
          <div className="bg-[#1f1f1f] border border-[#333] rounded-xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
             <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center border border-gray-600 shrink-0">
                <User size={32} className="text-gray-400" />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {result.channelName}
                    {result.subscriberCountEstimate && (
                        <span className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-900/50">
                            {result.subscriberCountEstimate} Subs
                        </span>
                    )}
                </h2>
                <p className="text-gray-400 mt-2 leading-relaxed">{result.summary}</p>
             </div>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="text-yellow-400" />
            <h3 className="text-xl font-bold">Tailored Video Ideas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.ideas.map((idea, idx) => (
              <IdeaCard key={idx} index={idx} idea={idea} onSelect={onIdeaSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelAnalyzer;
