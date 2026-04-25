import json
import os
import requests
import re

class AnalyzerAgent:
    """
    Module 5 & 6: Comparison Engine & Insight Generator
    """
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def compare(self, extracted_data: list) -> list:
        comparison_table = []
        for data in extracted_data:
            comparison_table.append({
                "title": data.get("title", "Unknown"),
                "method": data.get("method", "N/A"),
                "accuracy": data.get("results", "N/A"),
                "limitation": data.get("limitations", "N/A")
            })
        return comparison_table

    def generate_insights(self, comparison_table: list) -> list:
        context = json.dumps(comparison_table, indent=2)
        
        prompt = f"""[INST]
Analyze the following research comparison data and identify:
1. Common trends
2. Key limitations across the field
3. Research gaps
4. Future opportunities

Data:
{context}

Return ONLY a valid JSON object matching this schema, with no additional text:
{{
  "insights": [
    {{
      "type": "Trend",
      "text": "The insight text"
    }}
  ]
}}
[/INST]"""
        
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "Qwen/Qwen2.5-72B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1024,
            "temperature": 0.5
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            result_text = response.json()['choices'][0]['message']['content'].strip()
            
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                
            parsed = json.loads(result_text)
            return parsed.get("insights", [])
        except Exception as e:
            print("Failed to generate insights:", e)
            return [
                {"type": "Trend", "text": "Failed to generate comprehensive trends."},
                {"type": "Gap", "text": "Data parsing error occurred."}
            ]
