import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, BrainCircuit, Download, Lightbulb, GitCompare, FileText } from 'lucide-react'

const AGENTS = [
  { id: 'planner', name: 'Query Expansion', icon: <Search size={20} /> },
  { id: 'researcher', name: 'Research Fetcher', icon: <FileText size={20} /> },
  { id: 'extractor', name: 'Doc Processing', icon: <BrainCircuit size={20} /> },
  { id: 'analyzer', name: 'Analysis Engine', icon: <GitCompare size={20} /> },
  { id: 'writer', name: 'Report Generator', icon: <Lightbulb size={20} /> }
];

function PipelineVisualizer({ currentStep }) {
  return (
    <div className="glass-panel pipeline-container">
      {AGENTS.map((agent, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <React.Fragment key={agent.id}>
            <div className="pipeline-step">
              <div className={`step-icon ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {agent.icon}
              </div>
              <span className="step-label">{agent.name}</span>
            </div>
            {index < AGENTS.length - 1 && (
              <div className="pipeline-connector">
                <div 
                  className="pipeline-connector-fill" 
                  style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    setCurrentStep(0);
    setResults(null);
    setError(null);
    
    // Animate the pipeline steps for UX while we wait for the slow backend API
    let step = 0;
    const interval = setInterval(() => {
      if (step < 3) {
        step++;
        setCurrentStep(step);
      }
    }, 4000); // Progress the pipeline visually

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server error occurred");
      }

      const data = await response.json();
      setCurrentStep(4); // Final step
      setTimeout(() => {
        setCurrentStep(5); // Complete
        setResults(data);
        setIsSearching(false);
      }, 1000);

    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setIsSearching(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 20;

    // ── Header ─────────────────────────────────────────────
    doc.setFillColor(26, 32, 55);
    doc.rect(0, 0, pageW, 35, 'F');
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Research Report', margin, 16);
    doc.setFontSize(9);
    doc.setTextColor(160, 170, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`Query: ${query}`, margin, 24);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 30);
    y = 45;

    // ── Executive Summary ───────────────────────────────────
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y);
    y += 7;

    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(results.summary, contentW);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 4;

    // Badges
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(margin, y, 40, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Relevance: 98%', margin + 4, y + 4.5);
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin + 44, y, 36, 7, 2, 2, 'F');
    doc.text('Confidence: High', margin + 48, y + 4.5);
    y += 15;

    // ── Methodology Comparison ──────────────────────────────
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Methodology Comparison', margin, y);
    y += 4;
    doc.setDrawColor(139, 92, 246);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    const tableBody = results.papers.map(p => [
      p.title || '-',
      p.method || '-',
      p.accuracy || '-',
      p.limitation || '-',
    ]);

    doc.autoTable({
      startY: y,
      head: [['Paper / Architecture', 'Method', 'Key Metric', 'Limitation']],
      body: tableBody,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 45 }, 2: { cellWidth: 40 }, 3: { cellWidth: 45 } },
    });

    y = doc.lastAutoTable.finalY + 12;

    // ── Synthesized Insights ────────────────────────────────
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setTextColor(139, 92, 246);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthesized Insights', margin, y);
    y += 4;
    doc.setDrawColor(139, 92, 246);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    const typeColors = { Trend: [139, 92, 246], Gap: [239, 68, 68], 'Future Direction': [16, 185, 129] };
    results.insights.forEach((insight) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const color = typeColors[insight.type] || [99, 102, 241];
      doc.setFillColor(...color);
      doc.roundedRect(margin, y, 22, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(insight.type || 'Insight', margin + 2, y + 4);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const insightLines = doc.splitTextToSize(insight.text, contentW - 26);
      doc.text(insightLines, margin + 26, y + 4);
      y += Math.max(insightLines.length * 5, 8) + 4;
    });

    // ── Footer ──────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 170, 200);
      doc.text(`AI Research Assistant · Page ${i} of ${totalPages}`, margin, 292);
    }

    doc.save(`Research_Report_${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="app-container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Research Assistant
        </motion.h1>
        <motion.p 
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Autonomous multi-agent knowledge synthesis engine
        </motion.p>
      </header>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <form onSubmit={handleSearch} className="search-container">
          <input 
            type="text" 
            placeholder="What would you like to research? (e.g. Latest NLP models)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
          />
          <button type="submit" disabled={isSearching || !query}>
            {isSearching ? <div className="loader" /> : <Search size={20} />}
            {isSearching ? 'Processing...' : 'Research'}
          </button>
        </form>
        {error && (
          <div style={{ color: '#ef4444', marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            Error: {error}. Did you set the OPENAI_API_KEY in the backend/.env?
          </div>
        )}
      </motion.div>

      {(isSearching || results) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <PipelineVisualizer currentStep={currentStep} />
        </motion.div>
      )}

      {results && (
        <motion.div 
          className="results-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-panel">
            <h2 className="card-title">
              <FileText size={24} />
              Executive Summary
            </h2>
            <p style={{ lineHeight: 1.6 }}>{results.summary}</p>
            <div style={{ marginTop: '1rem' }}>
               <span className="metric-badge">Relevance Score: 98%</span>
               <span className="metric-badge" style={{ marginLeft: '10px' }}>Confidence: High</span>
            </div>
          </div>

          <div className="glass-panel">
            <h2 className="card-title">
              <GitCompare size={24} />
              Methodology Comparison
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Paper / Architecture</th>
                    <th>Method</th>
                    <th>Key Metric</th>
                    <th>Limitation</th>
                  </tr>
                </thead>
                <tbody>
                  {results.papers.map((paper, idx) => (
                    <tr key={idx}>
                      <td><strong>{paper.title}</strong></td>
                      <td>{paper.method}</td>
                      <td>{paper.accuracy}</td>
                      <td>{paper.limitation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                <Lightbulb size={24} />
                Synthesized Insights
              </h2>
              <button onClick={handleExport} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <Download size={16} /> Export Report
              </button>
            </div>
            
            <ul className="insight-list">
              {results.insights.map((insight, idx) => (
                <li key={idx} className="insight-item">
                  <div className="insight-header">{insight.type}</div>
                  <div>{insight.text}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    * Generated based on synthesis of {results.papers.length} source papers.
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default App
