import React from 'react';
import { Trend } from '../types';
import { TrendingUp, ExternalLink, Search } from 'lucide-react';

interface TrendCardProps {
  trend: Trend;
  onSelect: (trend: Trend) => void;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, onSelect }) => {
  return (
    <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#333] hover:border-red-500 transition-all duration-300 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2 text-red-500">
          <TrendingUp size={20} />
          <span className="text-sm font-semibold tracking-wide uppercase">Relevance: {trend.relevanceScore}%</span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-red-400 transition-colors">
        {trend.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
        {trend.description}
      </p>

      {trend.sources && trend.sources.length > 0 && (
        <div className="mb-4 pt-4 border-t border-[#333]">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Sources</p>
            <div className="flex flex-wrap gap-2">
                {trend.sources.map((src, idx) => (
                    <a 
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-xs text-blue-400 hover:text-blue-300 bg-[#1a1a2e] px-2 py-1 rounded"
                    >
                        <ExternalLink size={10} className="mr-1" />
                        {src.title.length > 20 ? src.title.substring(0, 20) + '...' : src.title}
                    </a>
                ))}
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#333]">
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
