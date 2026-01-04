import React, { useState } from 'react';
import { Trend } from '../types';
import { TrendingUp, ExternalLink, Search, Eye, ThumbsUp, MessageCircle, BarChart2, Activity, Percent, Layers, Users, Zap, ShieldAlert, Video } from 'lucide-react';
import TrendSparkline from './TrendSparkline';
import TrendBarChart from './TrendBarChart';

interface TrendCardProps {
  trend: Trend;
  onSelect: (trend: Trend) => void;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, onSelect }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const getTrendNatureBadge = () => {
    if (!trend.trendNature) return null;
    
    if (trend.trendNature === 'Viral Opportunity') {
      return (
        <div className="flex items-center space-x-1 text-green-400 bg-green-900/20 px-2 py-1 rounded text-[10px] font-bold border border-green-900/30 uppercase tracking-wide" title="Low Barrier to Entry: Small channels are succeeding here.">
           <Zap size={10} />
           <span>Viral Opportunity</span>
        </div>
      );
    } else if (trend.trendNature === 'Big Creator Dominated') {
      return (
        <div className="flex items-center space-x-1 text-red-400 bg-red-900/20 px-2 py-1 rounded text-[10px] font-bold border border-red-900/30 uppercase tracking-wide" title="High Competition: Dominated by large channels.">
           <ShieldAlert size={10} />
           <span>High Competition</span>
        </div>
      );
    } else {
       return (
        <div className="flex items-center space-x-1 text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded text-[10px] font-bold border border-yellow-900/30 uppercase tracking-wide">
           <Users size={10} />
           <span>Mixed Creator Size</span>
        </div>
      );
    }
  };

  const getPerformanceRatio = () => {
    if (!trend.stats?.averageViews || !trend.stats?.averageChannelViews) return null;

    // Basic parsing to handle "1.2M", "500K", "100"
    const parseNumber = (str: string) => {
        const n = parseFloat(str.replace(/,/g, '').replace(/[^\d.]/g, ''));
        if (str.toUpperCase().includes('M')) return n * 1000000;
        if (str.toUpperCase().includes('K')) return n * 1000;
        return n;
    };

    const trendViews = parseNumber(trend.stats.averageViews);
    const channelAvg = parseNumber(trend.stats.averageChannelViews);

    if (!channelAvg || channelAvg === 0) return null;

    const ratio = trendViews / channelAvg;
    
    if (ratio > 1.2) {
        return (
            <span className="text-green-400 text-[10px] ml-2 font-bold bg-green-900/20 px-1.5 py-0.5 rounded border border-green-900/30 flex items-center">
                 🚀 {ratio.toFixed(1)}x Outlier
            </span>
        );
    } else if (ratio < 0.8) {
        return (
             <span className="text-yellow-500 text-[10px] ml-2 font-bold bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-900/30">
                 📉 Below Avg
            </span>
        );
    }
    return (
        <span className="text-gray-400 text-[10px] ml-2 font-medium">
             ~ Typical
        </span>
    );
  };

  return (
    <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#333] hover:border-red-500 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
      
      <div className="flex flex-col gap-2 mb-4 relative z-10">
        <div className="flex justify-between items-start">
             <div className="flex items-center space-x-2 text-red-500 bg-red-900/10 px-2 py-1 rounded-md border border-red-900/20">
              <TrendingUp size={16} />
              <span className="text-xs font-bold tracking-wide uppercase">Score: {trend.relevanceScore}</span>
            </div>
            {trend.videoCount && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded border border-[#333]" title="Number of videos analyzed for this trend">
                    <Layers size={12} />
                    <span>{trend.videoCount} Videos</span>
                </div>
            )}
        </div>
        
        {/* Trend Nature Badge */}
        {trend.trendNature && (
            <div className="self-start">
                {getTrendNatureBadge()}
            </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-red-400 transition-colors relative z-10 cursor-pointer" onClick={() => onSelect(trend)}>
        {trend.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-6 leading-relaxed relative z-10">
        {trend.description}
      </p>

      {/* Stats Row */}
      {trend.stats && (
        <>
            <div className="grid grid-cols-4 gap-2 mb-2 relative z-10">
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                        <Eye size={12} />
                    </div>
                    <div className="text-xs font-semibold text-white">{trend.stats.averageViews}</div>
                    <div className="text-[10px] text-gray-600">Views</div>
                </div>
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                        <ThumbsUp size={12} />
                    </div>
                    <div className="text-xs font-semibold text-white">{trend.stats.averageLikes}</div>
                    <div className="text-[10px] text-gray-600">Likes</div>
                </div>
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                        <MessageCircle size={12} />
                    </div>
                    <div className="text-xs font-semibold text-white">{trend.stats.averageComments}</div>
                    <div className="text-[10px] text-gray-600">Cmts</div>
                </div>
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] text-center">
                    <div className="flex items-center justify-center text-gray-500 mb-1">
                        <Percent size={12} />
                    </div>
                    <div className="text-xs font-semibold text-white">{trend.stats.engagementRate || '-'}</div>
                    <div className="text-[10px] text-gray-600">Eng.</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-6 relative z-10">
                 {/* Avg Subs */}
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] flex flex-col justify-center">
                    <div className="flex items-center text-gray-500 space-x-2 mb-1">
                        <Users size={12} />
                        <span className="text-[10px]">Avg Creator</span>
                    </div>
                    <span className="text-xs font-semibold text-white pl-5">{trend.stats.averageSubscriberCount || 'N/A'} Subs</span>
                </div>

                {/* Avg Channel Views + Performance Ratio */}
                <div className="bg-[#151515] p-2 rounded border border-[#2a2a2a] flex flex-col justify-center">
                    <div className="flex items-center text-gray-500 space-x-2 mb-1">
                         <Video size={12} />
                         <span className="text-[10px]">Typical Vids</span>
                    </div>
                    <div className="flex items-center pl-5">
                         <span className="text-xs font-semibold text-white">{trend.stats.averageChannelViews || 'N/A'}</span>
                         {getPerformanceRatio()}
                    </div>
                </div>
            </div>
        </>
      )}

      {/* Sparkline / Bar Chart */}
      {trend.sparkline && (
        <div className="mb-4 relative z-10">
           <div className="flex items-center justify-between mb-2">
             <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                {chartType === 'line' ? '7-Day Interest Curve' : 'Daily Interest Intensity'}
             </div>
             <div className="flex bg-[#151515] rounded p-0.5 border border-[#333]">
                <button 
                    onClick={(e) => { e.stopPropagation(); setChartType('line'); }}
                    className={`p-1 rounded transition-colors ${chartType === 'line' ? 'bg-[#333] text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
                    title="Line Chart"
                >
                    <Activity size={12} />
                </button>
                <button 
                     onClick={(e) => { e.stopPropagation(); setChartType('bar'); }}
                    className={`p-1 rounded transition-colors ${chartType === 'bar' ? 'bg-[#333] text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
                    title="Bar Chart"
                >
                    <BarChart2 size={12} />
                </button>
            </div>
           </div>
           
           <div className="h-[50px]">
             {chartType === 'line' ? (
                <TrendSparkline data={trend.sparkline} height={50} color="#f87171" />
             ) : (
                <TrendBarChart data={trend.sparkline} height={50} color="#f87171" />
             )}
           </div>
        </div>
      )}

      {trend.sources && trend.sources.length > 0 && (
        <div className="mb-4 pt-4 border-t border-[#333] relative z-10">
            <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase">Sources</p>
            <div className="flex flex-wrap gap-2">
                {trend.sources.map((src, idx) => (
                    <a 
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-[10px] text-blue-400 hover:text-blue-300 bg-[#1a1a2e] px-2 py-1 rounded border border-blue-900/30 hover:border-blue-700 transition-colors"
                    >
                        <ExternalLink size={10} className="mr-1" />
                        {src.title.length > 20 ? src.title.substring(0, 20) + '...' : src.title}
                    </a>
                ))}
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#333] relative z-10">
        <a 
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.searchQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="text-gray-500 hover:text-white text-sm flex items-center transition-colors"
        >
          <Search size={14} className="mr-1" />
          View on YT
        </a>
        <button
          onClick={() => onSelect(trend)}
          className="bg-white text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
        >
          Generate Ideas
        </button>
      </div>
    </div>
  );
};

export default TrendCard;