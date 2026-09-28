// src/utils/storage.ts
// Synchronized persistence for Aurelia review workflow:
// Lecturer reviews -> Lecturer approves -> Lecturer publishes -> Student receives feedback -> Student resubmits

export interface StoredFinding {
  id: string | number;
  category: string;
  agent: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  citation: string;
  quote: string;
  verdict: string;
  recommendation: string;
  policy_id: string;
  policy_rule: string;
  location: {
    page: number;
    section: string;
    element_id?: string;
  };
  evidence: {
    observation: string;
    method: string;
    confidence: number;
    source: string;
  };
  authority: 'AUTOMATIC' | 'QUALIFIED_AI' | 'LECTURER';
  status: 'VERIFIED' | 'SUPPORTED' | 'NEEDS_REVIEW' | 'CONTRADICTED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'PUBLISHED';
  lecturerComment?: string;
}

export interface ReviewState {
  reviewId: string;
  title: string;
  author: string;
  studentEmail: string;
  department: string;
  version: number;
  status: 'SUBMITTED' | 'ANALYZING' | 'LECTURER_REVIEW' | 'PUBLISHED' | 'REVISION_REQUESTED';
  isPublished: boolean;
  publishedAt?: string;
  submissionDate: string;
  formatScore: number;
  contentScore: number;
  innovationScore: number;
  confidenceScore: number;
  routingDecision: 'AUTOMATIC' | 'LECTURER_REVIEW';
  findings: StoredFinding[];
  versions: {
    version: number;
    date: string;
    filename: string;
    changelog?: string;
    status: string;
  }[];
}

const DEFAULT_FINDINGS: StoredFinding[] = [
  {
    id: 'FND-01',
    category: 'Format',
    agent: 'Format Agent',
    severity: 'MAJOR',
    citation: 'Figure 7, Page 24',
    quote: 'Figure 7: Diagrammatic depiction of sensor mesh topology without numbered caption standard.',
    verdict: 'Figure detected; numbered caption below the diagram is missing as mandated by IEEE / Department standards.',
    recommendation: 'Add numbered caption below Figure 7 (e.g., "Figure 7: ESP32 Hardware Schematic and Sensor Wiring Pinouts").',
    policy_id: 'FIG-001',
    policy_rule: 'Every figure included in the report must have a numbered caption placed directly below the visual.',
    location: { page: 24, section: '4.1 Hardware Architecture', element_id: 'FIG-007' },
    evidence: {
      observation: 'Image container detected at y-coord 420pt. Next token is body text; caption syntax absent.',
      method: 'Document Layout Scanner & Computer Vision',
      confidence: 0.98,
      source: 'student_report_v1.pdf [Page 24]'
    },
    authority: 'AUTOMATIC',
    status: 'APPROVED',
  },
  {
    id: 'FND-02',
    category: 'Reference',
    agent: 'Reference Agent',
    severity: 'MINOR',
    citation: 'Section 3.2, Paragraph 2, Page 18',
    quote: 'Our communication protocol adheres to the IEEE 802.15.4 low-rate wireless personal area network standard.',
    verdict: 'In-text citation to IEEE 802.15.4 is present, but no matching bibliographic entry exists in the References list.',
    recommendation: 'Add IEEE 802.15.4 standard specification into the References bibliography section as reference entry [34].',
    policy_id: 'REF-002',
    policy_rule: 'All inline citations and technical standards must resolve to an explicit bibliography entry.',
    location: { page: 18, section: '3.2 Communication Protocols', element_id: 'REF-012' },
    evidence: {
      observation: 'In-text standard token IEEE 802.15.4 found. Bibliography table contains 32 entries, none matching IEEE 802.15.4.',
      method: 'Citation Resolution Graph Parser',
      confidence: 0.94,
      source: 'student_report_v1.pdf [Page 18]'
    },
    authority: 'AUTOMATIC',
    status: 'APPROVED',
  },
  {
    id: 'FND-03',
    category: 'Innovation',
    agent: 'Innovation Agent',
    severity: 'MAJOR',
    citation: 'Section 4.1, Page 29',
    quote: 'The proposed edge inference module achieves a 94.2% accuracy in predicting spoilage risk 12 hours prior to visible onset.',
    verdict: 'Literature comparison delta is verified against IEEE IoT Journal 2024 baselines; requires lecturer viva interrogation confirmation.',
    recommendation: 'Clarify the hyperparameter tuning and cross-validation protocol used on the 142k sensor dataset in Section 4.3.',
    policy_id: 'INNO-004',
    policy_rule: 'Claimed empirical contributions must state verification protocols and baseline comparative deltas.',
    location: { page: 29, section: '4.3 Validation Results', element_id: 'INNO-003' },
    evidence: {
      observation: 'Claim of 94.2% supported by confusion matrix in Table 4. Dataset size 142,000 readings verified.',
      method: 'Empirical Table Cross-Verification & Literature Search',
      confidence: 0.89,
      source: 'student_report_v1.pdf [Page 29]'
    },
    authority: 'LECTURER',
    status: 'NEEDS_REVIEW',
  },
  {
    id: 'FND-04',
    category: 'Integrity',
    agent: 'Consistency Agent',
    severity: 'CRITICAL',
    citation: 'Section 4.3, Page 28',
    quote: 'The 142,000 telemetry sensor dataset is hosted at the public repository link below for reproducibility.',
    verdict: 'CONTRADICTED: Text claims dataset is accessible at repository link below, but no hyperlink, DOI, or repository URL is provided.',
    recommendation: 'Insert active Zenodo DOI or GitHub repository link for the sensor dataset in Section 4.3 or Appendix A.',
    policy_id: 'ETH-003',
    policy_rule: 'All empirical claims relying on custom datasets must provide an accessible repository URL or DOI.',
    location: { page: 28, section: '4.3 Dataset Collection', element_id: 'INT-001' },
    evidence: {
      observation: 'Regex URL extractor found zero hyperlinks or URLs in Section 4.3 or Appendix. Claim of link availability is unfulfilled.',
      method: 'Deterministic Hyperlink & Integrity Checker',
      confidence: 0.99,
      source: 'student_report_v1.pdf [Page 28]'
    },
    authority: 'QUALIFIED_AI',
    status: 'CONTRADICTED',
  },
];

