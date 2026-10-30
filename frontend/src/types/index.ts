// Shared TypeScript interfaces mirroring backend DTOs.

export interface AuthResponse {
  token: string;
}

export interface Wisdom {
  id: string;
  text: string;
  author: string | null;
  category: string | null;
  isOwn: boolean;
  createdAt: string;
}

export interface WisdomInput {
  text: string;
  author?: string | null;
  category?: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SemanticSearchResult {
  wisdom: Wisdom;
  score: number;
}

export interface ApiErrorBody {
  message?: string;
}
