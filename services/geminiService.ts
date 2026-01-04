import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trend, VideoIdea, ScriptData, ChannelAnalysisResult, OutlierVideo, VideoDetails, VideoOptimizationResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NICHE_CATEGORY_MAP: Record<string, string> = {
  'Gaming': '20',
  'Tech': '28',
  'Lifestyle': '26', // Howto & Style
  'Education': '27',
  'Entertainment': '24',
  'Finance': '25', // News & Politics
  'Artificial Intelligence': '28' // Tech
};

/**
 * Fetches trends from YouTube API.
 * Requires a valid YouTube Data API Key.
 */
export const fetchTrends = async (niche: string, youtubeApiKey?: string, keyword?: string): Promise<Trend[]> => {
  if (!youtubeApiKey) {
    throw new Error("YouTube API Key is required to fetch trends.");
  }
  return fetchTrendsFromYouTube(youtubeApiKey, niche, keyword);
};

/**
 * Finds specific outlier videos using the YouTube Data API.
 * An outlier is defined as a video performing significantly better than the channel's average.
 */
export const findOutliers = async (niche: string, apiKey: string, keyword?: string): Promise<OutlierVideo[]> => {
    if (!apiKey) {
        throw new Error("YouTube API Key is required for Outlier Hunter.");
    }

    const MAX_RESULTS = 50; // Fetch more to filter down
    let videos: any[] = [];

    try {
        // 1. Search for recent popular videos
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const publishedAfter = thirtyDaysAgo.toISOString();

        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&type=video&order=viewCount&publishedAfter=${publishedAfter}&maxResults=${MAX_RESULTS}&key=${apiKey}`;

        if (keyword && keyword.trim() !== '') {
            searchUrl += `&q=${encodeURIComponent(keyword)}`;
        } else {
            const categoryId = NICHE_CATEGORY_MAP[niche];
            if (categoryId) {
                searchUrl += `&q=${encodeURIComponent(niche)}`;
            }
        }
        
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube Search API Error");

        const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
        if (!videoIds) return [];

        // 2. Fetch Video Details (Views, Likes)
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        if (!detailsRes.ok) throw new Error(detailsData.error?.message || "YouTube Video Details API Error");
        videos = detailsData.items || [];

        // 3. Fetch Channel Details (Total Views, Total Videos) to calc average
        const channelIds = [...new Set(videos.map((v: any) => v.snippet.channelId))].join(',');
        let channelStats: Record<string, { subs: string, avgViews: number }> = {};

        if (channelIds) {
            const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`;
            const channelsRes = await fetch(channelsUrl);
            const channelsData = await channelsRes.json();
            
            if (channelsData.items) {
                channelsData.items.forEach((ch: any) => {
                    const totalViews = parseInt(ch.statistics.viewCount || '0');
                    const totalVideos = parseInt(ch.statistics.videoCount || '0');
                    // Avoid division by zero
                    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

                    channelStats[ch.id] = {
                        subs: ch.statistics.subscriberCount,
                        avgViews: avgViews
                    };
                });
            }
        }

        // 4. Build Outlier Objects
        const outliers: OutlierVideo[] = videos.map((v: any) => {
            const viewCount = parseInt(v.statistics.viewCount || '0');
            const channelAvg = channelStats[v.snippet.channelId]?.avgViews || 0;
            const ratio = channelAvg > 0 ? viewCount / channelAvg : 0;

            return {
                id: v.id,
                title: v.snippet.title,
                description: v.snippet.description,
                thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
                channelTitle: v.snippet.channelTitle,
                publishedAt: v.snippet.publishedAt,
                viewCount: viewCount,
                likeCount: parseInt(v.statistics.likeCount || '0'),
                commentCount: parseInt(v.statistics.commentCount || '0'),
                channelSubscriberCount: channelStats[v.snippet.channelId]?.subs || "Unknown",
                channelTypicalViews: channelAvg,
                performanceRatio: parseFloat(ratio.toFixed(2)),
                videoUrl: `https://www.youtube.com/watch?v=${v.id}`
            };
        });

        // 5. Filter & Sort
        return outliers
            .filter(o => o.viewCount > 1000 && o.channelTypicalViews > 0)
            .sort((a, b) => b.performanceRatio - a.performanceRatio);

    } catch (error) {
        console.error("Error finding outliers:", error);
        throw error;
    }
};

/**
 * Fetches raw video data from YouTube API and uses Gemini to format/analyze it.
 * Handles both category-based popular videos and keyword-based search.
 */
