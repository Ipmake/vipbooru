import axios from 'axios';
import {
  BLACKLIST_STORAGE_KEY,
  type AutocompleteResult,
  type BlacklistTagSetting,
  type DanbooruPost,
  type FetchPostsResult,
} from '../types';

const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

const getActiveBlacklistTags = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const rawValue = localStorage.getItem(BLACKLIST_STORAGE_KEY);
  if (!rawValue) {
    return new Set();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as BlacklistTagSetting[];

    return new Set(
      parsedValue
        .filter((entry) => entry.enabled)
        .map((entry) => normalizeTag(entry.tag))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
};

const hasBlacklistedTag = (
  post: DanbooruPost,
  activeBlacklistTags: Set<string>
): boolean => {
  if (activeBlacklistTags.size === 0 || !post.tag_string) {
    return false;
  }

  const postTags = new Set(
    post.tag_string
      .split(/\s+/)
      .map((tag) => normalizeTag(tag))
      .filter(Boolean)
  );

  for (const blacklistedTag of activeBlacklistTags) {
    if (postTags.has(blacklistedTag)) {
      return true;
    }
  }

  return false;
};

// Function to get auth headers if credentials are available
const getAuth = () => {
  const apiKey = localStorage.getItem('danbooru_api_key');
  const username = localStorage.getItem('danbooru_username');
  
  if (apiKey && username) {
    return {
        'ApiKey': apiKey,
        'Username': username,
    };
  }
  return {};
};

const api = axios.create({
  baseURL: 'https://danbooru.donmai.us',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to include auth headers on every request
api.interceptors.request.use((config) => {
  const { ApiKey, Username } = getAuth();

  if(!ApiKey || !Username) return config;

  config.params.set('api_key', ApiKey || '');
  config.params.set('login', Username || '');

  return config;
});

export const danbooruService = {
    fetchPosts: async (tags: string[], page: number, limit: number): Promise<FetchPostsResult> => {
        const response = await api.get<DanbooruPost[]>('/posts.json', {
            params: {
                tags: tags.join(' '),
                page,
                limit,
            }
        });

        const hasMore = response.data.length === limit;

        const activeBlacklistTags = getActiveBlacklistTags();
        if (activeBlacklistTags.size === 0) {
          return {
            posts: response.data,
            hasMore,
            page,
            limit,
            rawCount: response.data.length,
          };
        }

        const filteredPosts = response.data.filter(
          (post) => !hasBlacklistedTag(post, activeBlacklistTags)
        );

        return {
          posts: filteredPosts,
          hasMore,
          page,
          limit,
          rawCount: response.data.length,
        };
    },

    fetchPostById: async (id: number) => {
        const response = await api.get<DanbooruPost>(`/posts/${id}.json`);
        return response.data;
    },

    searchAutocomplete: async (query: string, limit = 20) => {
        const response = await api.get<AutocompleteResult[]>('/autocomplete.json', {
            params: {
                'search[query]': query,
                'search[type]': 'tag_query',
                version: 3,
                limit,
            }
        });
        return response.data;
    },
};