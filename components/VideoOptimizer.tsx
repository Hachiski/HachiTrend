import React, { useState, useRef } from 'react';
import { VideoDetails, VideoOptimizationResult } from '../types';
import { fetchVideoDetails, analyzeVideoForOptimization, editThumbnailImage } from '../services/geminiService';
import { Search, Loader2, PlayCircle, Tag, FileText, Type, Image as ImageIcon, Wand2, Upload, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VideoOptimizerProps {
  apiKey: string;
  onOpenSettings: () => void;
}

const VideoOptimizer: React.FC<VideoOptimizerProps> = ({ apiKey, onOpenSettings }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [optimization, setOptimization] = useState<VideoOptimizationResult | null>(null);
  
  // Image Editing State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editedThumbnail, setEditedThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(videoUrl);
    
    if (!id) {
        setError("Invalid YouTube URL. Please copy and paste a full video link.");
        return;
    }
    if (!apiKey) {
        setError("API Key missing.");
        onOpenSettings();
        return;
    }

    setLoadingDetails(true);
    setError(null);
    setVideoDetails(null);
    setOptimization(null);
    setUploadedImage(null);
    setEditedThumbnail(null);

    try {
        const details = await fetchVideoDetails(id, apiKey);
        setVideoDetails(details);
        
        // Start Analysis immediately
        setLoadingAnalysis(true);
        analyzeVideoForOptimization(details)
            .then(res => setOptimization(res))
            .catch(err => console.error("Analysis failed", err))
            .finally(() => setLoadingAnalysis(false));

    } catch (err: any) {
        setError(err.message || "Failed to fetch video details");
    } finally {
        setLoadingDetails(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setEditedThumbnail(null); // Reset previous edit
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditThumbnail = async () => {
    if (!uploadedImage || !editPrompt.trim()) return;
    
    setLoadingEdit(true);
    try {
        const result = await editThumbnailImage(uploadedImage, editPrompt);
        if (result) {
            setEditedThumbnail(result);
        } else {
            setError("Failed to generate edited image. Please try again.");
        }
    } catch (err) {
        console.error(err);
        setError("Error editing thumbnail");
    } finally {
        setLoadingEdit(false);
    }
  };

  if (!apiKey) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333] animate-in fade-in">
            <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <PlayCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Video Optimizer</h2>
            <p className="text-gray-400 max-w-md mb-6">
                Connect your YouTube API key to fetch video metadata and get AI-powered suggestions for titles, descriptions, and thumbnails.
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Video <span className="text-blue-500">Optimizer</span></h1>
        <p className="text-gray-400 mb-8">
            Paste a YouTube URL to get actionable advice on your Title, Tags, Description, and Thumbnail.
        </p>

        <form onSubmit={handleFetch} className="relative mb-6">
             <input 
                type="text" 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#1f1f1f] border border-[#333] text-white px-6 py-4 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg placeholder-gray-600"
              />
              <button 
                type="submit"
                disabled={loadingDetails}
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50"
              >
                {loadingDetails ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
              </button>
        </form>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {videoDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8">
            
            {/* Left Column: Metadata & Analysis */}
            <div className="space-y-6">
                
                {/* Current Video Info */}
                <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-4 flex gap-4">
                    <img 
                        src={videoDetails.thumbnailUrl} 
                        alt="Current Thumbnail" 
                        className="w-40 h-24 object-cover rounded-lg bg-black"
                    />
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-white line-clamp-2 mb-1">{videoDetails.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{videoDetails.channelTitle}</p>
                        <div className="flex gap-3 text-xs text-gray-400">
                            <span>{parseInt(videoDetails.viewCount).toLocaleString()} views</span>
                            <span>{parseInt(videoDetails.likeCount).toLocaleString()} likes</span>
                        </div>
                    </div>
                </div>

                {loadingAnalysis ? (
                    <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-8 text-center space-y-4">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                        <p className="text-gray-400">Analyzing metadata and generating SEO suggestions...</p>
                    </div>
                ) : optimization ? (
                    <>
                        {/* Critique */}
                        <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-xl p-5">
                            <h4 className="flex items-center text-yellow-400 font-bold mb-2">
                                <AlertCircle size={18} className="mr-2" /> AI Critique
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed">{optimization.critique}</p>
                        </div>

                        {/* Title Suggestions */}
                        <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-6">
                            <h4 className="flex items-center text-white font-bold mb-4">
                                <Type size={18} className="mr-2 text-blue-400" /> Optimized Titles
                            </h4>
                            <div className="space-y-2">
                                {optimization.improvedTitles.map((title, i) => (
                                    <div key={i} className="flex items-start p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] group cursor-pointer border border-transparent hover:border-blue-500/30 transition-all"
                                         onClick={() => navigator.clipboard.writeText(title)}
                                         title="Click to Copy"
                                    >
                                        <span className="text-blue-500 font-mono text-xs mr-3 mt-1">0{i+1}</span>
                                        <span className="text-gray-200 text-sm font-medium">{title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-6">
                            <h4 className="flex items-center text-white font-bold mb-4">
                                <FileText size={18} className="mr-2 text-green-400" /> Hook & Description
                            </h4>
                            <div className="bg-[#252525] p-4 rounded-lg text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                <ReactMarkdown>{optimization.improvedDescription}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-6">
                             <h4 className="flex items-center text-white font-bold mb-4">
                                <Tag size={18} className="mr-2 text-purple-400" /> Recommended Tags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {optimization.improvedTags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-[#252525] text-gray-400 text-xs rounded border border-[#333]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            {/* Right Column: Thumbnail Editor */}
            <div className="space-y-6">
                 <div className="bg-[#1f1f1f] rounded-xl border border-[#333] p-6 sticky top-24">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <ImageIcon size={20} className="mr-2 text-pink-500" /> 
                        AI Thumbnail Editor
                    </h2>
                    
                    <div className="mb-6">
                         <p className="text-sm text-gray-400 mb-3">
                            Upload a screenshot or the original thumbnail file to edit it with AI.
                            <br/><span className="text-xs text-gray-500 italic">(YouTube blocks direct editing of the URL image due to privacy policies).</span>
                        </p>
                        
                        {!uploadedImage ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[#444] rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-[#252525] transition-all group"
                            >
                                <Upload size={32} className="text-gray-500 group-hover:text-blue-400 mb-2" />
                                <span className="text-gray-400 text-sm font-medium group-hover:text-white">Click to Upload Image</span>
                            </div>
                        ) : (
                            <div className="relative group">
                                <img src={uploadedImage} alt="To Edit" className="w-full rounded-xl border border-[#333]" />
                                <button 
                                    onClick={() => { setUploadedImage(null); setEditedThumbnail(null); }}
                                    className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <AlertCircle size={16} />
                                </button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>

                    {uploadedImage && (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">AI Instruction</label>
                                <textarea 
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="e.g. Add a glowing red arrow pointing to the subject, make the background darker, increase contrast..."
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg p-3 text-sm text-white focus:border-pink-500 focus:outline-none min-h-[80px]"
                                />
                            </div>
                            
                            {optimization?.thumbnailSuggestions && (
                                <div className="text-xs text-gray-500 bg-[#151515] p-3 rounded border border-[#333]">
                                    <strong>AI Suggestion:</strong> {optimization.thumbnailSuggestions}
                                </div>
                            )}

                            <button 
                                onClick={handleEditThumbnail}
                                disabled={loadingEdit || !editPrompt}
                                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {loadingEdit ? <Loader2 size={18} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                                Generate Edit
                            </button>
                        </div>
                    )}

                    {editedThumbnail && (
                        <div className="mt-6 pt-6 border-t border-[#333] animate-in zoom-in duration-300">
                             <h3 className="text-sm font-bold text-white mb-3">Result</h3>
                             <div className="relative group rounded-xl overflow-hidden border border-[#333]">
                                <img src={editedThumbnail} alt="Edited Result" className="w-full" />
                                <a 
                                    href={editedThumbnail}
                                    download="edited-thumbnail.png"
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity"
                                >
                                    Download Image
                                </a>
                             </div>
                        </div>
                    )}

                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VideoOptimizer;