const fetchTrendsFromYouTube = async (apiKey: string, niche: string, keyword?: string): Promise<Trend[]> => {
  let videos: any[] = [];
  const MAX_RESULTS = 25; 

  try {
    if (keyword && keyword.trim() !== '') {
      // 1. Search for videos by keyword
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const publishedAfter = thirtyDaysAgo.toISOString();

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(keyword)}&type=video&order=relevance&publishedAfter=${publishedAfter}&maxResults=${MAX_RESULTS}&key=${apiKey}`;
      
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube Search API Error");

      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

      if (!videoIds) return [];

      // 2. Fetch details
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();

      if (!detailsRes.ok) throw new Error(detailsData.error?.message || "YouTube Video Details API Error");
      
      videos = detailsData.items || [];

    } else {
      // Fetch Most Popular by Category
      const categoryId = NICHE_CATEGORY_MAP[niche];
      let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=${MAX_RESULTS}&key=${apiKey}`;
      
      if (categoryId) {
        url += `&videoCategoryId=${categoryId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.error?.message || "YouTube API Error");
  
      videos = data.items || [];
    }

    if (videos.length === 0) return [];

    // 3. Fetch Channel Statistics (Subs + Total Views + Total Videos) to calculate Avg Channel Performance
    const channelIds = [...new Set(videos.map((v: any) => v.snippet.channelId))].join(',');
    let channelStats: Record<string, { subs: string, avgViews: number }> = {};

    if (channelIds) {
        try {
            const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`;
            const channelsRes = await fetch(channelsUrl);
            const channelsData = await channelsRes.json();
            
            if (channelsData.items) {
                channelsData.items.forEach((ch: any) => {
                    // Calculate lifetime average views per video for the channel
                    const totalViews = parseInt(ch.statistics.viewCount || '0');
                    const totalVideos = parseInt(ch.statistics.videoCount || '0');
                    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

                    channelStats[ch.id] = {
                        subs: ch.statistics.subscriberCount,
                        avgViews: avgViews
                    };
                });
            }
        } catch (err) {
            console.error("Failed to fetch channel stats", err);
        }
    }

    // Prepare data for Gemini to analyze
    const videoSummaries = videos.map((v: any) => ({
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      subscriberCount: channelStats[v.snippet.channelId]?.subs || "Unknown",
      channelTypicalViews: channelStats[v.snippet.channelId]?.avgViews || "Unknown",
      views: v.statistics.viewCount,
      likes: v.statistics.likeCount,
      comments: v.statistics.commentCount,
      publishedAt: v.snippet.publishedAt,
      description: v.snippet.description ? v.snippet.description.substring(0, 100) + "..." : ""
    }));

    const modelId = 'gemini-3-flash-preview';
    
    // Updated Prompt: Added Channel Avg Views Analysis
    const prompt = `
      I have a list of ${videos.length} currently popular YouTube videos related to ${keyword ? `the keyword "${keyword}"` : `the niche "${niche}"`}.
      
      Raw Video Data (Includes Subscriber Counts and Channel Typical Views):
      ${JSON.stringify(videoSummaries)}

      YOUR TASK:
      Analyze this data to identify **5 DISTINCT MACRO TRENDS or TOPICS**. 
      Cluster similar videos together.
      
      Output Requirements for each Trend:
      1. 'title': The abstract name of the trend/topic (2-5 words).
      2. 'description': Explain the *pattern* you see. Why is this topic exploding?
      3. 'relevanceScore': A score (80-100) based on the aggregate view counts.
      4. 'searchQuery': A generic search query.
      5. 'sources': Array of { "title", "uri" } (top 1-3 videos).
      6. 'stats': An object containing calculated averages from the videos in this cluster:
         - 'averageViews': formatted string (e.g. "1.2M", "500K")
         - 'averageLikes': formatted string
         - 'averageComments': formatted string
         - 'engagementRate': formatted string (e.g. "4.5%") calculated as ((averageLikes + averageComments) / averageViews) * 100.
         - 'averageSubscriberCount': formatted string (e.g. "500K", "10M").
         - 'averageChannelViews': formatted string (e.g. "50K", "1M"). The average 'channelTypicalViews' of the creators in this trend.
      7. 'sparkline': An array of 7 integers (0-100) representing the estimated trend intensity over the last 7 days. 
      8. 'videoCount': The integer count of videos from the raw data that were clustered into this trend.
      9. 'trendNature': EXACTLY ONE of these strings: 
          - 'Big Creator Dominated' (If avg subs > 1M).
          - 'Viral Opportunity' (If avg subs < 200k).
          - 'Mixed' (A mix of both).

      Return a JSON array of these 5 Trend objects.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text;
    if (!text) return [];
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const trends = JSON.parse(cleanedText);

    return trends.map((t: any, i: number) => ({
        ...t,
        id: t.id || `trend-${Date.now()}-${i}`
    }));

  } catch (error) {
    console.error("YouTube API failed:", error);
    throw error;
  }
};

/**
 * Generates video ideas based on a specific trend.
 */
export const generateVideoIdeas = async (trend: Trend): Promise<VideoIdea[]> => {
  const modelId = 'gemini-3-flash-preview';

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        hook: { type: Type.STRING },
        thumbnailDescription: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        estimatedEffort: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'hook', 'thumbnailDescription', 'targetAudience', 'estimatedEffort', 'tags']
    }
  };

  const prompt = `
    Based on the YouTube trend/topic: "${trend.title}"
    Context: ${trend.description}

    Generate 4 distinct, viral-worthy video ideas that capitalize on this trend.
    Focus on high CTR (Click-Through Rate) titles and engaging hooks.
    
    Also generate 5-10 high-traffic SEO tags (keywords) for each video idea.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as VideoIdea[];
  } catch (error) {
    console.error("Error generating ideas:", error);
    return [];
  }
};

