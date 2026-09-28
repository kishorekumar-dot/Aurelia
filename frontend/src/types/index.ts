// src/types/index.ts
// Central type definitions for AcademicReview AI

export interface Document {
  id: number;
  filename: string;
  document_type: string;
  file_size_bytes?: number;
  uploaded_at?: string;
  total_pages?: number;
}

export interface Evidence {
  id?: number;
  observation: string;
  value?: unknown;
  method?: string;
  confidence: number; // 0 to 1
  location?: {
    page?: number;
    section?: string;
    figure?: string;
    bbox?: number[];
  };
  source?: string;
}

export interface Finding {
  id: number;
  claim: string;
  category: 'Formatting' | 'Content' | 'Innovation' | 'Reference' | 'Consistency' | 'Integrity';
  severity: 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL';
  location?: {
    page?: number;
    section?: string;
    figure?: string;
  };
  status: 'VERIFIED' | 'SUPPORTED' | 'NEEDS_REVIEW' | 'CONTRADICTED' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  authority: 'AUTOMATIC' | 'QUALIFIED_AI' | 'LECTURER';
  recommendation?: string;
  policy_id?: string | number;
  policy_rule?: string;
  evidence?: Evidence[];
  created_at?: string;
}

export interface Policy {
  id: number | string;
  code: string;
  target: string;
  requirement: string;
  constraints?: Record<string, unknown>;
  obligation: 'MUST' | 'SHOULD' | 'MAY';
  source: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  created_at?: string;
}

export interface Review {
  id: number;
  project_title: string;
  student_name: string;
  department: string;
  academic_year: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  document_id: number;
  document_filename?: string;
  created_at?: string;
  finding_count?: number;
  verified_count?: number;
  needs_review_count?: number;
}

export interface ReportMetrics {
  total: number;
  verified_automatic: number;
  supported: number;
  needs_review: number;
  contradicted: number;
  approved?: number;
  rejected?: number;
}

export interface Report {
  review_id: number;
  status: string;
  metrics: ReportMetrics;
  verified_findings: Finding[];
  supported_findings: Finding[];
  review_findings: Finding[];
  contradicted_findings: Finding[];
  all_findings: Finding[];
  project_summary?: ProjectSummary;
}

export interface ProjectSummary {
  title: string;
  student: string;
  department: string;
  problem: string;
  objectives: string[];
  solution: string;
  methodology: string;
  technologies: string[];
  datasets: string[];
  results: string;
  conclusion: string;
  claimed_contribution: string;
  simple_explanation: string;
  key_points: string[];
  viva_questions: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  iconName: string;
  capabilities: string[];
  status: 'ACTIVE' | 'IDLE' | 'ANALYZING';
  findingsCount: number;
}
