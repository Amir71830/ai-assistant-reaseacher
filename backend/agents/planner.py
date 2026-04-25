import json
import os
import requests
import re

class PlannerAgent:
    """
    Module 1: Query Understanding Agent
    """
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def run(self, query: str) -> dict:
        prompt = f"""[INST]
Act as an expert academic research planner.
Break the user query: "{query}" into structured components for a literature review.
Return ONLY a valid JSON object matching this schema, no other text:
{{
  "subtopics": ["subtopic 1", "subtopic 2"],
  "keywords": ["keyword1", "keyword2"],
  "search_queries": ["query 1", "query 2"]
}}
[/INST]"""
        
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "Qwen/Qwen2.5-72B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "temperature": 0.2
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            result_text = response.json()['choices'][0]['message']['content'].strip()
            
            # Clean up potential markdown formatting around json
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                
            return json.loads(result_text)
        except Exception as e:
            print("Failed to parse planner output:", e)
            return {
                "subtopics": [query],
                "keywords": [query],
                "search_queries": [query]
            }
