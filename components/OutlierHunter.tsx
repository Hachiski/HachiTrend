import React, { useState } from 'react';
import { OutlierVideo, Trend, TrendStats, Niche } from '../types';
import { findOutliers } from '../services/geminiService';
import OutlierCard from './OutlierCard';
import { Target, Search, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface OutlierHunterProps {
  apiKey: string;
  onAnalyzeTrend: (trend: Trend) => void;
  onOpenSettings: () => void;
}

const OutlierHunter: React.FC<OutlierHunterProps> = ({ apiKey, onAnalyzeTrend, onOpenSettings }) => {
  const [keyword, setKeyword] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('Gaming');
  const [loading, setLoading] = useState(false);
  const [outliers, setOutliers] = useState<OutlierVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!apiKey) {
        setError("API Key Required");
        return;
    }

    setLoading(true);
    setError(null);
    setOutliers([]);
    setHasSearched(true);

    try {
        const results = await findOutliers(selectedNiche, apiKey, keyword);
        setOutliers(results);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to find outliers.");
    } finally {
        setLoading(false);
    }
  };

  const handleAnalyze = (video: OutlierVideo) => {
    // Convert OutlierVideo to Trend to reuse existing Idea Generation logic
    const mockStats: TrendStats = {
        averageViews: video.viewCount.toString(),
        averageLikes: video.likeCount.toString(),
        averageComments: video.commentCount.toString(),
        engagementRate: 'N/A',
        averageSubscriberCount: video.channelSubscriberCount,
        averageChannelViews: video.channelTypicalViews.toString()
    };

    const mockTrend: Trend = {
        id: video.id,
        title: video.title,
        description: `Analysis of viral outlier video: "${video.title}" by ${video.channelTitle}. This video has ${video.performanceRatio}x more views than the channel average.`,
        searchQuery: video.title,
        relevanceScore: 100,
        stats: mockStats,
        sources: [{ title: video.title, uri: video.videoUrl }],
        trendNature: 'Viral Opportunity', // Assumed for outliers
        videoCount: 1
    };

    onAnalyzeTrend(mockTrend);
  };

  if (!apiKey) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333] animate-in fade-in">
              <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 text-yellow-500">
                  <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">YouTube API Key Required</h2>
              <p className="text-gray-400 max-w-md mb-6">
                  The Outlier Hunter requires direct access to YouTube Data API to calculate channel averages and detect anomalies in real-time.
              </p>
              <button 
                onClick={onOpenSettings}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                  Enter API Key
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-[#333] pb-6">
            <div className="flex-1 w-full">
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                    <Target className="mr-3 text-red-500" /> 
                    Outlier <span className="text-red-500 ml-2">Hunter</span>
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Find videos that are statistically performing <span className="text-white font-bold">10x - 100x</span> better than the creator's average. 
                    These are true viral anomalies.
                </p>

                <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Keyword (optional, e.g. 'Productivity')"
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white pl-4 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
                        />
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 flex items-center">
                         <select 
                            value={selectedNiche}
                            onChange={(e) => setSelectedNiche(e.target.value)}
                            className="bg-transparent text-white text-sm outline-none cursor-pointer py-3"
                         >
                            {Object.values(Niche).map(n => (
                                <option key={n} value={n} className="bg-[#1a1a1a]">{n}</option>
                            ))}
                         </select>
                    </div>
                    <button 
                        type="submit"
                        className="bg-white text-black hover:bg-red-500 hover:text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center"
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                </form>
            </div>
        </div>

        {error && (
            <div className="bg-red-900/20 text-red-300 p-4 rounded-lg border border-red-900/50">
                {error}
            </div>
        )}

        {!hasSearched && !loading && (
            <div className="text-center py-20 opacity-50">
                <Target size={64} className="mx-auto mb-4" />
                <p>Enter a keyword or select a niche to start hunting.</p>
            </div>
        )}

        {loading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#333]"></div>
                ))}
              </div>
        )}

        {!loading && hasSearched && outliers.length === 0 && (
             <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <p className="text-lg font-bold text-gray-300">No Outliers Found</p>
                <p className="text-gray-500 text-sm mt-2">Try a broader keyword or different niche.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outliers.map((video) => (
                <OutlierCard key={video.id} video={video} onAnalyze={handleAnalyze} />
            ))}
        </div>
    </div>
  );
};

export default OutlierHunter;