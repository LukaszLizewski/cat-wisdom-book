import { apiClient } from './client';
import type { Paginated, SemanticSearchResult, Wisdom, WisdomInput } from '../types';

function normalizeList(data: Paginated<Wisdom> | Wisdom[]): Paginated<Wisdom> {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, pageSize: data.length };
  }
  return data;
}

export async function fetchWisdomList(query?: string): Promise<Paginated<Wisdom>> {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  const data = await apiClient.get<Paginated<Wisdom> | Wisdom[]>(`/wisdom${search}`);
  return normalizeList(data);
}

export function fetchRandomWisdom(): Promise<Wisdom> {
  return apiClient.get<Wisdom>('/wisdom/random');
}

export function fetchWisdomById(id: string): Promise<Wisdom> {
  return apiClient.get<Wisdom>(`/wisdom/${id}`);
}

export function createWisdom(payload: WisdomInput): Promise<Wisdom> {
  return apiClient.post<Wisdom>('/wisdom', payload);
}

export function updateWisdom(id: string, payload: WisdomInput): Promise<Wisdom> {
  return apiClient.put<Wisdom>(`/wisdom/${id}`, payload);
}

export function deleteWisdom(id: string): Promise<void> {
  return apiClient.delete<void>(`/wisdom/${id}`);
}

export async function searchSemantic(query: string): Promise<SemanticSearchResult[]> {
  return apiClient.post<SemanticSearchResult[]>('/search/semantic', { query });
}
