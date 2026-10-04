"""
Format & Compliance Agent
Executes deterministic validation checks: font size, font family, margins,
heading existence, required sections, figures, and tables.
Does NOT invoke LLMs for what can be computed deterministically.
"""

from typing import List, Dict, Any, Optional
from app.services.document.document_model import DocumentModel
from app.services.analyzers.formatting_analyzer import analyze_formatting
from app.services.analyzers.structure_analyzer import analyze_structure
from app.services.analyzers.figure_analyzer import analyze_figures
from app.services.analyzers.table_analyzer import analyze_tables
from app.services.evidence.evidence_builder import build_structured_finding


class FormatAgent:
    """Specialized deterministic format compliance agent."""

    def analyze(
        self,
        document: DocumentModel,
        formatting_policy: Optional[Dict[str, Any]] = None,
        required_sections: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []

        # 1. Deterministic font & size checks
        font_kwargs = {}
        if formatting_policy:
            if "font_name" in formatting_policy:
                font_kwargs["required_font"] = formatting_policy["font_name"]
            if "font_size_pt" in formatting_policy:
                font_kwargs["required_size_pt"] = formatting_policy["font_size_pt"]
        
        raw_fmt = analyze_formatting(document, **font_kwargs)
        for f in raw_fmt:
            findings.append(build_structured_finding(
                category="FORMATTING",
                claim=f.get("claim", "Formatting violation"),
                status="VERIFIED",
                document_evidence={
                    "page": f.get("location", {}).get("page", "location_unavailable"),
                    "section": f.get("location", {}).get("section", "location_unavailable"),
                    "excerpt": f.get("claim", "")
                },
                applicable_rule={"rule_id": f.get("policy_id", "FMT-001"), "text": "Report styling rules"},
                confidence=1.0,
                authority_level="AUTOMATIC",
                severity=f.get("severity", "minor").lower(),
                recommendation=f.get("recommendation")
            ))

        # 2. Required section existence
        struct_kwargs = {}
        if required_sections:
            struct_kwargs["required_sections"] = required_sections
        raw_struct = analyze_structure(document, **struct_kwargs)
        for f in raw_struct:
            findings.append(build_structured_finding(
                category="STRUCTURE",
                claim=f.get("claim", "Structural requirement missing"),
                status="VERIFIED",
                document_evidence={
                    "page": 1,
                    "section": "Table of Contents / Body",
                    "excerpt": f.get("claim", "")
                },
                applicable_rule={"rule_id": f.get("policy_id", "STR-001"), "text": "Required structural sections"},
                confidence=1.0,
                authority_level="AUTOMATIC",
                severity=f.get("severity", "major").lower(),
                recommendation=f.get("recommendation")
            ))

        # 3. Figure & Table caption / numbering checks
        raw_figs = analyze_figures(document)
        for f in raw_figs:
            findings.append(build_structured_finding(
                category="FORMATTING",
                claim=f.get("claim", "Figure caption violation"),
                status="VERIFIED",
                document_evidence={
                    "page": "location_unavailable",
                    "section": f.get("location", {}).get("section", "location_unavailable"),
                    "excerpt": f.get("claim", "")
                },
                applicable_rule={"rule_id": "FIG-001", "text": "Figure numbering and caption policy"},
                confidence=0.95,
                authority_level="AUTOMATIC",
                severity="minor",
                recommendation=f.get("recommendation")
            ))

        raw_tables = analyze_tables(document)
        for f in raw_tables:
            findings.append(build_structured_finding(
                category="FORMATTING",
                claim=f.get("claim", "Table format violation"),
                status="VERIFIED",
                document_evidence={
                    "page": "location_unavailable",
                    "section": f.get("location", {}).get("section", "location_unavailable"),
                    "excerpt": f.get("claim", "")
                },
                applicable_rule={"rule_id": "TBL-001", "text": "Table styling policy"},
                confidence=0.95,
                authority_level="AUTOMATIC",
                severity="minor",
                recommendation=f.get("recommendation")
            ))

        return findings


format_agent = FormatAgent()
