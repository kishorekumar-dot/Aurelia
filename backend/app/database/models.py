from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="lecturer") # lecturer | student | admin
    full_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reviews = relationship("Review", back_populates="reviewer")
    rules = relationship("Rule", back_populates="author")
    submissions = relationship("Submission", back_populates="student")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="Student Academic Report")
    filename = Column(String, nullable=False)
    version = Column(Integer, default=1)
    status = Column(String, default="SUBMITTED") # SUBMITTED | ANALYZING | LECTURER_REVIEW | PUBLISHED | REVISION_REQUESTED
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=False)

    student = relationship("User", back_populates="submissions")
    reviews = relationship("Review", back_populates="submission")

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="rules")
    policy_snapshots = relationship("PolicySnapshot", back_populates="rule")
    reviews = relationship("Review", back_populates="rule")

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, nullable=True)
    code = Column(String, nullable=True)
    target = Column(String, nullable=True)
    requirement = Column(Text, nullable=True)
    constraints = Column(JSON, nullable=True)
    obligation = Column(String, default="MANDATORY")
    source = Column(String, default="LECTURER")
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class PolicySnapshot(Base):
    __tablename__ = "policy_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id"))
    name = Column(String)
    agent_prompts = Column(JSON) # prompts per agent
    checklists = Column(JSON) # list of criteria
    scoring_weights = Column(JSON) # format, content, innovation, consistency weights
    required_sections = Column(JSON)
    format_rules = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    rule = relationship("Rule", back_populates="policy_snapshots")
    reviews = relationship("Review", back_populates="policy_snapshot")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    storage_path = Column(String)
    document_type = Column(String, default="STUDENT_PAPER") # STUDENT_PAPER, RULE_SPEC
    file_size_bytes = Column(Integer, default=0)
    parsed_json = Column(JSON, nullable=True)

    reviews = relationship("Review", back_populates="document")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    policy_snapshot_id = Column(Integer, ForeignKey("policy_snapshots.id"), nullable=True)
    
    title = Column(String, default="Academic Document Review")
    student_name = Column(String, default="Student Submission")
    department = Column(String, default="Computer Science & Engineering")
    version = Column(Integer, default=1)
    status = Column(String, default="IDLE") # IDLE, RUNNING, COMPLETED, LECTURER_REVIEW, PUBLISHED, FAILED
    current_stage = Column(String, default="IDLE")
    
    overall_score = Column(Float, nullable=True)
    format_score = Column(Float, nullable=True)
    content_score = Column(Float, nullable=True)
    innovation_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    routing_decision = Column(String, nullable=True) # AUTOMATIC | LECTURER_REVIEW
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    reviewer = relationship("User", back_populates="reviews")
    document = relationship("Document", back_populates="reviews")
    rule = relationship("Rule", back_populates="reviews")
    submission = relationship("Submission", back_populates="reviews")
    policy_snapshot = relationship("PolicySnapshot", back_populates="reviews")
    findings = relationship("Finding", back_populates="review", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="review", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"))
    agent = Column(String, default="format") # format | content | innovation | consistency
    finding_code = Column(String, nullable=True) # F-01, F-02...
    title = Column(String, nullable=True)
    category = Column(String, default="Formatting")
    severity = Column(String, default="minor") # critical | major | minor | info
    claim = Column(Text)
    quote = Column(Text, nullable=True)
    location = Column(JSON, nullable=True)
    location_page = Column(Integer, nullable=True)
    location_section = Column(String, nullable=True)
    status = Column(String, default="DETECTED") # DETECTED, VERIFIED, SUPPORTED, INSUFFICIENT, CONTRADICTED, APPROVED, REJECTED, MODIFIED, PUBLISHED
    authority = Column(String, default="AUTOMATIC") # AUTOMATIC | QUALIFIED_AI | LECTURER
    recommendation = Column(Text, nullable=True)
    policy_id = Column(String, nullable=True)
    evidence_sufficient = Column(Boolean, default=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", back_populates="findings")
    evidence = relationship("Evidence", back_populates="finding", cascade="all, delete-orphan")
    lecturer_feedbacks = relationship("LecturerFeedback", back_populates="finding", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id"))
    source = Column(String, nullable=True)
    location = Column(JSON, nullable=True)
    observation = Column(Text, nullable=True)
    value = Column(String, nullable=True)
    method = Column(String, default="document_parser")
    extraction_method = Column(String, default="document_parser")
    confidence = Column(Float, default=1.0)
    policy_id = Column(String, nullable=True)
    quote = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    section_name = Column(String, nullable=True)
    relevance_score = Column(Float, default=1.0)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    finding = relationship("Finding", back_populates="evidence")

class LecturerFeedback(Base):
    __tablename__ = "lecturer_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"), default=1)
    action = Column(String) # APPROVE | REJECT | MODIFY | COMMENT
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    finding = relationship("Finding", back_populates="lecturer_feedbacks")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"))
    lecturer_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # accept | flag | override
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", back_populates="decisions")
