import arxiv

class ResearcherAgent:
    """
    Module 2: Research Retrieval Agent
    Goal: Fetch research papers via arXiv API
    """
    def __init__(self, max_results=3):
        # We limit max_results per query to keep processing time reasonable
        self.max_results = max_results

    def fetch(self, search_queries: list) -> list:
        """
        Fetch top research papers for given queries.
        Output: Title, Abstract, PDF link
        """
        all_papers = []
        seen_titles = set()
        
        for query in search_queries:
            try:
                client = arxiv.Client()
                search = arxiv.Search(
                    query=query,
                    max_results=self.max_results,
                    sort_by=arxiv.SortCriterion.Relevance
                )
                
                for result in client.results(search):
                    if result.title not in seen_titles:
                        seen_titles.add(result.title)
                        all_papers.append({
                            "title": result.title,
                            "abstract": result.summary,
                            "pdf_link": result.pdf_url,
                            "authors": [author.name for author in result.authors]
                        })
            except Exception as e:
                print(f"Error fetching for query '{query}': {e}")
                
        return all_papers
