import os
import json
from app.services.document.docx_parser import parse_docx
from app.services.document.pdf_parser import parse_pdf

# Create output folder if it doesn't exist
os.makedirs("outputs", exist_ok=True)

# Determine path to check. We will look for student_report.docx, student_report.pdf, 
# or default to sample_paper.docx (or a sample PDF if we create one).
candidates = [
    "sample_documents/student_report.docx",
    "../sample_documents/student_report.docx",
    "sample_documents/sample_paper.docx",
    "../sample_documents/sample_paper.docx"
]
file_path = next((c for c in candidates if os.path.exists(c)), "sample_documents/sample_paper.docx")

print(f"Parsing document into DOM: {file_path}")

try:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".docx":
        data = parse_docx(file_path)
    elif ext == ".pdf":
        data = parse_pdf(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    print("Document parsed successfully.")

    print("\nMetadata:")
    print(f"- Title: {data['metadata']['title']}")
    print(f"- Author: {data['metadata']['author']}")

    print("\nDOM Elements Summary (First 15 elements):")
    counts = {}
    for idx, el in enumerate(data["sections"]):
        el_type = el["type"]
        counts[el_type] = counts.get(el_type, 0) + 1
        
        if idx < 15:
            sec_context = el["section"] or "ROOT"
            preview = el["text"] or "[No Text]"
            if len(preview) > 60:
                preview = preview[:57] + "..."
            print(f"- [{el['element_id']}] Type: {el_type:<10} | Section: {sec_context:<25} | Preview: '{preview}'")

    if len(data["sections"]) > 15:
        print(f"- ... and {len(data['sections']) - 15} more elements.")

    print(f"\nElement Type Counts:")
    for el_type, count in counts.items():
        print(f"- {el_type.capitalize()}: {count}")

    # Write output to outputs/document_structure.json
    output_path = "outputs/document_structure.json"
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    print(f"\nNormalized DOM data saved to {output_path}")

except Exception as e:
    import traceback
    print(f"Error parsing document: {e}")
    traceback.print_exc()