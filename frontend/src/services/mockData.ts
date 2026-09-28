// src/services/mockData.ts
import type { Finding, Policy, ProjectSummary, ReportMetrics, Agent } from '../types';

export const MOCK_PROJECT_SUMMARY: ProjectSummary = {
  title: "Smart Storage Monitoring System using IoT and Machine Learning",
  student: "Alex Rivera (Reg. No: CS-2024-8831)",
  department: "Department of Computer Science & Engineering",
  problem: "Post-harvest agricultural storage losses caused by undetected humidity, temperature spikes, and delayed ventilation controls.",
  objectives: [
    "Design low-power IoT sensor array for multi-chamber grain monitoring.",
    "Implement edge machine learning model for early spoilage prediction.",
    "Deliver real-time telemetry dashboard with automated ventilation triggers."
  ],
  solution: "An integrated hardware-software architecture utilizing ESP32 microcontrollers with DHT22/MQ-135 sensors transmitting telemetry over MQTT to a lightweight Random Forest predictive engine.",
  methodology: "Experimental setup in three controlled environmental chambers over 60 days, comparing baseline static storage vs sensor-augmented automated ventilation.",
  technologies: ["ESP32", "MQTT / Mosquitto", "Python", "Scikit-Learn", "FastAPI", "React", "TimescaleDB"],
  datasets: ["Self-collected environmental sensor dataset (142,000 readings across 60 days)"],
  results: "Achieved a 94.2% accuracy in predicting spoilage risk 12 hours prior to visible onset, reducing simulated grain loss by 38%.",
  conclusion: "Demonstrated that low-cost edge sensing combined with decision-tree classifiers effectively mitigates agricultural storage degradation.",
  claimed_contribution: "Novel multi-sensor fusion model optimized for low-bandwidth rural deployments with local fail-safe action rules.",
  simple_explanation: "This project builds small sensor boxes placed inside grain stores that measure heat and moisture, sending warning alerts to farmers' phones before crop spoilage occurs.",
  key_points: [
    "Hardware prototype validated in 3 thermal chambers.",
    "Dataset contains 142k verified sensor telemetry rows.",
    "Edge inference latency measured under 45ms.",
    "Requires clarification on Figure 7 caption and dataset repository link."
  ],
  viva_questions: [
    "Why did you select Random Forest over Lightweight LSTM models for edge deployment?",
    "How does the system handle sensor drift or hardware telemetry packet loss?",
    "What is the power consumption profile of the ESP32 node during continuous battery operation?"
  ]
};

