"""
Document Normalizer
Normalizes extracted document content into a unified internal representation:
Document:
    metadata
    pages[]
    sections[]
    paragraphs[]
    tables[]
    figures[]
    references[]
    formatting
    raw_text
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from app.services.document.document_model import DocumentModel, ElementModel


@dataclass
class NormalizedDocument:
    metadata: Dict[str, Any] = field(default_factory=dict)
    pages: List[Dict[str, Any]] = field(default_factory=list)
    sections: List[str] = field(default_factory=list)
    paragraphs: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    figures: List[Dict[str, Any]] = field(default_factory=list)
    references: List[str] = field(default_factory=list)
    formatting: Dict[str, Any] = field(default_factory=dict)
    raw_text: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metadata": self.metadata,
            "pages": self.pages,
            "sections": self.sections,
            "paragraphs": self.paragraphs,
            "tables": self.tables,
            "figures": self.figures,
            "references": self.references,
            "formatting": self.formatting,
            "raw_text": self.raw_text,
        }


def normalize_document(doc_model: DocumentModel) -> NormalizedDocument:
    """Transforms a DocumentModel into a structured NormalizedDocument."""
    norm = NormalizedDocument(
        metadata=doc_model.metadata or {},
        raw_text=doc_model.full_text or ""
    )

    seen_sections = set()
    for el in doc_model.elements:
        if el.section and el.section not in seen_sections:
            seen_sections.add(el.section)
            norm.sections.append(el.section)

        if el.type == "heading" and el.text:
            if el.text not in norm.sections:
                norm.sections.append(el.text)

        elif el.type == "paragraph":
            norm.paragraphs.append({
                "element_id": el.element_id,
                "text": el.text or "",
                "section": el.section,
                "metadata": el.metadata or {}
            })

        elif el.type == "table":
            norm.tables.append({
                "element_id": el.element_id,
                "section": el.section,
                "metadata": el.metadata or {}
            })

        elif el.type == "figure":
            norm.figures.append({
                "element_id": el.element_id,
                "section": el.section,
                "metadata": el.metadata or {}
            })

        elif el.type == "reference" and el.text:
            norm.references.append(el.text)

    # Document-level formatting summary
    if norm.paragraphs:
        fonts = [p["metadata"].get("font_name") for p in norm.paragraphs if p["metadata"].get("font_name")]
        sizes = [p["metadata"].get("font_size_pt") for p in norm.paragraphs if p["metadata"].get("font_size_pt")]
        norm.formatting = {
            "primary_font": max(set(fonts), key=fonts.count) if fonts else "Times New Roman",
            "primary_size": max(set(sizes), key=sizes.count) if sizes else 12,
            "paragraph_count": len(norm.paragraphs),
            "table_count": len(norm.tables),
            "figure_count": len(norm.figures),
            "reference_count": len(norm.references),
        }

    return norm
