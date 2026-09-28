from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

@dataclass
class ElementModel:
    """
    Represents a normalized document element in the DOM.
    """
    element_id: str
    type: str  # heading, paragraph, table, figure, caption, reference
    text: Optional[str] = None
    section: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if self.metadata and "level" in self.metadata:
            d["level"] = self.metadata["level"]
        if self.metadata and "rows" in self.metadata:
            d["rows"] = self.metadata["rows"]
        return d


@dataclass
class DocumentModel:
    """
    Represents the full normalized document containing metadata, elements, and text representations.
    """
    metadata: Dict[str, Any]
    elements: List[ElementModel]
    markdown: str
    full_text: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metadata": self.metadata,
            "sections": [el.to_dict() for el in self.elements],  # Keeps key name 'sections' for backward compatibility
            "markdown": self.markdown,
            "full_text": self.full_text
        }
