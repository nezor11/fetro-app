import api from './api';

export interface WPMedia {
  id: number;
  source_url: string;
  media_details: {
    sizes: {
      thumbnail?: { source_url: string };
      medium?: { source_url: string };
      large?: { source_url: string };
      full?: { source_url: string };
    };
  };
}

export async function getMedia(id: number): Promise<WPMedia> {
  const response = await api.get(`/media/${id}`);
  return response.data;
}
