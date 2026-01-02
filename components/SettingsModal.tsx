import React, { useState, useEffect } from 'react';
import { X, Save, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [key, setKey] = useState(currentKey);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-900/30 rounded-lg text-red-500">
            <Key size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">API Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Cloud API Key (YouTube Data API)
            </label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              To see <strong>actual real-time trends</strong> directly from YouTube's database instead of AI search results, enter a Google Cloud API Key with the <strong>YouTube Data API v3</strong> enabled.
            </p>
             <p className="text-xs text-gray-500 mt-1">
              (This is sometimes referred to as a Google Analytics/Data key by users).
            </p>
          </div>

          <button 
            onClick={() => onSave(key)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all mt-4"
          >
            <Save size={18} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