export const MOCK_POLICIES: Policy[] = [
  {
    id: "FIG-001",
    code: "FIG-001",
    target: "Figures & Diagrams",
    requirement: "Every figure included in the report must have a numbered caption placed directly below the visual.",
    obligation: "MUST",
    source: "Academic Formatting Guidelines Sec 4.2",
    status: "ACTIVE",
    severity: "MAJOR"
  },
  {
    id: "REF-002",
    code: "REF-002",
    target: "References & Citations",
    requirement: "At least 60% of cited literature must be peer-reviewed papers published within the last 5 years.",
    obligation: "SHOULD",
    source: "Departmental Thesis Standard 2024",
    status: "ACTIVE",
    severity: "MINOR"
  },
  {
    id: "ETH-003",
    code: "ETH-003",
    target: "Data Integrity & Reproducibility",
    requirement: "All experimental claims involving custom datasets must state the dataset size, source, and accessibility URL.",
    obligation: "MUST",
    source: "Research Integrity Policy Sec 2.1",
    status: "ACTIVE",
    severity: "CRITICAL"
  },
  {
    id: "ALG-004",
    code: "ALG-004",
    target: "Methodology & Algorithms",
    requirement: "Algorithms must present formal pseudocode or a clear mathematical formulation prior to evaluation results.",
    obligation: "MUST",
    source: "Computer Science Project Manual",
    status: "ACTIVE",
    severity: "MAJOR"
  }
];

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 101,
    claim: "Figure 7 has no numbered caption below the diagram visual.",
    category: "Formatting",
    severity: "MAJOR",
    location: { page: 24, section: "4.1 Hardware Setup", figure: "Figure 7" },
    status: "VERIFIED",
    authority: "AUTOMATIC",
    policy_id: "FIG-001",
    policy_rule: "Every figure included in the report must have a numbered caption placed directly below the visual.",
    recommendation: "Add a numbered caption below Figure 7 (e.g., 'Figure 7: ESP32 Circuit Schematic and Sensor Pinouts').",
    evidence: [
      {
        observation: "Image element detected on Page 24 (y-coord: 420pt). Text element immediately following image is body paragraph, not caption syntax.",
        confidence: 0.98,
        method: "Computer Vision Layout Analysis",
        source: "Document Page 24 Layout Scanner"
      }
    ]
  },
  {
    id: 102,
    claim: "Section 3.2 references IEEE 802.15.4 standard without a corresponding entry in the References list.",
    category: "Reference",
    severity: "MINOR",
    location: { page: 18, section: "3.2 Communication Protocols" },
    status: "SUPPORTED",
    authority: "AUTOMATIC",
    policy_id: "REF-002",
    policy_rule: "All inline technical citations must resolve to a valid bibliography entry.",
    recommendation: "Insert IEEE 802.15.4 specification entry into the bibliography under reference [34].",
    evidence: [
      {
        observation: "In-text token '[IEEE 802.15.4]' detected on line 14. Bibliography parser found 32 entries, none matching this IEEE standard.",
        confidence: 0.94,
        method: "Citation Resolution Tree",
        source: "Bibliography Matcher"
      }
    ]
  },
  {
    id: 103,
    claim: "Novelty claim regarding edge inference latency requires lecturer validation against existing literature.",
    category: "Innovation",
    severity: "MAJOR",
    location: { page: 31, section: "5.3 Latency Benchmarks" },
    status: "NEEDS_REVIEW",
    authority: "LECTURER",
    policy_id: "ALG-004",
    policy_rule: "Claimed technical innovations must be evaluated for academic significance by qualified faculty.",
    recommendation: "Review whether 45ms inference latency on ESP32 constitutes a novel contribution or standard benchmark.",
    evidence: [
      {
        observation: "Author claims 45ms on ESP32 is 'industry-first performance'. Cross-reference with IEEE IoT Journal shows similar models achieve 38-50ms.",
        confidence: 0.82,
        method: "Semantic Cross-Document Search",
        source: "Scholar Knowledge Graph"
      }
    ]
  },
  {
    id: 104,
    claim: "Claimed 142,000 sensor telemetry dataset repository link is missing from Section 4.3.",
    category: "Integrity",
    severity: "CRITICAL",
    location: { page: 28, section: "4.3 Dataset Collection" },
    status: "CONTRADICTED",
    authority: "QUALIFIED_AI",
    policy_id: "ETH-003",
    policy_rule: "All experimental claims involving custom datasets must state dataset accessibility URL.",
    recommendation: "Provide GitHub / Zenodo DOI link for the 142k sensor reading dataset in Section 4.3.",
    evidence: [
      {
        observation: "Text states 'Dataset available at repository link below', but no hyperlink or repository URL exists in Section 4.3 or Appendix.",
        confidence: 0.96,
        method: "URL Extractor & Semantic Integrity Checker",
        source: "Integrity Agent"
      }
    ]
  },
  {
    id: 105,
    claim: "All table headings conform to APA 7th Edition style requirements.",
    category: "Formatting",
    severity: "INFO",
    location: { page: 12, section: "2.3 Literature Comparison Table" },
    status: "VERIFIED",
    authority: "AUTOMATIC",
    policy_id: "FIG-001",
    policy_rule: "Tables must include italicized title and horizontal rules above/below headers.",
    recommendation: "No change required.",
    evidence: [
      {
        observation: "Table 1 on Page 12 contains top/bottom border rules and italic title text above table boundary.",
        confidence: 0.99,
        method: "Layout Structure Parser",
        source: "Document Layout Scanner"
      }
    ]
  }
];

export const MOCK_METRICS: ReportMetrics = {
  total: 21,
  verified_automatic: 12,
  supported: 5,
  needs_review: 3,
  contradicted: 1,
  approved: 2,
  rejected: 0
};

export const MOCK_AGENTS: Agent[] = [
  {
    id: "compliance",
    name: "Format & Compliance Agent",
    description: "Verifies section structure, font sizes, figure captions, table formatting, and institutional layout guidelines.",
    iconName: "FileCheck",
    capabilities: ["Caption placement", "Margin & font audit", "Table numbering"],
    status: "ACTIVE",
    findingsCount: 5
  },
  {
    id: "content",
    name: "Content Understanding Agent",
    description: "Extracts core problem, methodology, results, and architecture from natural language document text.",
    iconName: "BrainCircuit",
    capabilities: ["Abstract analysis", "Methodology extraction", "Key contribution map"],
    status: "ACTIVE",
    findingsCount: 4
  },
  {
    id: "innovation",
    name: "Innovation & Contribution Agent",
    description: "Evaluates claimed technical novelty, comparing against academic benchmarks and highlighting expert review items.",
    iconName: "Sparkles",
    capabilities: ["Novelty detection", "Prior art comparison", "Viva question generator"],
    status: "ACTIVE",
    findingsCount: 3
  },
  {
    id: "reference",
    name: "Reference & Citation Agent",
    description: "Cross-checks inline citations against bibliography, detecting broken references and out-of-date literature.",
    iconName: "BookOpen",
    capabilities: ["Citation resolution", "Recency check", "DOIs validation"],
    status: "ACTIVE",
    findingsCount: 4
  },
  {
    id: "consistency",
    name: "Cross-Document Consistency Agent",
    description: "Validates harmony between abstract, objectives, experimental results, and conclusion summaries.",
    iconName: "GitCompare",
    capabilities: ["Objective-result pairing", "Terminological alignment", "Dataset size audit"],
    status: "ACTIVE",
    findingsCount: 3
  },
  {
    id: "integrity",
    name: "Integrity & Fact Validation Agent",
    description: "Verifies dataset accessibility links, code repository presence, mathematical equation consistency, and ethics statements.",
    iconName: "ShieldAlert",
    capabilities: ["Dataset accessibility", "Repo validation", "Mathematical logic check"],
    status: "ACTIVE",
    findingsCount: 2
  }
];
