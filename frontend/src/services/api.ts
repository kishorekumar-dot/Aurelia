// src/services/api.ts
import type { 
  Review, 
  Policy, 
  Report, 
  ProjectSummary 
} from '../types';

import { 
  MOCK_FINDINGS, 
  MOCK_POLICIES, 
  MOCK_PROJECT_SUMMARY, 
  MOCK_METRICS 
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const IS_DEMO = true; // Safe fallback demo mode

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("academic_review_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(errData.detail || `HTTP Error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (IS_DEMO) {
      console.warn(`API call to ${endpoint} failed, utilizing Demo Mode fallback.`, err);
      return getMockFallback<T>(endpoint);
    }
    throw err;
  }
}

// Fallback mock router for offline / standalone frontend evaluation
function getMockFallback<T>(endpoint: string): T {
  if (endpoint.startsWith("/reviews") && endpoint.endsWith("/report")) {
    return {
      review_id: 1,
      status: "COMPLETED",
      metrics: MOCK_METRICS,
      verified_findings: MOCK_FINDINGS.filter(f => f.status === "VERIFIED"),
      supported_findings: MOCK_FINDINGS.filter(f => f.status === "SUPPORTED"),
      review_findings: MOCK_FINDINGS.filter(f => f.status === "NEEDS_REVIEW"),
      contradicted_findings: MOCK_FINDINGS.filter(f => f.status === "CONTRADICTED"),
      all_findings: MOCK_FINDINGS,
      project_summary: MOCK_PROJECT_SUMMARY
    } as unknown as T;
  }

  if (endpoint.startsWith("/reviews") && endpoint.includes("/summary")) {
    return MOCK_PROJECT_SUMMARY as unknown as T;
  }

  if (endpoint.startsWith("/policies")) {
    return MOCK_POLICIES as unknown as T;
  }

  if (endpoint.startsWith("/reviews")) {
    return [
      {
        id: 1,
        project_title: "Smart Storage Monitoring System using IoT",
        student_name: "Alex Rivera",
        department: "Computer Science",
        academic_year: "2024-2025",
        status: "COMPLETED",
        document_id: 101,
        document_filename: "Alex_Rivera_Thesis_Final_Draft.pdf",
        created_at: new Date().toISOString(),
        finding_count: 21,
        verified_count: 12,
        needs_review_count: 3
      },
      {
        id: 2,
        project_title: "Automated Crop Disease Classification",
        student_name: "Elena Rostova",
        department: "Agricultural Engineering",
        academic_year: "2024-2025",
        status: "COMPLETED",
        document_id: 102,
        document_filename: "Rostova_Crop_Disease_Model.pdf",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        finding_count: 16,
        verified_count: 10,
        needs_review_count: 2
      }
    ] as unknown as T;
  }

  return {} as T;
}

export const api = {
  getReviews: () => fetchApi<Review[]>("/reviews"),
  getReviewReport: (id: string | number) => fetchApi<Report>(`/reviews/${id}/report`),
  getProjectSummary: (id: string | number) => fetchApi<ProjectSummary>(`/reviews/${id}/summary`),
  getPolicies: () => fetchApi<Policy[]>("/policies"),
  updateFindingStatus: async (findingId: number, status: string, notes?: string) => {
    console.log(`Updating finding ${findingId} status to ${status} (${notes})`);
    return { success: true, findingId, status };
  },
  createPolicy: async (policy: Partial<Policy>) => {
    return { id: `POL-${Date.now()}`, ...policy, status: 'ACTIVE' };
  }
};
