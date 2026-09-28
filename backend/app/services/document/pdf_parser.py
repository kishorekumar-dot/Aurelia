import os
import pymupdf as fitz  # PyMuPDF
from typing import Dict, Any, List

class PDFParser:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def parse(self) -> Dict[str, Any]:
        return parse_pdf(self.file_path)

def parse_pdf(file_path: str) -> dict:
    if not os.path.exists(file_path):
        raise ValueError(f"Failed to open/parse PDF file: {file_path}")
        
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise ValueError(f"Failed to open/parse PDF file: {e}")
        
    metadata = {
        "title": doc.metadata.get("title") or os.path.basename(file_path),
        "author": doc.metadata.get("author") or "",
    }
    
    sections = []
    full_text_parts = []
    markdown_parts = []
    
    hdg_count = 0
    par_count = 0
    cap_count = 0
    current_section = "General"
    
    for page in doc:
        try:
            blocks = page.get_text("dict").get("blocks", [])
        except Exception:
            blocks = []
            
        for block in blocks:
            if block.get("type", 0) == 0:  # text block
                lines_text = []
                max_size = 0.0
                for line in block.get("lines", []):
                    span_texts = []
                    for span in line.get("spans", []):
                        span_texts.append(span.get("text", ""))
                        if span.get("size", 0.0) > max_size:
                            max_size = span.get("size", 0.0)
                    line_str = "".join(span_texts).strip()
                    if line_str:
                        lines_text.append(line_str)
                        
                block_text = " ".join(lines_text).strip()
                if not block_text:
                    continue
                    
                full_text_parts.append(block_text)
                
                # Detect element type
                # Check for Figure / Table caption
                lower = block_text.lower()
                if lower.startswith("figure ") or lower.startswith("fig.") or lower.startswith("table "):
                    cap_count += 1
                    element_id = f"CAP-{cap_count:03d}"
                    sections.append({
                        "element_id": element_id,
                        "type": "caption",
                        "text": block_text,
                        "section": current_section,
                        "metadata": {}
                    })
                    markdown_parts.append(f"*{block_text}*")
                # Check for Heading: large font size >= 12 or short section keywords
                elif max_size >= 12.0 or (len(block_text) < 70 and any(w in lower for w in ["abstract", "introduction", "background", "methodology", "system", "architecture", "evaluation", "results", "conclusion", "references"]) and not block_text.endswith(".")):
                    hdg_count += 1
                    current_section = block_text
                    element_id = f"HDG-{hdg_count:03d}"
                    sections.append({
                        "element_id": element_id,
                        "type": "heading",
                        "text": block_text,
                        "heading": block_text,
                        "section": current_section,
                        "metadata": {"size": max_size}
                    })
                    markdown_parts.append(f"# {block_text}")
                else:
                    par_count += 1
                    element_id = f"PAR-{par_count:03d}"
                    sections.append({
                        "element_id": element_id,
                        "type": "paragraph",
                        "text": block_text,
                        "section": current_section,
                        "metadata": {}
                    })
                    markdown_parts.append(block_text)
                    
    full_text_content = "\n\n".join(full_text_parts).strip()
    markdown_content = "\n\n".join(markdown_parts).strip()
    
    return {
        "title": metadata["title"],
        "metadata": metadata,
        "sections": sections,
        "markdown": markdown_content,
        "full_text": full_text_content,
        "num_pages": len(doc),
        "references": [line for line in full_text_parts if "reference" in line.lower() or "[" in line]
    }