const INITIAL_REVIEW_STATE: ReviewState = {
  reviewId: 'REV-2026-081',
  title: 'Smart Storage Monitoring System using IoT and Machine Learning',
  author: 'Alex Rivera',
  studentEmail: 'alex.rivera@student.cambridge.edu',
  department: 'Computer Science & Technology',
  version: 1,
  status: 'LECTURER_REVIEW',
  isPublished: false,
  submissionDate: '18 SEP 2026',
  formatScore: 94,
  contentScore: 89,
  innovationScore: 91,
  confidenceScore: 96,
  routingDecision: 'AUTOMATIC',
  findings: DEFAULT_FINDINGS,
  versions: [
    {
      version: 1,
      date: '18 SEP 2026, 14:32',
      filename: 'alex_rivera_thesis_v1.pdf',
      changelog: 'Initial submission of complete academic project report for evaluation.',
      status: 'UNDER_REVIEW'
    }
  ]
};

const STORAGE_KEY = 'aurelia_active_review_v1';

export function getActiveReview(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read review from storage', e);
  }
  saveActiveReview(INITIAL_REVIEW_STATE);
  return INITIAL_REVIEW_STATE;
}

export function saveActiveReview(state: ReviewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save review to storage', e);
  }
}

export function updateFindingStatus(findingId: string | number, status: StoredFinding['status'], comment?: string): ReviewState {
  const current = getActiveReview();
  current.findings = current.findings.map(f => {
    if (f.id === findingId) {
      return {
        ...f,
        status,
        lecturerComment: comment !== undefined ? comment : f.lecturerComment
      };
    }
    return f;
  });
  saveActiveReview(current);
  return current;
}

export function publishReviewFeedback(): ReviewState {
  const current = getActiveReview();
  current.isPublished = true;
  current.status = 'PUBLISHED';
  current.publishedAt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  
  // Mark approved findings as published
  current.findings = current.findings.map(f => {
    if (f.status === 'APPROVED' || f.status === 'VERIFIED') {
      return { ...f, status: 'PUBLISHED' };
    }
    return f;
  });

  saveActiveReview(current);
  return current;
}

export function submitRevision(filename: string, changelog: string): ReviewState {
  const current = getActiveReview();
  const nextVersion = current.version + 1;
  current.version = nextVersion;
  current.status = 'SUBMITTED';
  current.isPublished = false; // Reset publication until lecturer reviews new version!
  current.submissionDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  
  // Add new version entry
  current.versions.unshift({
    version: nextVersion,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    filename,
    changelog,
    status: 'SUBMITTED'
  });

  // Re-evaluate findings: mark addressed ones
  current.findings = current.findings.map(f => {
    if (f.id === 'FND-01') {
      // Suppose figure caption was fixed
      return { ...f, status: 'APPROVED', verdict: 'Numbered caption "Figure 7: ESP32 Hardware Schematic" now correctly placed below graphic visual.' };
    }
    return f;
  });

  saveActiveReview(current);
  return current;
}
