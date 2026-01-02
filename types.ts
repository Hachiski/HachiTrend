export interface Trend {
  id: string;
  title: string;
  description: string;
  searchQuery: string;
  relevanceScore: number; // 1-100
  sources?: { uri: string; title: string }[];
}

export interface VideoIdea {
  title: string;
  hook: string;
  thumbnailDescription: string;
  targetAudience: string;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  tags: string[];
}

export interface ScriptData {
  title: string;
  outline: string;
  fullScript: string;
}

export interface ChannelAnalysisResult {
  channelName: string;
  summary: string;
  subscriberCountEstimate?: string;
  ideas: VideoIdea[];
}

export enum Niche {
  GAMING = 'Gaming',
  TECH = 'Tech',
  LIFESTYLE = 'Lifestyle',
  EDUCATION = 'Education',
  ENTERTAINMENT = 'Entertainment',
  FINANCE = 'Finance',
  AI = 'Artificial Intelligence'
}

export enum AppView {
  TRENDS = 'TRENDS',
  IDEAS = 'IDEAS',
  SCRIPT = 'SCRIPT',
  CHANNEL_SEARCH = 'CHANNEL_SEARCH'
}