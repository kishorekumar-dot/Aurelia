import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.database.models import Document

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
    db: Session = Depends(get_db)
):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    doc = Document(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        upload_date=datetime.utcnow(),
        storage_path=file_path,
        document_type=document_type,
        file_size_bytes=file_size
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
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        upload_date=doc.upload_date.isoformat(),
        storage_path=doc.storage_path,
        document_type=doc.document_type,
        file_size_bytes=doc.file_size_bytes
    )
