import json
import os
import requests
import re

class ExtractorAgent:
    """
    Module 4: Knowledge Extraction Agent
    """
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def extract(self, vector_db, papers: list) -> list:
        extracted_data = []
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        for paper in papers:
            title = paper['title']
            query = f"What is the core method, advantages, limitations, and results of the paper {title}?"
            docs = vector_db.similarity_search(query, k=3)
            context = "\n\n".join([doc["text"] for doc in docs])
            
            prompt = f"""[INST]
Read this research context and extract the required information for the paper "{title}".
Context:
{context}

Return ONLY a valid JSON object matching this schema, with no additional text:
{{
  "method": "The core method or architecture proposed",
  "advantages": "Key advantages of the method",
  "limitations": "Limitations mentioned in the text",
  "results": "Key performance results or metrics"
}}
[/INST]"""
            
            payload = {
                "model": "Qwen/Qwen2.5-72B-Instruct",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 512,
                "temperature": 0.1
            }
            
            try:
                response = requests.post(self.api_url, headers=headers, json=payload)
                response.raise_for_status()
                result_text = response.json()['choices'][0]['message']['content'].strip()
                
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(0)
                    
                data = json.loads(result_text)
                data['title'] = title
                extracted_data.append(data)
            except Exception as e:
                print(f"Failed extraction for {title}: {e}")
                extracted_data.append({
                    "title": title,
                    "method": "Extraction failed",
                    "advantages": "N/A",
                    "limitations": "N/A",
                    "results": "N/A"
                })
                
        return extracted_data
