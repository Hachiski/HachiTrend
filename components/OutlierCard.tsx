import React from 'react';
import { OutlierVideo } from '../types';
import { ExternalLink, TrendingUp, Users, Eye, PlayCircle, BarChart2 } from 'lucide-react';

interface OutlierCardProps {
  video: OutlierVideo;
  onAnalyze: (video: OutlierVideo) => void;
}

const OutlierCard: React.FC<OutlierCardProps> = ({ video, onAnalyze }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Determine badge color based on ratio
  let ratioColor = 'text-green-400 bg-green-900/20 border-green-900/30';
  let badgeLabel = 'Outlier';
  
  if (video.performanceRatio > 10) {
    ratioColor = 'text-purple-400 bg-purple-900/20 border-purple-900/30';
    badgeLabel = 'Viral Anomaly';
  } else if (video.performanceRatio > 5) {
    ratioColor = 'text-pink-400 bg-pink-900/20 border-pink-900/30';
    badgeLabel = 'Explosive';
  }

  return (
    <div className="bg-[#1f1f1f] rounded-xl border border-[#333] overflow-hidden hover:border-blue-500 transition-all group flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-2 left-2">
             <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold border uppercase tracking-wide shadow-lg backdrop-blur-md ${ratioColor}`}>
                <TrendingUp size={12} />
                <span>{video.performanceRatio}x Normal</span>
             </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center">
             <Eye size={10} className="mr-1" />
             {formatNumber(video.viewCount)}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
            {video.title}
        </h3>
        
        <div className="flex items-center text-xs text-gray-400 mb-4">
            <Users size={12} className="mr-1" />
            <span className="truncate max-w-[150px]">{video.channelTitle}</span>
            <span className="mx-1">•</span>
            <span>{video.channelSubscriberCount} Subs</span>
        </div>

        {/* Comparison Stats */}
        <div className="bg-[#151515] rounded-lg p-3 mb-4 border border-[#2a2a2a] grid grid-cols-2 gap-2">
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Video Views</p>
                <p className="text-white font-bold">{formatNumber(video.viewCount)}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Channel Avg</p>
                <p className="text-gray-300 font-medium">{formatNumber(video.channelTypicalViews)}</p>
            </div>
        </div>

        <div className="mt-auto flex gap-2">
             <a 
                href={video.videoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-[#252525] hover:bg-[#333] text-gray-300 hover:text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center transition-colors border border-[#333]"
             >
                <PlayCircle size={14} className="mr-1.5" />
                Watch
             </a>
             <button 
                onClick={() => onAnalyze(video)}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-blue-900/20"
             >
                <BarChart2 size={14} className="mr-1.5" />
                Analyze Concept
             </button>
        </div>
      </div>
    </div>
  );
};

export default OutlierCard;