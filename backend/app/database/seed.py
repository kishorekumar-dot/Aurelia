import os
import bcrypt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.database import engine, Base, SessionLocal
from app.database.models import User, Rule, PolicySnapshot, Document, Review, Finding, Evidence, Decision

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "dr.chen@cambridge.edu").first():
            print("Database already seeded.")
            return

        print("Seeding database with academic review data...")

        hashed_pw = bcrypt.hashpw(b"academic123", bcrypt.gensalt(12)).decode("utf-8")
        lecturer = User(
            username="dr.chen",
            email="dr.chen@cambridge.edu",
            hashed_password=hashed_pw,
            role="lecturer",
            full_name="Dr. Evelyn Chen",
            department="Department of Computer Science & Technology",
            is_active=True
        )
        db.add(lecturer)
        db.flush()

        # 2. Create Rules & Policy Snapshots
        rule1 = Rule(
            author_id=lecturer.id,
            title="ACM Master Thesis Standard 2026",
            description="Strict evaluation rubric for Master of Science theses covering structural format, citations, empirical methodology, and algorithmic novelty.",
            raw_text="Required Sections: Abstract, Introduction, Related Work, Methodology, System Design, Evaluation, Conclusion, References.\nMinimum Citations: 12 peer-reviewed sources.\nScoring Weights: Format (20%), Content (40%), Innovation (25%), Consistency (15%).",
            version="2.1"
        )
        db.add(rule1)
        db.flush()

        snapshot1 = PolicySnapshot(
            rule_id=rule1.id,
            name="ACM Master Thesis Policy Snapshot v2.1",
            agent_prompts={
                "format": "Verify 12-column IEEE/ACM font compliance, margins, and presence of mandatory structural sections.",
                "content": "Assess theoretical soundness, mathematical formulation rigor, and empirical dataset evaluation.",
                "innovation": "Identify explicit research contributions relative to 2024-2026 state-of-the-art baselines.",
                "consistency": "Ensure mathematical symbol notation remains uniform across equations and text."
            },
            checklists=[
                "Abstract must explicitly state problem, methodology, and primary quantitative result.",
                "References must contain DOI or arXiv IDs for all post-2020 citations.",
                "Methodology section must include dataset statistics and baseline hyperparameter table."
            ],
            scoring_weights={"format": 0.20, "content": 0.40, "innovation": 0.25, "consistency": 0.15},
            required_sections=["Abstract", "Introduction", "Related Work", "Methodology", "System Design", "Evaluation", "Conclusion", "References"],
            format_rules={"min_pages": 6, "max_pages": 30, "require_citations": True}
        )
        db.add(snapshot1)
        db.flush()

        rule2 = Rule(
            author_id=lecturer.id,
            title="IEEE Senior Capstone Guideline",
            description="Assessment standard for final year engineering capstone projects with focus on implementation feasibility and software testing metrics.",
            raw_text="Required Sections: Abstract, Problem Statement, Requirements, Architecture, Test Matrix, Conclusion, References.\nScoring Weights: Format (15%), Content (45%), Innovation (20%), Consistency (20%).",
            version="1.4"
        )
        db.add(rule2)
        db.flush()

        snapshot2 = PolicySnapshot(
            rule_id=rule2.id,
            name="IEEE Capstone Policy Snapshot v1.4",
            agent_prompts={
                "format": "Check double-column format and IEEE figure legend styling.",
                "content": "Verify code coverage metrics, system latency, and throughput tables.",
                "innovation": "Evaluate engineering design trade-offs.",
                "consistency": "Cross-check figure callouts against figure captions."
            },
            checklists=[
                "Architecture diagram must clearly delineate frontend, API gateway, and backend services.",
                "Unit test coverage report must be cited with percentage."
            ],
            scoring_weights={"format": 0.15, "content": 0.45, "innovation": 0.20, "consistency": 0.20},
            required_sections=["Abstract", "Problem Statement", "Requirements", "Architecture", "Test Matrix", "Conclusion", "References"],
            format_rules={"min_pages": 8, "max_pages": 20, "require_citations": True}
        )
        db.add(snapshot2)
        db.flush()

        # 3. Create Documents & Reviews
        # Review 1: High score, Automatic approval
        doc1 = Document(
            filename="Thorne_Julian_SwarmConsensus2026.pdf",
            content_type="application/pdf",
            storage_path="uploads/Thorne_Julian_SwarmConsensus2026.pdf",
            document_type="STUDENT_PAPER",
            file_size_bytes=1420500
        )
        db.add(doc1)
        db.flush()

        review1 = Review(
            reviewer_id=lecturer.id,
            document_id=doc1.id,
            rule_id=rule1.id,
            policy_snapshot_id=snapshot1.id,
            title="Adaptive Graph Neural Networks for Multi-Agent Consensus in Autonomous Swarms",
            student_name="Julian Thorne",
            status="COMPLETED",
            current_stage="COMPLETED",
            overall_score=88.4,
            format_score=92.0,
            content_score=87.5,
            innovation_score=91.0,
            consistency_score=84.0,
            confidence_score=0.94,
            routing_decision="AUTOMATIC",
            summary="Exceptional research paper demonstrating robust GNN-based swarm consensus algorithms. Minor formatting adjustments required for Figure 4 caption.",
            created_at=datetime.utcnow() - timedelta(days=2),
            completed_at=datetime.utcnow() - timedelta(days=2, hours=-1)
        )
        db.add(review1)
        db.flush()

        f1_1 = Finding(
            review_id=review1.id,
            agent="format",
            finding_code="F-01",
            title="Non-compliant Figure Caption Typography",
            severity="minor",
            claim="Figure 4 caption uses sans-serif 9pt font instead of required 8pt italic serif font.",
            quote="Figure 4: Scalability comparison between baseline Flooding protocol and AGNN-Consensus under high latency.",
            location_page=5,
            location_section="4.2 Scalability Benchmark",
            evidence_sufficient=True,
            confidence=0.92
        )
        db.add(f1_1)
        db.flush()
        db.add(Evidence(finding_id=f1_1.id, quote="Figure 4: Scalability comparison...", page_number=5, section_name="4.2 Scalability Benchmark", relevance_score=0.95))

        f1_2 = Finding(
            review_id=review1.id,
            agent="content",
            finding_code="F-02",
            title="Missing Hyperparameter Tuning Ablation Study",
            severity="major",
            claim="Section 3.3 omits learning rate warmup schedule parameters for the GNN message passing layer.",
            quote="We train the GNN for 200 epochs using Adam optimizer with weight decay set to 1e-4.",
            location_page=4,
            location_section="3.3 Model Architecture",
            evidence_sufficient=True,
            confidence=0.89
        )
        db.add(f1_2)
        db.flush()
        db.add(Evidence(finding_id=f1_2.id, quote="We train the GNN for 200 epochs...", page_number=4, section_name="3.3 Model Architecture", relevance_score=0.91))

        # Review 2: Needs Lecturer Review
        doc2 = Document(
            filename="Vance_Sophia_EdgeLedgerVerification.pdf",
            content_type="application/pdf",
            storage_path="uploads/Vance_Sophia_EdgeLedgerVerification.pdf",
            document_type="STUDENT_PAPER",
            file_size_bytes=980400
        )
        db.add(doc2)
        db.flush()

        review2 = Review(
            reviewer_id=lecturer.id,
            document_id=doc2.id,
            rule_id=rule1.id,
            policy_snapshot_id=snapshot1.id,
            title="Distributed Ledger Verification of Neural Network Weights in Edge Computing",
            student_name="Sophia Vance",
            status="COMPLETED",
            current_stage="COMPLETED",
            overall_score=71.8,
            format_score=65.0,
            content_score=72.0,
            innovation_score=78.0,
            consistency_score=74.0,
            confidence_score=0.81,
            routing_decision="LECTURER_REVIEW",
            summary="Promising concept linking smart contracts to model weight verification, but lacks rigorous baseline comparison and omits mandatory Related Work section.",
            created_at=datetime.utcnow() - timedelta(days=1),
            completed_at=datetime.utcnow() - timedelta(days=1, hours=-1)
        )
        db.add(review2)
        db.flush()

        f2_1 = Finding(
            review_id=review2.id,
            agent="format",
            finding_code="F-01",
            title="Missing Mandatory Section: Related Work",
            severity="critical",
            claim="The manuscript entirely omits the required 'Related Work' section specified in ACM Master Thesis Policy v2.1.",
            quote="Document structure skips directly from Section 1: Introduction to Section 2: Ledger Protocol Architecture.",
            location_page=2,
            location_section="Table of Contents",
            evidence_sufficient=True,
            confidence=0.98
        )
        db.add(f2_1)
        db.flush()
        db.add(Evidence(finding_id=f2_1.id, quote="Document structure skips directly...", page_number=2, section_name="Table of Contents", relevance_score=0.99))

        f2_2 = Finding(
            review_id=review2.id,
            agent="content",
            finding_code="F-02",
            title="Unsubstantiated Performance Latency Claim",
            severity="major",
            claim="The claim of 'sub-millisecond transaction finality' lacks empirical benchmark logs or hardware testbed specification.",
            quote="Our lightweight consensus achieves sub-millisecond finality on resource-constrained Raspberry Pi 4 nodes.",
            location_page=6,
            location_section="4.1 Performance Evaluation",
            evidence_sufficient=True,
            confidence=0.86
        )
        db.add(f2_2)
        db.flush()
        db.add(Evidence(finding_id=f2_2.id, quote="Our lightweight consensus achieves sub-millisecond...", page_number=6, section_name="4.1 Performance Evaluation", relevance_score=0.90))

        # Review 3: High score
        doc3 = Document(
            filename="Sterling_Marcus_LatticeCrypt IoT.docx",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            storage_path="uploads/Sterling_Marcus_LatticeCrypt_IoT.docx",
            document_type="STUDENT_PAPER",
            file_size_bytes=2100000
        )
        db.add(doc3)
        db.flush()

        review3 = Review(
            reviewer_id=lecturer.id,
            document_id=doc3.id,
            rule_id=rule2.id,
            policy_snapshot_id=snapshot2.id,
            title="Quantum-Resistant Lattice Cryptography for Medical IoT Sensor Networks",
            student_name="Marcus Sterling",
            status="COMPLETED",
            current_stage="COMPLETED",
            overall_score=93.2,
            format_score=96.0,
            content_score=92.0,
            innovation_score=95.0,
            consistency_score=91.0,
            confidence_score=0.96,
            routing_decision="AUTOMATIC",
            summary="Outstanding submission. Demonstrates complete implementation of Kyber-512 key encapsulation on ARM Cortex-M4 microcontrollers.",
            created_at=datetime.utcnow() - timedelta(hours=5),
            completed_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(review3)
        db.flush()

        f3_1 = Finding(
            review_id=review3.id,
            agent="innovation",
            finding_code="F-01",
            title="Novel Hardware Memory Footprint Optimization",
            severity="info",
            claim="Reduces NTT polynomial multiplication SRAM footprint by 34% compared to standard PQClean reference implementation.",
            quote="By interleaving Montgomery reduction with butterfly operations, our implementation fits within 2.4 KB of SRAM.",
            location_page=7,
            location_section="5. Memory Benchmarks",
            evidence_sufficient=True,
            confidence=0.97
        )
        db.add(f3_1)
        db.flush()
        db.add(Evidence(finding_id=f3_1.id, quote="By interleaving Montgomery reduction...", page_number=7, section_name="5. Memory Benchmarks", relevance_score=0.97))

        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
