import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.database.models import Document, User
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.sanitizer import validate_uploaded_file, sanitize_text

router = APIRouter()

class DocumentResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    upload_date: str
    storage_path: str
    document_type: str
    file_size_bytes: int

@router.post("", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("STUDENT_PAPER"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate file extension and signature
    safe_filename = validate_uploaded_file(file)
    safe_doctype = sanitize_text(document_type, max_length=50) or "STUDENT_PAPER"

    # 2. Check and prepare upload directory
    upload_dir = settings.UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 3. Prevent filename collision / overwriting by prepending UUID
    stored_name = f"{uuid.uuid4().hex}_{safe_filename}"
    file_path = upload_dir / stored_name

    # 4. Stream write file while enforcing size limit
    total_size = 0
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            total_size += len(chunk)
            if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                buffer.close()
                if file_path.exists():
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
                )
            buffer.write(chunk)

    doc = Document(
        filename=safe_filename,
        content_type=file.content_type or "application/octet-stream",
        upload_date=datetime.utcnow(),
        storage_path=str(file_path),
        document_type=safe_doctype,
        file_size_bytes=total_size
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        upload_date=doc.upload_date.isoformat(),
        storage_path=doc.storage_path,
        document_type=doc.document_type,
        file_size_bytes=doc.file_size_bytes
    )

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        upload_date=doc.upload_date.isoformat(),
        storage_path=doc.storage_path,
        document_type=doc.document_type,
        file_size_bytes=doc.file_size_bytes
    )
