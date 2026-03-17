import api from './api';

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  link: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  total: number;
}

export async function getPosts(
  page = 1,
  perPage = 10,
  categoryId?: number,
  search?: string
): Promise<PaginatedResponse<WPPost>> {
  const params: Record<string, unknown> = {
    page,
    per_page: perPage,
    _embed: true,
  };
  if (categoryId) params.categories = categoryId;
  if (search) params.search = search;

  const response = await api.get('/posts', { params });

  return {
    data: response.data,
    totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
    total: parseInt(response.headers['x-wp-total'] || '0', 10),
  };
}

export async function getPost(id: number): Promise<WPPost> {
  const response = await api.get(`/posts/${id}`, { params: { _embed: true } });
  return response.data;
}
