import json
import os
import requests
import re

class ExtractorAgent:
    """
    Module 4: Knowledge Extraction Agent
    Extracts structured fields: model_type, dataset, method, accuracy, complexity, limitations.
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
            query = f"What is the core method, model type, dataset, results, complexity, and limitations of: {title}?"
            docs = vector_db.similarity_search(query, k=3)
            context = "\n\n".join([doc["text"] for doc in docs])

            prompt = f"""[INST]
Read this research context and extract structured information for the paper "{title}".
Context:
{context}

Return ONLY a valid JSON object with no additional text:
{{
  "model_type": "The type of model or architecture (e.g. Transformer, CNN, GNN)",
  "dataset": "Name of dataset(s) used for evaluation",
  "method": "The core method or technique proposed",
  "accuracy": "Key performance metric or result (e.g. 92.1% accuracy, 28.4 BLEU)",
  "complexity": "Computational complexity (e.g. O(n²), O(n log n)) if mentioned, else 'Not specified'",
  "limitations": "Main limitations or shortcomings mentioned"
}}
[/INST]"""

            payload = {
                "model": "Qwen/Qwen2.5-72B-Instruct",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 600,
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
                print(f"Extraction failed for {title}: {e}")
                extracted_data.append({
                    "title": title,
                    "model_type": "Unknown",
                    "dataset": "Not specified",
                    "method": "Extraction failed",
                    "accuracy": "N/A",
                    "complexity": "N/A",
                    "limitations": "N/A"
                })

        return extracted_data
