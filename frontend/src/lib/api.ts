import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // En production sur Vercel, on utilise le préfixe de route relatif
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/_/backend";
  }
  // En local, on appelle le port 8000
  return "http://localhost:8000";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

export interface MediaItem {
  id: string;
  file_url: string;
  thumbnail_url: string;
  type: "photo" | "video";
  legende: string | null;
  date_prise: string | null;
  annee: number | null;
  approved_at: string | null;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  status?: "pending" | "approved" | "rejected";
  raison_rejet?: string | null;
  likes?: number;
  reposts?: number;
  shares?: number;
}

export interface PublicMediaResponse {
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
  items: MediaItem[];
}

export const uploadMedia = async (formData: FormData) => {
  const res = await api.post("/api/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getPublicMedia = async (page = 1, annee?: number): Promise<PublicMediaResponse> => {
  const params: Record<string, unknown> = { page, per_page: 24 };
  if (annee) params.annee = annee;
  const res = await api.get("/api/media/public", { params });
  return res.data;
};

export const getTimeline = async () => {
  const res = await api.get("/api/media/timeline");
  return res.data as { annee: number; count: number }[];
};

export const getSingleMedia = async (mediaId: string): Promise<MediaItem> => {
  const res = await api.get(`/api/media/${mediaId}`);
  return res.data;
};

export interface AppStats {
  years_of_history: number;
  total_memories: number;
  total_comments: number;
}

export const getStats = async (): Promise<AppStats> => {
  const res = await api.get("/api/media/stats");
  return res.data;
};

export const likeMedia = async (id: string, action: "like" | "unlike" = "like"): Promise<{ likes: number }> => {
  const res = await api.post(`/api/media/${id}/like`, null, { params: { action } });
  return res.data;
};

export const repostMedia = async (id: string, action: "repost" | "unrepost" = "repost"): Promise<{ reposts: number }> => {
  const res = await api.post(`/api/media/${id}/repost`, null, { params: { action } });
  return res.data;
};

export const shareMedia = async (id: string): Promise<void> => {
  await api.post(`/api/media/${id}/share`).catch(() => {});
};

export const getPopularMedia = async (page = 1): Promise<PublicMediaResponse> => {
  const res = await api.get("/api/media/popular", { params: { page, per_page: 10 } });
  return res.data;
};

// --- Admin ---

export const getPendingMedia = async (secret: string) => {
  const res = await api.get("/api/admin/pending", {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export const approveMedia = async (id: string, secret: string) => {
  const res = await api.post(`/api/admin/approve/${id}`, null, {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export const rejectMedia = async (id: string, secret: string, raison?: string) => {
  const params: Record<string, string> = {};
  if (raison) params.raison = raison;
  const res = await api.post(`/api/admin/reject/${id}`, null, {
    params,
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export const getContributionToken = async (secret: string) => {
  const res = await api.get("/api/admin/token", {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data as { token: string };
};

export const regenerateToken = async (secret: string) => {
  const res = await api.post("/api/admin/token/regenerate", null, {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data as { token: string };
};

export const getAllMedia = async (secret: string, status?: string) => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const res = await api.get("/api/admin/all", {
    params,
    headers: { "X-Admin-Secret": secret },
  });
  return res.data as MediaItem[];
};

export const unpublishMedia = async (id: string, secret: string) => {
  const res = await api.post(`/api/admin/unpublish/${id}`, null, {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

// --- Comments ---

export interface CommentItem {
  id: string;
  media_id: string;
  author: string;
  content: string;
  created_at: string;
  media_thumbnail?: string | null;
}

export const getComments = async (mediaId: string): Promise<CommentItem[]> => {
  const res = await api.get(`/api/comments/${mediaId}`);
  return res.data;
};

export const createComment = async (mediaId: string, author: string, content: string) => {
  const formData = new FormData();
  formData.append("author", author);
  formData.append("content", content);
  const res = await api.post(`/api/comments/${mediaId}`, formData);
  return res.data;
};

export const getPendingComments = async (secret: string): Promise<CommentItem[]> => {
  const res = await api.get("/api/admin/comments/pending", {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export const approveComment = async (commentId: string, secret: string) => {
  const res = await api.post(`/api/admin/comments/approve/${commentId}`, null, {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export const rejectComment = async (commentId: string, secret: string) => {
  const res = await api.post(`/api/admin/comments/reject/${commentId}`, null, {
    headers: { "X-Admin-Secret": secret },
  });
  return res.data;
};

export default api;
