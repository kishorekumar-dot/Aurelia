import os
import tempfile
import pytest
import fitz
from app.services.document.pdf_parser import parse_pdf

def test_parse_pdf_success():
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_name = tmp.name
        
    try:
        # Create a new PDF using PyMuPDF's document generation functions
        doc = fitz.open()
        
        # Set metadata
        doc.set_metadata({
            "title": "Quantum Cryptography PDF Test",
            "author": "Alice Smith"
        })
        
        # Add a page (A4 dimensions: 595 x 842 points)
        page = doc.new_page(width=595, height=842)
        
        # Insert text blocks mimicking an academic paper
        # We specify coordinates (x, y) and formatting parameters
        page.insert_text((50, 100), "Abstract", fontsize=14, fontname="helv")
        page.insert_text((50, 130), "This is the abstract paragraph content of the test document.", fontsize=10, fontname="helv")
        
        page.insert_text((50, 200), "1. Introduction", fontsize=14, fontname="helv")
        page.insert_text((50, 230), "This is a body text paragraph in section 1.", fontsize=10, fontname="helv")
        
        page.insert_text((50, 300), "Figure 1: Test Image Caption", fontsize=9, fontname="helv")
        
        doc.save(tmp_name)
        doc.close()
        
        # Parse the generated PDF using our parse_pdf parser
        result = parse_pdf(tmp_name)
        
        # Verify metadata extraction
        assert result["metadata"]["title"] == "Quantum Cryptography PDF Test"
        assert result["metadata"]["author"] == "Alice Smith"
        
        # Verify DOM sections hierarchy
        sections = result["sections"]
        assert len(sections) >= 5
        
        # 1. First Heading
        assert sections[0]["type"] == "heading"
        assert sections[0]["text"] == "Abstract"
        assert sections[0]["section"] == "Abstract"
        assert sections[0]["element_id"] == "HDG-001"
        
        # 2. Abstract Text
        assert sections[1]["type"] == "paragraph"
        assert "abstract paragraph content" in sections[1]["text"]
        assert sections[1]["section"] == "Abstract"
        assert sections[1]["element_id"] == "PAR-001"
        
        # 3. Second Heading
        assert sections[2]["type"] == "heading"
        assert sections[2]["text"] == "1. Introduction"
        assert sections[2]["section"] == "1. Introduction"
        assert sections[2]["element_id"] == "HDG-002"
        
        # 4. Introduction body
        assert sections[3]["type"] == "paragraph"
        assert "body text paragraph" in sections[3]["text"]
        assert sections[3]["section"] == "1. Introduction"
        assert sections[3]["element_id"] == "PAR-002"
        
        # 5. Caption
        assert sections[4]["type"] == "caption"
        assert sections[4]["text"] == "Figure 1: Test Image Caption"
        assert sections[4]["section"] == "1. Introduction"
        assert sections[4]["element_id"] == "CAP-001"
        
        # Verify markdown content conversions
        assert "# Abstract" in result["markdown"]
        assert "Figure 1: Test Image Caption" in result["markdown"]
        
        # Verify plain text output
        assert "Abstract" in result["full_text"]
        assert "Figure 1: Test Image Caption" in result["full_text"]
        
    finally:
        # Clean up temp file
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def test_parse_pdf_invalid_file():
    with pytest.raises(ValueError, match="Failed to open/parse PDF file"):
        parse_pdf("non_existent_file.pdf")
