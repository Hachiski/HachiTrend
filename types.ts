export interface TrendStats {
  averageViews: string;
  averageLikes: string;
  averageComments: string;
  engagementRate: string; // New calculated metric
  averageSubscriberCount?: string; // New metric: Avg size of channels in this trend
  averageChannelViews?: string; // New metric: Typical views per video for channels in this trend
}

export interface Trend {
  id: string;
  title: string;
  description: string;
  searchQuery: string;
  relevanceScore: number; // 1-100
  sources?: { uri: string; title: string }[];
  stats?: TrendStats;
  sparkline?: number[]; // 7-point array for trend history
  videoCount?: number; // Number of videos analyzed for this trend
  trendNature?: 'Big Creator Dominated' | 'Viral Opportunity' | 'Mixed' | 'Unknown'; // Classification
}

export interface OutlierVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelSubscriberCount: string;
  channelTypicalViews: number;
  performanceRatio: number;
  videoUrl: string;
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

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  publishedAt: string;
}

export interface VideoOptimizationResult {
  critique: string;
  improvedTitles: string[];
  improvedDescription: string;
  improvedTags: string[];
  thumbnailSuggestions: string;
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
  CHANNEL_SEARCH = 'CHANNEL_SEARCH',
  OUTLIER_HUNTER = 'OUTLIER_HUNTER',
  VIDEO_OPTIMIZER = 'VIDEO_OPTIMIZER'
}