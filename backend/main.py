import os
import time
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# Imports moved into the route to avoid requiring all heavy dependencies in DEMO_MODE

load_dotenv()

app = FastAPI(title="Autonomous AI Research Assistant API")

class ResearchQuery(BaseModel):
    query: str

class ResearchResult(BaseModel):
    summary: str
    papers: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]

@app.post("/api/research", response_model=ResearchResult)
async def run_research_pipeline(request: ResearchQuery):
    """
    Triggers the multi-agent research pipeline.
    """
    demo_mode = os.getenv("DEMO_MODE", "False").lower() in ("true", "1", "yes")

    if demo_mode:
        print("Running in DEMO_MODE. Simulating multi-agent pipeline...")
        # Simulate processing time for UI animation
        await asyncio.sleep(12) 
        
        return {
            "summary": "This research synthesis explores the latest advancements in NLP models, focusing on Transformer architectures, BERT derivatives, and GPT series models. Based on 3 key papers retrieved from arXiv.",
            "papers": [
                { "title": "Attention Is All You Need", "method": "Transformer Architecture", "accuracy": "State-of-the-Art", "limitation": "High compute requirements" },
                { "title": "BERT: Pre-training of Deep Bidirectional Transformers", "method": "Bidirectional Encoder", "accuracy": "High on GLUE benchmark", "limitation": "Fixed sequence length" },
                { "title": "Language Models are Few-Shot Learners", "method": "Autoregressive Transformer", "accuracy": "High on zero-shot tasks", "limitation": "Massive scale required, potential bias" }
            ],
            "insights": [
                { "type": "Trend", "text": "Shift towards larger autoregressive models with minimal fine-tuning requirements." },
                { "type": "Gap", "text": "Efficient inference mechanisms for trillion-parameter models." },
                { "type": "Future Direction", "text": "Sparse attention mechanisms and improved retrieval-augmented generation." }
            ]
        }

    if not os.getenv("HF_TOKEN"):
        raise HTTPException(status_code=500, detail="HF_TOKEN is not set. Set DEMO_MODE=True in .env to test without an API key.")

    try:
        from agents.planner import PlannerAgent
        from agents.researcher import ResearcherAgent
        from core.rag import DocProcessing
        from agents.extractor import ExtractorAgent
        from agents.analyzer import AnalyzerAgent
        from agents.writer import WriterAgent

        # 1. Query Expansion
        print(f"Planning research for: {request.query}")
        planner = PlannerAgent()
        plan = planner.run(request.query)
        
        # 2. Research Retrieval
        plan['search_queries'] = plan['search_queries'][:2] # Limit queries to save time
        print(f"Fetching papers for queries: {plan['search_queries']}")
        researcher = ResearcherAgent(max_results=2)
        papers = researcher.fetch(plan['search_queries'])
        papers = papers[:3] # Cap to 3 total papers to significantly reduce loading time
        
        if not papers:
            raise HTTPException(status_code=404, detail="No papers found for the given query.")

        # 3. Document Processing (RAG)
        print("Processing documents...")
        rag_processor = DocProcessing()
        vector_db = rag_processor.build_faiss(papers)
        
        # 4. Knowledge Extraction
        print("Extracting knowledge...")
        extractor = ExtractorAgent()
        extracted_data = extractor.extract(vector_db, papers)
        
        # 5. Analysis
        print("Comparing and generating insights...")
        analyzer = AnalyzerAgent()
        comparison = analyzer.compare(extracted_data)
        insights = analyzer.generate_insights(comparison)
        
        # 6. Report Generation
        print("Generating report...")
        writer = WriterAgent()
        summary_text = f"This synthesis covers: {', '.join(plan['subtopics'])}. " \
                       f"Based on {len(papers)} key papers retrieved from arXiv."
        
        report = writer.generate(summary=summary_text, comparison_table=comparison, insights=insights)
        
        return {
            "summary": report["summary"],
            "papers": report["comparison"],
            "insights": report["insights"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
