import axios from 'axios';
import type { AutocompleteResult, DanbooruPost } from '../types';

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
    fetchPosts: async (tags: string[], page: number, limit: number) => {
        const response = await api.get<DanbooruPost[]>('/posts.json', {
            params: {
                tags: tags.join(' '),
                page,
                limit,
            }
        });
        return response.data;
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