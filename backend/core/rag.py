import os
import requests
import tempfile
import math
import json
from PyPDF2 import PdfReader

class SimpleVectorDB:
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.api_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
        self.documents = []
        self.embeddings = []

    def get_embeddings(self, texts):
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        # Hugging Face Inference API can handle a list of inputs, but might fail on too many.
        # We will split into smaller batches if needed, but for our chunk size, let's just pass them.
        response = requests.post(self.api_url, headers=headers, json={"inputs": texts})
        response.raise_for_status()
        return response.json()

    def add_documents(self, chunks):
        if not chunks:
            return
        
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.get_embeddings(texts)
        
        for i, chunk in enumerate(chunks):
            self.documents.append(chunk)
            self.embeddings.append(embeddings[i])
            
    def similarity_search(self, query, k=3):
        if not self.documents:
            return []
            
        query_emb = self.get_embeddings([query])[0]
        
        # Compute cosine similarities
        scored_docs = []
        for i, doc_emb in enumerate(self.embeddings):
            dot_product = sum(a * b for a, b in zip(query_emb, doc_emb))
            mag1 = math.sqrt(sum(a * a for a in query_emb))
            mag2 = math.sqrt(sum(b * b for b in doc_emb))
            score = dot_product / (mag1 * mag2) if mag1 and mag2 else 0
            scored_docs.append((score, self.documents[i]))
            
        # Sort and return top k
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc[1] for doc in scored_docs[:k]]

class DocProcessing:
    """
    Module 3: Document Processing (RAG Core)
    Steps: Download PDF -> Extract text -> Chunk -> Embeddings -> Vector DB
    """
    def __init__(self):
        self.chunk_size = 1000
        self.chunk_overlap = 200

    def build_faiss(self, papers: list):
        """
        Processes downloaded papers and stores them in a Vector DB.
        """
        all_chunks = []
        
        for paper in papers:
            try:
                print(f"Processing PDF for: {paper['title']}")
                pdf_path = self._download_pdf(paper['pdf_link'])
                text = ""
                with open(pdf_path, 'rb') as f:
                    reader = PdfReader(f)
                    for page in reader.pages:
                        text += page.extract_text() + "\n"
                
                os.remove(pdf_path)
                
                chunks = self._chunk_text(text)
                for chunk in chunks:
                    all_chunks.append({
                        "text": chunk,
                        "metadata": {"title": paper["title"], "source": paper["pdf_link"]}
                    })
                    
            except Exception as e:
                print(f"Failed to process PDF for {paper['title']}, falling back to abstract. Error: {e}")
                chunks = self._chunk_text(paper["abstract"])
                for chunk in chunks:
                    all_chunks.append({
                        "text": chunk,
                        "metadata": {"title": paper["title"], "source": paper["pdf_link"]}
                    })

        vector_db = SimpleVectorDB()
        if all_chunks:
            print(f"Building Vector index with {len(all_chunks)} chunks...")
            # process in batches of 10 to avoid api limits on HF free tier
            for i in range(0, len(all_chunks), 10):
                vector_db.add_documents(all_chunks[i:i+10])
                
        return vector_db

    def _download_pdf(self, link: str) -> str:
        response = requests.get(link, stream=True, timeout=15)
        response.raise_for_status()
        fd, path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return path
        
    def _chunk_text(self, text: str) -> list:
        chunks = []
        i = 0
        while i < len(text):
            chunks.append(text[i:i+self.chunk_size])
            i += self.chunk_size - self.chunk_overlap
        return chunks
