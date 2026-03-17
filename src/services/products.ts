import api from './api';
import { PaginatedResponse } from './posts';

export interface WPProduct {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  link: string;
  product_cat: number[];
  especialidad: number[];
}

export async function getProducts(
  page = 1,
  perPage = 10,
  search?: string
): Promise<PaginatedResponse<WPProduct>> {
  const params: Record<string, unknown> = {
    page,
    per_page: perPage,
    _embed: true,
  };
  if (search) params.search = search;

  const response = await api.get('/product', { params });

  return {
    data: response.data,
    totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
    total: parseInt(response.headers['x-wp-total'] || '0', 10),
  };
}

export async function getProduct(id: number): Promise<WPProduct> {
  const response = await api.get(`/product/${id}`, { params: { _embed: true } });
  return response.data;
}
