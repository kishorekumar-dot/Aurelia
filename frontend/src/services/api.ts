// src/services/api.ts
import type {
  Review,
  Policy,
  Report,
  ProjectSummary
} from '../types';
import { TOKEN_KEY } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errData.detail || `HTTP Error ${res.status}`);
  }

  return await res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string, role?: string) =>
    fetchApi<{ access_token: string; user: { id: number; username: string; email: string; role: string; full_name?: string; department?: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
  register: (data: { username: string; email: string; password: string; role?: string; full_name?: string; department?: string }) =>
    fetchApi<{ access_token: string; user: Record<string, unknown> }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () =>
    fetchApi<{ id: number; username: string; email: string; role: string; full_name?: string; department?: string }>("/auth/me"),

  // Documents
  uploadDocument: (file: File, documentType = "STUDENT_PAPER") => {
    const form = new FormData();
    form.append("file", file);
    form.append("document_type", documentType);
    return fetchApi<{ id: number; filename: string; content_type: string; upload_date: string; storage_path: string; document_type: string; file_size_bytes: number }>("/documents", {
      method: "POST",
      body: form,
    });
  },
  getDocument: (id: number) =>
    fetchApi<{ id: number; filename: string }>(`/documents/${id}`),

  // Reviews
  getReviews: () => fetchApi<Review[]>("/reviews"),
  createReview: (documentId: number, title: string, studentName: string, ruleId?: number) =>
    fetchApi<{ id: number; status: string; current_stage: string; message: string }>("/reviews", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId, title, student_name: studentName, rule_id: ruleId }),
    }),
  getReview: (id: number | string) => fetchApi<Record<string, unknown>>(`/reviews/${id}`),
  getReviewEvents: (id: number | string) => fetchApi<{ status: string; current_stage: string; stages: { stage: string; status: string; index: number; total: number }[] }>(`/reviews/${id}/events`),
  getReviewReport: (id: number | string) => fetchApi<Report>(`/reports/${id}`),
  getReviewSummary: (id: number | string) => fetchApi<ProjectSummary>(`/reviews/${id}/summary`),
  publishReview: (id: number | string, lecturerNotes?: string) =>
    fetchApi(`/reviews/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ lecturer_notes: lecturerNotes }),
    }),
  rerunReview: (id: number | string) =>
    fetchApi(`/reviews/${id}/run`, { method: "POST" }),
  createDecision: (reviewId: number | string, action: string, note?: string) =>
    fetchApi(`/reviews/${reviewId}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, note }),
    }),

  // Policies
  getPolicies: (reviewId?: number) =>
    fetchApi<Policy[]>(`/policies${reviewId ? `?review_id=${reviewId}` : ""}`),
  parsePolicy: (naturalRule: string, reviewId?: number) =>
    fetchApi("/policies/parse", {
      method: "POST",
      body: JSON.stringify({ natural_rule: naturalRule, review_id: reviewId }),
    }),
  deletePolicy: (id: number) =>
    fetchApi(`/policies/${id}`, { method: "DELETE" }),

  // Findings
  approveFinding: (findingId: number, comment?: string) =>
    fetchApi(`/findings/${findingId}/approve`, {
      method: "POST",
      body: JSON.stringify({ action: "APPROVE", comment }),
    }),
  rejectFinding: (findingId: number, comment?: string) =>
    fetchApi(`/findings/${findingId}/reject`, {
      method: "POST",
      body: JSON.stringify({ action: "REJECT", comment }),
    }),
  modifyFinding: (findingId: number, severity?: string, recommendation?: string, comment?: string) =>
    fetchApi(`/findings/${findingId}/modify`, {
      method: "POST",
      body: JSON.stringify({ severity, recommendation, comment }),
    }),

  // Rules
  getRules: () => fetchApi<{ id: number; title: string; description: string; version: string; active_policy?: any }[]>("/rules"),
  uploadRule: (title: string, description?: string, file?: File, rawText?: string) => {
    const form = new FormData();
    form.append("title", title);
    if (description) form.append("description", description);
    if (rawText) form.append("raw_text", rawText);
    if (file) form.append("file", file);
    return fetchApi<{ id: number; title: string; description: string; version: string }>("/rules", {
      method: "POST",
      body: form,
    });
  },
};
