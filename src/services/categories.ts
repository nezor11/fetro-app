import api from './api';

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
}

export async function getCategories(
  perPage = 100,
  hideEmpty = true
): Promise<WPCategory[]> {
  const response = await api.get('/categories', {
    params: { per_page: perPage, hide_empty: hideEmpty },
  });
  return response.data;
}
