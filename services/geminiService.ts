import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trend, VideoIdea, ScriptData, ChannelAnalysisResult } from "../types";

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
 * Fetches trends either from Gemini (Search Grounding) or YouTube API (if key provided).
 * Supports optional keyword search.
 */
export const fetchTrends = async (niche: string, youtubeApiKey?: string, keyword?: string): Promise<Trend[]> => {
  if (youtubeApiKey) {
    return fetchTrendsFromYouTube(youtubeApiKey, niche, keyword);
  } else {
    return fetchTrendsFromGemini(niche, keyword);
  }
};

/**
 * Fetches raw video data from YouTube API and uses Gemini to format/analyze it.
 * Handles both category-based popular videos and keyword-based search.
 */
const fetchTrendsFromYouTube = async (apiKey: string, niche: string, keyword?: string): Promise<Trend[]> => {
  let videos: any[] = [];
  const MAX_RESULTS = 25; // Increased to get a better sample for clustering

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

    // Prepare data for Gemini to analyze
    const videoSummaries = videos.map((v: any) => ({
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      views: v.statistics.viewCount,
      description: v.snippet.description ? v.snippet.description.substring(0, 100) + "..." : ""
    }));

    const modelId = 'gemini-3-flash-preview';
    
    // Updated Prompt: Force abstraction of topics
    const prompt = `
      I have a list of ${videos.length} currently popular YouTube videos related to ${keyword ? `the keyword "${keyword}"` : `the niche "${niche}"`}.
      
      Raw Video Data:
      ${JSON.stringify(videoSummaries)}

      YOUR TASK:
      Analyze this data to identify **5 DISTINCT MACRO TRENDS or TOPICS**. 
      Do NOT simply list the video titles. You must cluster similar videos together and identify the underlying subject matter or format that is trending.

      Example:
      - If you see videos "I played GTA 6", "GTA 6 Trailer Reaction", and "GTA 6 Leaks", the Trend Title should be "GTA 6 Hype" or "GTA 6 Leaks Analysis", NOT just one of the video titles.
      
      Output Requirements for each Trend:
      1. 'title': The abstract name of the trend/topic (2-5 words).
      2. 'description': Explain the *pattern* you see. Why is this topic exploding? What are creators doing with it?
      3. 'relevanceScore': A score (80-100) based on the aggregate view counts of videos in this cluster.
      4. 'searchQuery': A generic search query to find more content on this specific topic.
      5. 'sources': An array of objects { "title": "Video Title", "uri": "https://youtube.com/watch?v=ID" } containing the top 1-3 videos from the raw data that best exemplify this trend.

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

    // Assign unique IDs if missing (Gemini usually handles this, but we ensure safety)
    return trends.map((t: any, i: number) => ({
        ...t,
        id: t.id || `trend-${Date.now()}-${i}`
    }));

  } catch (error) {
    console.error("YouTube API failed, falling back to Gemini Search...", error);
    // Fallback to Gemini Search if API key is invalid or quota exceeded
    return fetchTrendsFromGemini(niche, keyword);
  }
};

/**
 * Fetches trends using Gemini with Google Search Grounding.
 */
const fetchTrendsFromGemini = async (niche: string, keyword?: string): Promise<Trend[]> => {
  const modelId = 'gemini-3-flash-preview';
  
  const context = keyword 
    ? `specifically related to the keyword: "${keyword}".` 
    : `specifically within the '${niche}' niche.`;

  const prompt = `
    Identify 5 currently exploding **TOPICS** or **VIRAL CONCEPTS** on YouTube ${context}
    Use Google Search to find real-time, up-to-date information for today.

    CRITICAL: Do not just return a specific video title. Return the *Topic* that is trending.
    
    For each trend found, provide:
    1. A catchy title for the trend (e.g., "The '100 Layers' Challenge" or "AI Voice Covers").
    2. A brief description of why it is trending right now and what makes it viral.
    3. A relevance score (1-100) based on popularity.
    4. A generic search query to find these videos on YouTube.

    Return the data as a clean JSON array of objects.
    The JSON structure should be:
    [
      { "id": "1", "title": "...", "description": "...", "relevanceScore": 85, "searchQuery": "..." }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json' 
      }
    });

    const text = response.text;
    if (!text) return [];

    let trends: Trend[] = [];
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      trends = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse trends JSON", e);
      return [];
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web?.uri && web?.title) || [];

    return trends.map((t, index) => ({
      ...t,
      sources: index === 0 ? sources : []
    }));

  } catch (error) {
    console.error("Error fetching trends:", error);
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
