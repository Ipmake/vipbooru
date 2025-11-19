// API Types
export interface DanbooruPost {
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
  sample_file_url: string;
  tag_string_general: string;
  tag_string_character: string;
  tag_string_copyright: string;
  tag_string_artist: string;
  tag_string_meta: string;
  has_large: boolean;
  file_size: number;
  // Other fields omitted for brevity
}

export interface AutocompleteResult {
  type: string;
  label: string;
  value: string;
  category: number;
  post_count: number;
  antecedent?: string;
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
