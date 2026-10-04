import re
import html
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

def sanitize_text(text: str, max_length: int = 5000) -> str:
    """
    Sanitize text inputs to prevent XSS and strip control characters.
    """
    if not text:
        return ""
    # Strip null bytes and control chars
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Strip dangerous HTML tags
    clean = re.sub(r'<(script|iframe|object|embed|style|meta|svg|link)[^>]*>.*?</\1>', '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'<[^>]+>', '', clean)  # Strip remaining HTML tags
    clean = html.escape(clean.strip())
    if len(clean) > max_length:
        clean = clean[:max_length]
    return clean

def sanitize_filename(filename: str) -> str:
    """
    Sanitize uploaded filename to prevent directory traversal and filesystem attacks.
    """
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename cannot be empty"
        )
    # Take only the base name (no path components)
    basename = Path(filename).name
    # Keep only alphanumeric, hyphen, underscore, and dot
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', basename)
    # Prevent leading dots or hidden files
    clean_name = clean_name.lstrip('.')
    if not clean_name:
        clean_name = "unnamed_document"
    return clean_name

def validate_uploaded_file(file: UploadFile) -> str:
    """
    Validate file extension, size, and magic bytes. Returns sanitized filename.
    """
    clean_name = sanitize_filename(file.filename)
    ext = Path(clean_name).suffix.lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not permitted. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read first 2048 bytes for magic byte verification
    header = file.file.read(2048)
    file.file.seek(0)  # Rewind pointer

    if ext == ".pdf":
        if not header.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file: header signature does not match PDF format"
            )
    elif ext == ".docx":
        # DOCX is a zip archive, starts with PK\x03\x04
        if not header.startswith(b"PK\x03\x04"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid DOCX file: header signature does not match DOCX format"
            )

    return clean_name
