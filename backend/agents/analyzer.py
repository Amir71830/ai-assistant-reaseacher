import json
import os
import requests
import re

class AnalyzerAgent:
    """
    Module 5 & 6: Comparison Engine & Insight Generator with explainability.
    """
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def compare(self, extracted_data: list) -> list:
        """Build enhanced comparison table with all structured fields."""
        comparison_table = []
        for data in extracted_data:
            comparison_table.append({
                "title":      data.get("title", "Unknown"),
                "model_type": data.get("model_type", "N/A"),
                "dataset":    data.get("dataset", "N/A"),
                "method":     data.get("method", "N/A"),
                "accuracy":   data.get("accuracy", "N/A"),
                "complexity": data.get("complexity", "N/A"),
                "limitation": data.get("limitations", "N/A"),
            })
        return comparison_table

    def generate_insights(self, comparison_table: list) -> list:
        """Generate insights with supporting paper citations for explainability."""
        titles = [p["title"] for p in comparison_table]
        context = json.dumps(comparison_table, indent=2)

        prompt = f"""[INST]
Analyze the following research comparison data and produce structured insights.
For each insight, cite which specific papers support it and what evidence they provide.

Data:
{context}

Return ONLY a valid JSON object matching this schema, with no additional text:
{{
  "insights": [
    {{
      "type": "Trend",
      "text": "A clear, specific insight about common trends across papers",
      "supporting_papers": [
        {{"title": "Exact paper title from the data", "evidence": "Specific finding or quote that supports this insight"}}
      ]
    }},
    {{
      "type": "Gap",
      "text": "A key limitation or gap across the field",
      "supporting_papers": [
        {{"title": "Exact paper title from the data", "evidence": "Why this paper reveals this gap"}}
      ]
    }},
    {{
      "type": "Future Direction",
      "text": "A concrete future research opportunity",
      "supporting_papers": [
        {{"title": "Exact paper title from the data", "evidence": "What this paper suggests about the future"}}
      ]
    }}
  ]
}}

Paper titles available: {json.dumps(titles)}
[/INST]"""

        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "Qwen/Qwen2.5-72B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1200,
            "temperature": 0.4
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
                {"type": "Trend", "text": "Unable to generate trends — check LLM connection.",
                 "supporting_papers": []},
                {"type": "Gap", "text": "Unable to generate gaps — check LLM connection.",
                 "supporting_papers": []}
            ]
