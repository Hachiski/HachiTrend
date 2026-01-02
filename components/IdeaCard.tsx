import React from 'react';
import { VideoIdea } from '../types';
import { Lightbulb, Users, BarChart, Hash } from 'lucide-react';

interface IdeaCardProps {
  idea: VideoIdea;
  onSelect: (idea: VideoIdea) => void;
  index: number;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onSelect, index }) => {
  return (
    <div className="bg-[#1f1f1f] rounded-xl p-6 border border-[#333] hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full" onClick={() => onSelect(idea)}>
      <div className="absolute top-0 left-0 bg-[#2a2a2a] px-3 py-1 rounded-br-lg text-xs font-mono text-gray-400">
        #{index + 1}
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2 mt-4 line-clamp-2">
        {idea.title}
      </h3>
      
      <div className="bg-[#252525] p-3 rounded-lg mb-4">
        <p className="text-yellow-400 text-sm font-medium mb-1 flex items-center">
            <Lightbulb size={14} className="mr-2" /> Hook
        </p>
        <p className="text-gray-300 text-sm italic">"{idea.hook}"</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
        <div className="flex items-center">
            <Users size={14} className="mr-2 text-blue-400" />
            {idea.targetAudience}
        </div>
        <div className="flex items-center">
            <BarChart size={14} className="mr-2 text-green-400" />
            Effort: <span className={`ml-1 font-semibold ${idea.estimatedEffort === 'High' ? 'text-red-400' : idea.estimatedEffort === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{idea.estimatedEffort}</span>
        </div>
      </div>

      {idea.tags && idea.tags.length > 0 && (
        <div className="mt-auto pt-4 border-t border-[#333]">
           <div className="flex items-center text-xs text-gray-500 mb-2">
               <Hash size={12} className="mr-1" />
               <span>Optimized Tags</span>
           </div>
           <div className="flex flex-wrap gap-2">
               {idea.tags.slice(0, 5).map((tag, i) => (
                   <span key={i} className="bg-[#1a1a1a] text-gray-400 text-[10px] px-2 py-1 rounded-md border border-[#333]">
                       #{tag.replace(/\s+/g, '')}
                   </span>
               ))}
               {idea.tags.length > 5 && (
                   <span className="text-[10px] text-gray-500 py-1">+{idea.tags.length - 5} more</span>
               )}
           </div>
        </div>
      )}
    </div>
  );
};

export default IdeaCard;
