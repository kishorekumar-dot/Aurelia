"""
Deterministic Document Validation Checks
Implements pure Python/code validation functions without invoking any LLMs.
Checks:
- check_font_size(document, policy)
- check_margin(document, policy)
- check_required_sections(document, policy)
- check_heading_structure(document, policy)
- check_figure_captions(document, policy)
- check_reference_count(document, policy)
"""

from typing import Dict, Any, List, Optional
from app.services.document.document_model import DocumentModel


def check_font_size(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Validates that paragraph text matches required font size policy."""
    required_size = (policy or {}).get("font_size_pt", 12)
    violations = []

    for el in document.elements:
        if el.type == "paragraph":
            size = el.metadata.get("font_size_pt")
            if size is not None and size != required_size:
                violations.append({
                    "element_id": el.element_id,
                    "section": el.section,
                    "actual_size": size,
                    "expected_size": required_size,
                    "passed": False,
                    "message": f"Paragraph size {size}pt violates required {required_size}pt standard."
                })
    return violations


def check_margin(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Checks page margins if specified in metadata or policy."""
    expected_margin_inches = (policy or {}).get("margin_inches", 1.0)
    actual_margin = document.metadata.get("margin_inches")
    violations = []

    if actual_margin is not None and abs(actual_margin - expected_margin_inches) > 0.1:
        violations.append({
            "actual_margin": actual_margin,
            "expected_margin": expected_margin_inches,
            "passed": False,
            "message": f"Document margin {actual_margin}in differs from required {expected_margin_inches}in standard."
        })
    return violations


def check_required_sections(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Checks presence of required academic headings/sections."""
    required = (policy or {}).get("required_sections") or [
        "Introduction", "Methodology", "Results", "Conclusion"
    ]
    detected_headings = set()
    for el in document.elements:
        if el.type == "heading" and el.text:
            detected_headings.add(el.text.lower())
        if el.section:
            detected_headings.add(el.section.lower())

    missing = []
    for req in required:
        if not any(req.lower() in h for h in detected_headings):
            missing.append(req)

    violations = []
    if missing:
        violations.append({
            "missing_sections": missing,
            "passed": False,
            "message": f"Missing mandatory structural sections: {', '.join(missing)}."
        })
    return violations


def check_heading_structure(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Verifies that headings follow proper hierarchy (e.g. H1 before H2)."""
    violations = []
    last_level = 0

    for el in document.elements:
        if el.type == "heading":
            level = el.metadata.get("level", 1)
            if level > last_level + 1 and last_level != 0:
                violations.append({
                    "element_id": el.element_id,
                    "heading_text": el.text,
                    "level": level,
                    "last_level": last_level,
                    "passed": False,
                    "message": f"Skipped heading level from H{last_level} directly to H{level}."
                })
            last_level = level
    return violations


def check_figure_captions(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Ensures figures have descriptive captions."""
    violations = []
    for idx, el in enumerate(document.elements):
        if el.type == "figure":
            has_caption = False
            # Check adjacent element
            if idx + 1 < len(document.elements):
                next_el = document.elements[idx + 1]
                if next_el.type == "caption":
                    has_caption = True
            if not has_caption and not el.metadata.get("caption"):
                violations.append({
                    "element_id": el.element_id,
                    "passed": False,
                    "message": f"Figure '{el.element_id}' is missing a descriptive caption."
                })
    return violations


def check_reference_count(document: DocumentModel, policy: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Verifies reference count meets minimum academic threshold."""
    min_refs = (policy or {}).get("min_references", 5)
    refs = [el for el in document.elements if el.type == "reference"]
    count = len(refs)

    violations = []
    if count < min_refs:
        violations.append({
            "actual_count": count,
            "expected_min": min_refs,
            "passed": False,
            "message": f"Document has {count} references, but policy requires at least {min_refs}."
        })
    return violations
