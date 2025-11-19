import axios from 'axios';
import type { AutocompleteResult, DanbooruPost } from '../types';

const api = axios.create({
  baseURL: 'https://danbooru.donmai.us',
  headers: {
    'Content-Type': 'application/json',
  }
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