/**
 * Analyzes a channel and generates tailored video ideas.
 */
export const analyzeChannel = async (channelName: string): Promise<ChannelAnalysisResult> => {
  const modelId = 'gemini-3-flash-preview';

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      channelName: { type: Type.STRING },
      summary: { type: Type.STRING },
      subscriberCountEstimate: { type: Type.STRING },
      ideas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            thumbnailDescription: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            estimatedEffort: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'hook', 'thumbnailDescription', 'targetAudience', 'estimatedEffort', 'tags']
        }
      }
    },
    required: ['channelName', 'summary', 'ideas']
  };

  const prompt = `
    Search for the YouTube channel '${channelName}'. 
    Use Google Search to find their recent videos, most popular content, and overall style.
    
    Based on your analysis:
    1. Identify the correct channel name.
    2. Write a 2-sentence summary of their content strategy and niche.
    3. Estimate their subscriber count if available in search snippets (e.g., "1.2M", "500K").
    4. Generate 5 new video ideas that perfectly fit their style but offer a fresh angle.
    5. Include 5-8 relevant tags for each idea.

    Return the result as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis generated");
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as ChannelAnalysisResult;
  } catch (error) {
    console.error("Error analyzing channel:", error);
    throw error;
  }
};

// ... generateScript and generateThumbnailImage remain unchanged ...
export const generateScript = async (idea: VideoIdea): Promise<ScriptData> => {
  const modelId = 'gemini-3-pro-preview'; 

  const prompt = `
    Write a complete YouTube video script for the following idea:
    Title: ${idea.title}
    Target Audience: ${idea.targetAudience}
    Hook: ${idea.hook}

    The output should be in JSON format with the following fields:
    - title: The final polished title.
    - outline: A bulleted list of the video structure (Intro, Points, Outro).
    - fullScript: The actual spoken script formatted in Markdown, including cues for visuals [Visual Cue].
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        outline: { type: Type.STRING },
        fullScript: { type: Type.STRING }
    },
    required: ['title', 'outline', 'fullScript']
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No script generated");
    return JSON.parse(text) as ScriptData;
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const generateThumbnailImage = async (description: string): Promise<string | null> => {
  const modelId = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: `Generate a high-quality, vibrant YouTube thumbnail image based on this description: ${description}. Make it colorful, high contrast, and clickable. No text overlay.` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
};

export const fetchVideoDetails = async (videoId: string, apiKey: string): Promise<VideoDetails> => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error?.message || "YouTube API Error");
    if (!data.items || data.items.length === 0) throw new Error("Video not found");

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      tags: item.snippet.tags || [],
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      publishedAt: item.snippet.publishedAt
    };
  } catch (error) {
    console.error("Fetch Video Details Error:", error);
    throw error;
  }
};

export const analyzeVideoForOptimization = async (video: VideoDetails): Promise<VideoOptimizationResult> => {
  const modelId = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze this YouTube video metadata to improve its performance (CTR and SEO).
    
    Current Metadata:
    Title: "${video.title}"
    Channel: "${video.channelTitle}"
    Stats: ${video.viewCount} views, ${video.likeCount} likes.
    Tags: ${video.tags.join(', ')}
    Description Snippet: "${video.description.substring(0, 300)}..."

    YOUR TASK:
    1. Critique: Briefly analyze why this title/metadata might be good or bad.
    2. Suggest 5 Improved Titles: Focus on high CTR, curiosity, and urgency.
    3. Suggest an Improved Description: Write the first 3 lines (the hook) and a brief SEO summary.
    4. Suggest Improved Tags: 10 high-volume, relevant keywords.
    5. Thumbnail Advice: Describe what a perfect thumbnail for this specific video should look like.

    Return JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      critique: { type: Type.STRING },
      improvedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvedDescription: { type: Type.STRING },
      improvedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
      thumbnailSuggestions: { type: Type.STRING },
    },
    required: ['critique', 'improvedTitles', 'improvedDescription', 'improvedTags', 'thumbnailSuggestions']
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No optimization generated");
    return JSON.parse(text) as VideoOptimizationResult;
  } catch (error) {
    console.error("Optimization Error:", error);
    throw error;
  }
};

export const editThumbnailImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const modelId = 'gemini-2.5-flash-image';
  
  // Extract base64 data and mime type
  const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
     console.error("Invalid base64 string provided");
     return null;
  }
  const mimeType = matches[1];
  const data = matches[2];

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          },
          {
            text: `Edit this YouTube thumbnail image based on these instructions: ${prompt}. Maintain the core subject and composition but apply the requested changes. Make it look like a high-quality YouTube thumbnail.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Thumbnail Edit Error:", error);
    return null;
  }
};