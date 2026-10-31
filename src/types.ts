// API Types
export interface MediaAssetVariant {
  type: string;
  url: string;
  width: number;
  height: number;
  file_ext: string;
}

export interface MediaAsset {
  id: number;
  created_at: string;
  updated_at: string;
  md5: string;
  file_ext: string;
  file_size: number;
  image_width: number;
  image_height: number;
  duration: number | null;
  status: string;
  file_key: string;
  is_public: boolean;
  pixel_hash: string;
  variants: MediaAssetVariant[];
}

export interface DanbooruPost {
  // Existing fields
  id: number;
  created_at: string;
  uploader_id: number;
  score: number;
  source: string;
  md5: string;
  rating: string;
  image_width: number;
  image_height: number;
  tag_string: string;
  fav_count: number;
  file_ext: string;
  file_url: string;
  large_file_url: string;
  preview_file_url: string;
  sample_file_url?: string;
  tag_string_general: string;
  tag_string_character: string;
  tag_string_copyright: string;
  tag_string_artist: string;
  tag_string_meta: string;
  has_large: boolean;
  file_size: number;

  // Additional fields from payload
  updated_at: string;
  last_comment_bumped_at: string | null;
  last_commented_at: string | null;
  last_noted_at: string | null;
  parent_id: number | null;
  approver_id: number | null;
  pixiv_id: number | null;
  up_score: number;
  down_score: number;
  bit_flags: number;
  tag_count: number;
  tag_count_general: number;
  tag_count_artist: number;
  tag_count_character: number;
  tag_count_copyright: number;
  tag_count_meta: number;
  has_children: boolean;
  has_active_children: boolean;
  has_visible_children: boolean;
  is_pending: boolean;
  is_flagged: boolean;
  is_deleted: boolean;
  is_banned: boolean;
  media_asset?: MediaAsset;
}

export interface AutocompleteResult {
  type: string;
  label: string;
  value: string;
  category: number;
  post_count: number;
  antecedent?: string;
}

export interface BlacklistTagSetting {
  tag: string;
  enabled: boolean;
}

export const BLACKLIST_STORAGE_KEY = 'danbooru_blacklist_tags';

export interface FetchPostsResult {
  posts: DanbooruPost[];
  hasMore: boolean;
  page: number;
  limit: number;
  rawCount: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  filesize?: number;
  startTime?: number;
  endTime?: number;
}

export interface Config {
  apiKey: string;
  login: string;
  downloadDir: string; // Keep for backward compatibility
  downloadDirs: string[]; // Array of download directories
  lastUsedDownloadDir: string; // Track the last used directory
  port: number;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isDrive?: boolean;
  isParent?: boolean;
}

export interface DirectoryListing {
  path: string;
  directories: DirectoryEntry[];
}

// WebSocket Message Types
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
}

// API Service Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
