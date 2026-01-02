import React, { useState, useEffect } from 'react';
import { VideoIdea, ScriptData } from '../types';
import { generateScript, generateThumbnailImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Loader2, Image as ImageIcon, Copy, Check } from 'lucide-react';

interface ScriptViewProps {
  idea: VideoIdea;
  onBack: () => void;
}

const ScriptView: React.FC<ScriptViewProps> = ({ idea, onBack }) => {
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loadingScript, setLoadingScript] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoadingScript(true);
        const script = await generateScript(idea);
        if (mounted) setScriptData(script);
        
        // After script is ready (or parallel), generate thumbnail
        setLoadingImage(true);
        const image = await generateThumbnailImage(idea.thumbnailDescription);
        if (mounted) setThumbnailUrl(image);
        setLoadingImage(false);

      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingScript(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea]);

  const copyToClipboard = () => {
    if (scriptData) {
      navigator.clipboard.writeText(scriptData.fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingScript) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Loader2 size={48} className="animate-spin text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Writing your Masterpiece...</h2>
        <p className="text-gray-400 animate-pulse">Consulting the YouTube algorithm gods (Gemini Pro)...</p>
      </div>
    );
  }

  if (!scriptData) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-400">Failed to generate script. Please try again.</p>
        <button onClick={onBack} className="mt-4 text-white underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" /> Back to Ideas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Script Info & Thumbnail */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1f1f1f] p-6 rounded-xl border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">Video Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-gray-500 font-semibold">Title</label>
                <p className="text-white font-medium">{scriptData.title}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500 font-semibold">Thumbnail Concept</label>
                <p className="text-gray-300 text-sm mt-1">{idea.thumbnailDescription}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1f1f1f] p-6 rounded-xl border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <ImageIcon size={20} className="mr-2 text-purple-400" /> 
              AI Thumbnail
            </h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-[#333] relative group">
              {loadingImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                    <Loader2 size={24} className="animate-spin text-purple-500" />
                </div>
              ) : thumbnailUrl ? (
                <>
                    <img src={thumbnailUrl} alt="AI Generated Thumbnail" className="w-full h-full object-cover" />
                    <a 
                        href={thumbnailUrl} 
                        download={`thumbnail-${idea.title.slice(0,10)}.png`}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-medium"
                    >
                        Download Image
                    </a>
                </>
              ) : (
                <span className="text-gray-600 text-sm">Image Generation Failed</span>
              )}
            </div>
             <p className="text-xs text-gray-500 mt-2 text-center">Powered by Imagen 3 (Gemini Flash Image)</p>
          </div>
        </div>

        {/* Right Col: The Script */}
        <div className="lg:col-span-2">
            <div className="bg-[#1f1f1f] rounded-xl border border-[#333] overflow-hidden">
                <div className="bg-[#252525] p-4 border-b border-[#333] flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-bold text-white">Generated Script</h2>
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-[#333] hover:bg-[#444] rounded text-sm text-white transition-colors"
                    >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy MD'}</span>
                    </button>
                </div>
                <div className="p-8 prose prose-invert max-w-none">
                    <div className="mb-8 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r text-sm text-blue-200">
                        <strong>Outline:</strong> <br/>
                        <ReactMarkdown>{scriptData.outline}</ReactMarkdown>
                    </div>
                    <ReactMarkdown className="whitespace-pre-wrap font-sans text-gray-300 leading-7">
                        {scriptData.fullScript}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptView;
