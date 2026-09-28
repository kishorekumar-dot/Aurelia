import argparse
import sys
import json
from pprint import pprint
from app.services.review.orchestrator import run_orchestrator

def main():
    parser = argparse.ArgumentParser(description="Academic Review AI - CLI Runner")
    parser.add_argument("file", help="Path to the document (DOCX or PDF) to review")
    parser.add_argument("--no-llm", action="store_true", help="Disable LLM analyzers (run only deterministic checks)")
    parser.add_argument("--output", "-o", help="Optional output JSON file path for the review results")
    parser.add_argument("--scope", nargs="+", help="Specific scopes to run, e.g., FORMAT STRUCTURE CONTENT")
    
    args = parser.parse_args()

    print(f"Starting review for: {args.file}")
    
    try:
        results = run_orchestrator(
            document_path=args.file,
            run_llm=not args.no_llm,
            review_scope=args.scope,
            db=None,
            review_id=None
        )
        
        print("\n=== Review Completed successfully ===")
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"Results saved to {args.output}")
        else:
            print("\n--- Student Report ---")
            pprint(results.get("student_report"))
            print("\n--- Lecturer Report ---")
            pprint(results.get("lecturer_report"))
            print("\n--- Project Summary ---")
            pprint(results.get("project_summary"))

    except Exception as e:
        print(f"Error during review: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
