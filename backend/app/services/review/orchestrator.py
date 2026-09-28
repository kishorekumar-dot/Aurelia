"""
Enhanced Review Orchestrator
Selectively activates analyzers, gathers evidence, persists findings to DB,
and applies the full reasoning pipeline: claim classification, sufficiency,
authority, and decision routing.
"""
import os
import uuid
from typing import List, Dict, Any, Optional

from app.services.document.docx_parser import parse_docx
from app.services.document.pdf_parser import parse_pdf
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.formatting_analyzer import analyze_formatting
from app.services.analyzers.structure_analyzer import analyze_structure
from app.services.analyzers.figure_analyzer import analyze_figures
from app.services.analyzers.table_analyzer import analyze_tables
from app.services.analyzers.reference_analyzer import analyze_references
from app.services.analyzers.project_understanding import analyze_project_understanding, ProjectSummarySchema
from app.services.analyzers.innovation_analyzer import analyze_innovation
from app.services.evidence.evidence_builder import build_evidence, detect_contradictions
from app.services.reasoning.engines import classify_claim, check_evidence_sufficiency, determine_authority, route_decision
from app.services.ai.llm_client import LLMClient
from app.services.reports.student_report import generate_student_report
from app.services.reports.lecturer_report import generate_lecturer_report


def _parse_document(document_path: str) -> tuple[DocumentModel, Dict[str, Any]]:
    """Parse a DOCX or PDF into a normalized DocumentModel."""
    ext = os.path.splitext(document_path)[1].lower()
    if ext == ".docx":
        raw_data = parse_docx(document_path)
    elif ext == ".pdf":
        raw_data = parse_pdf(document_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    elements = []
    for el in raw_data["sections"]:
        base_fields = {"element_id", "type", "text", "section", "metadata"}
        metadata = el.get("metadata", {})
        for k, v in el.items():
            if k not in base_fields:
                metadata[k] = v
        el_clean = {k: v for k, v in el.items() if k in base_fields}
        el_clean["metadata"] = metadata
        elements.append(ElementModel(**el_clean))

    document = DocumentModel(
        metadata=raw_data["metadata"],
        elements=elements,
        markdown=raw_data["markdown"],
        full_text=raw_data["full_text"]
    )
    return document, raw_data


def _attach_evidence_to_finding(finding: Dict[str, Any], document_name: str) -> List[Dict[str, Any]]:
    """
    Build structured evidence for a finding using deterministic signals.
    For structural/formatting findings, confidence is 1.0.
    For LLM-based findings, confidence is passed through from the finding.
    """
    confidence = finding.get("confidence", 1.0)
    method = finding.get("method", "document_parser")
    observation = finding.get("claim", "Observation recorded")
    value = finding.get("status") == "VERIFIED"

    evidence = build_evidence(
        finding=finding,
        document_name=document_name,
        observation=observation,
        value=value,
        method=method,
        confidence=confidence
    )
    return [evidence]


def run_orchestrator(
    document_path: str,
    review_scope: Optional[List[str]] = None,
    formatting_policy: Optional[Dict[str, Any]] = None,
    required_sections: Optional[List[str]] = None,
    run_llm: bool = True,
    db=None,
    review_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main orchestration function.
    
    Args:
        document_path: Path to the student report file.
        review_scope: List of analyzer names to run. None = run all.
            Supported: ["FORMAT", "STRUCTURE", "FIGURES", "TABLES", "REFERENCES", "CONTENT", "INNOVATION"]
        formatting_policy: Dict with keys font_name, font_size_pt for formatting check.
        required_sections: List of section heading names required.
        run_llm: Whether to invoke LLM for semantic analysis.
        db: SQLAlchemy Session for persisting findings.
        review_id: DB review ID for persistence.
    
    Returns:
        Dict with student_report, lecturer_report, raw_findings, project_summary
    """
    # ── 1. Parse document ─────────────────────────────────────────────────────
    document, raw_data = _parse_document(document_path)
    document_name = os.path.basename(document_path)

    # Determine which analyzers to run (selective activation)
    all_scopes = {"FORMAT", "STRUCTURE", "FIGURES", "TABLES", "REFERENCES", "CONTENT", "INNOVATION"}
    active_scopes = set(review_scope) if review_scope else all_scopes

    raw_findings: List[Dict[str, Any]] = []

    # ── 2. Deterministic Analyzers ────────────────────────────────────────────
    if "FORMAT" in active_scopes:
        fmt_kwargs = {}
        if formatting_policy:
            if "font_name" in formatting_policy:
                fmt_kwargs["required_font"] = formatting_policy["font_name"]
            if "font_size_pt" in formatting_policy:
                fmt_kwargs["required_size_pt"] = formatting_policy["font_size_pt"]
        raw_findings.extend(analyze_formatting(document, **fmt_kwargs))

    if "STRUCTURE" in active_scopes:
        struct_kwargs = {}
        if required_sections:
            struct_kwargs["required_sections"] = required_sections
        raw_findings.extend(analyze_structure(document, **struct_kwargs))

    if "FIGURES" in active_scopes:
        raw_findings.extend(analyze_figures(document))

    if "TABLES" in active_scopes:
        raw_findings.extend(analyze_tables(document))

    if "REFERENCES" in active_scopes:
        raw_findings.extend(analyze_references(document))

    project_summary = None
    innovation_summary = None

    # ── 3. LLM Analyzers (semantic, selective) ────────────────────────────────
    if run_llm and ("CONTENT" in active_scopes or "INNOVATION" in active_scopes):
        try:
            llm = LLMClient()

            if "CONTENT" in active_scopes:
                proj = analyze_project_understanding(document, llm)
                project_summary = proj.model_dump()

            if "INNOVATION" in active_scopes:
                innov_finding = analyze_innovation(document, llm)
                innovation_summary = innov_finding.get("metadata")
                raw_findings.append(innov_finding)

        except Exception as e:
            print(f"[Orchestrator] LLM processing skipped: {e}")

    # ── 4. Evidence + Reasoning Pipeline ─────────────────────────────────────
    enriched_findings: List[Dict[str, Any]] = []
    db_finding_ids: List[int] = []

    for f in raw_findings:
        # Build evidence
        evidence_list = _attach_evidence_to_finding(f, document_name)
        contradicted = detect_contradictions(evidence_list)

        # Claim classification
        claim_class = classify_claim(f)
        sufficiency = check_evidence_sufficiency(f, evidence_list)
        authority = f.get("authority") or determine_authority(f, claim_class, sufficiency, contradicted)
        decision = route_decision(f, authority, sufficiency, contradicted)

        # Final status
        if contradicted:
            final_status = "CONTRADICTED"
        elif sufficiency == "SUFFICIENT":
            final_status = f.get("status", "VERIFIED")
        else:
            final_status = "INSUFFICIENT"

        enriched = {
            **f,
            "claim_class": claim_class,
            "sufficiency": sufficiency,
            "authority": authority,
            "status": final_status,
            "decision": decision,
            "evidence": evidence_list,
            "contradicted": contradicted
        }
        enriched_findings.append(enriched)

        # ── 5. Persist to DB if session provided ─────────────────────────────
        if db and review_id:
            try:
                from app.database.models import Finding, Evidence as EvidenceModel
                db_finding = Finding(
                    review_id=review_id,
                    claim=f.get("claim", ""),
                    category=f.get("category", "UNKNOWN"),
                    severity=f.get("severity", "MINOR"),
                    location=f.get("location"),
                    status=final_status,
                    authority=authority,
                    recommendation=f.get("recommendation", ""),
                    policy_id=None
                )
                db.add(db_finding)
                db.flush()  # get ID without commit

                for ev in evidence_list:
                    db_ev = EvidenceModel(
                        finding_id=db_finding.id,
                        source=ev.get("source", document_name),
                        location=ev.get("location"),
                        observation=ev.get("observation", ""),
                        value=ev.get("value"),
                        method=ev.get("method", "document_parser"),
                        confidence=ev.get("confidence", 1.0)
                    )
                    db.add(db_ev)

                db_finding_ids.append(db_finding.id)
            except Exception as db_err:
                print(f"[Orchestrator] DB persist error: {db_err}")

    if db and review_id:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Orchestrator] DB commit error: {e}")

    # ── 6. Generate Reports ───────────────────────────────────────────────────
    student_rep = generate_student_report(review_id or 0, enriched_findings, project_summary)
    lecturer_rep = generate_lecturer_report(review_id or 0, enriched_findings, project_summary, innovation_summary)

    return {
        "student_report": student_rep,
        "lecturer_report": lecturer_rep,
        "raw_findings": enriched_findings,
        "project_summary": project_summary,
        "innovation_summary": innovation_summary,
        "db_finding_ids": db_finding_ids
    }
