import React, { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, BrainCircuit, Download, Lightbulb, GitCompare,
  FileText, CheckCircle2, Loader2, Circle, ChevronDown,
  ChevronUp, Cpu, Database, Zap, Network, BookOpen, BarChart2
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'planner',    label: 'Query Expansion',   icon: <Search size={18} /> },
  { id: 'researcher', label: 'Paper Retrieval',   icon: <FileText size={18} /> },
  { id: 'extractor',  label: 'Doc Processing',    icon: <Database size={18} /> },
  { id: 'analyzer',   label: 'Analysis Engine',   icon: <GitCompare size={18} /> },
  { id: 'writer',     label: 'Report Generator',  icon: <Lightbulb size={18} /> },
]

const ARCH_NODES = [
  { icon: <Search size={20} />,      title: 'Planner Agent',   desc: 'Decomposes query into subtopics and search queries using Qwen-72B' },
  { icon: <BookOpen size={20} />,    title: 'Researcher Agent',desc: 'Fetches relevant papers from arXiv API by relevance ranking' },
  { icon: <Database size={20} />,    title: 'RAG Pipeline',    desc: 'Chunks PDFs, builds FAISS vector index, retrieves top-k passages' },
  { icon: <BrainCircuit size={20} />,title: 'Extractor Agent', desc: 'Extracts structured fields: model type, dataset, accuracy, limits' },
  { icon: <GitCompare size={20} />,  title: 'Analyzer Agent',  desc: 'Runs comparison engine + generates insights with paper citations' },
  { icon: <Lightbulb size={20} />,   title: 'Writer Agent',    desc: 'Synthesizes final executive summary from all agent outputs' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, hasResults }) {
  const tabs = [
    { id: 'research', label: 'Research', icon: <Search size={15} /> },
    { id: 'architecture', label: 'How It Works', icon: <Network size={15} /> },
  ]
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${activeTab === t.id ? 'tab-active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  )
}

function AgentThinking({ steps }) {
  return (
    <div className="thinking-panel glass-panel">
      <h3 className="thinking-title"><Cpu size={16} /> Agent Thinking</h3>
      <ul className="thinking-list">
        {PIPELINE_STEPS.map(agent => {
          const step = steps[agent.id]
          const status = step?.status || 'idle'
          return (
            <li key={agent.id} className={`thinking-item thinking-${status}`}>
              <span className="thinking-icon">
                {status === 'completed' && <CheckCircle2 size={16} />}
                {status === 'running'   && <Loader2 size={16} className="spin" />}
                {status === 'idle'      && <Circle size={16} />}
              </span>
              <span className="thinking-label">{agent.label}</span>
              {step?.detail && (
                <span className="thinking-detail">— {step.detail}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ScoringPanel({ scoring }) {
  const [open, setOpen] = useState(false)
  if (!scoring) return null
  const bars = [
    { label: 'Keyword Match',       value: scoring.keyword_match,       color: '#3b82f6' },
    { label: 'Semantic Similarity', value: scoring.semantic_similarity,  color: '#8b5cf6' },
    { label: 'Citation Relevance',  value: scoring.citation_relevance,   color: '#10b981' },
  ]
  return (
    <div className="scoring-panel glass-panel">
      <div className="scoring-header" onClick={() => setOpen(o => !o)}>
        <div className="scoring-main">
          <BarChart2 size={18} />
          <span>Relevance Score</span>
          <span className="score-badge">{scoring.total}%</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="scoring-breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="scoring-formula">{scoring.formula}</p>
            {bars.map(b => (
              <div key={b.label} className="score-row">
                <span className="score-label">{b.label}</span>
                <div className="score-track">
                  <motion.div
                    className="score-fill"
                    style={{ background: b.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${b.value}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="score-pct">{b.value}%</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ComparisonTable({ papers }) {
  if (!papers?.length) return null
  return (
    <div className="glass-panel">
      <h2 className="card-title"><GitCompare size={22} /> Methodology Comparison</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="research-table">
          <thead>
            <tr>
              <th>Paper</th>
              <th>Model Type</th>
              <th>Dataset</th>
              <th>Accuracy</th>
              <th>Complexity</th>
              <th>Limitation</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p, i) => (
              <tr key={i}>
                <td><strong className="paper-title">{p.title}</strong></td>
                <td><span className="tag tag-blue">{p.model_type || p.method || '—'}</span></td>
                <td className="text-muted">{p.dataset || '—'}</td>
                <td><span className="tag tag-green">{p.accuracy || '—'}</span></td>
                <td className="text-mono">{p.complexity || '—'}</td>
                <td className="text-muted">{p.limitation || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InsightCard({ insight, idx }) {
  const [expanded, setExpanded] = useState(false)
  const typeColor = { Trend: '#3b82f6', Gap: '#ef4444', 'Future Direction': '#10b981' }
  const color = typeColor[insight.type] || '#8b5cf6'
  const hasCitations = insight.supporting_papers?.length > 0

  return (
    <li className="insight-item" style={{ borderLeftColor: color }}>
      <div className="insight-header" style={{ color }}>
        <span className="insight-type-badge" style={{ background: `${color}22`, color }}>
          {insight.type}
        </span>
      </div>
      <p className="insight-text">{insight.text}</p>

      {hasCitations && (
        <>
          <button
            className="citations-toggle"
            onClick={() => setExpanded(e => !e)}
            style={{ color }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Hide' : 'Show'} {insight.supporting_papers.length} supporting paper{insight.supporting_papers.length > 1 ? 's' : ''}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.ul
                className="citations-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {insight.supporting_papers.map((sp, j) => (
                  <li key={j} className="citation-item">
                    <span className="citation-dot" style={{ background: color }} />
                    <div>
                      <span className="citation-title">{sp.title}</span>
                      <span className="citation-evidence">→ {sp.evidence}</span>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}
    </li>
  )
}

function ArchitectureTab() {
  return (
    <div className="arch-container">
      <div className="glass-panel arch-hero">
        <h2 className="card-title"><Network size={22} /> System Architecture</h2>
        <p className="arch-desc">
          A 5-stage autonomous multi-agent pipeline powered by a RAG (Retrieval-Augmented Generation)
          architecture. Each agent is independently orchestrated and communicates via structured JSON over SSE streams.
        </p>
        <div className="arch-pipeline-row">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="arch-node">
                <div className="arch-node-icon">{step.icon}</div>
                <span>{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <div className="arch-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="arch-cards">
        {ARCH_NODES.map((node, i) => (
          <motion.div
            key={i}
            className="glass-panel arch-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="arch-card-icon">{node.icon}</div>
            <h3 className="arch-card-title">{node.title}</h3>
            <p className="arch-card-desc">{node.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel rag-section">
        <h2 className="card-title"><Zap size={22} /> RAG Data Flow</h2>
        <div className="rag-flow">
          {['arXiv API', 'PDF Download', 'Text Chunking', 'FAISS Index', 'Semantic Retrieval', 'LLM Synthesis'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="rag-step">
                <div className="rag-step-num">{i + 1}</div>
                <span>{step}</span>
              </div>
              {i < arr.length - 1 && <div className="rag-connector" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="glass-panel scoring-arch">
        <h2 className="card-title"><BarChart2 size={22} /> Relevance Scoring Formula</h2>
        <div className="formula-block">
          <code>
            Relevance Score = 0.4 × Keyword Match + 0.3 × Semantic Similarity + 0.3 × Citation Relevance
          </code>
        </div>
        <div className="formula-rows">
          <div className="formula-row"><span className="formula-weight tag-blue">0.4</span><span><strong>Keyword Match</strong> — fraction of query keywords found in title + abstract</span></div>
          <div className="formula-row"><span className="formula-weight tag-purple">0.3</span><span><strong>Semantic Similarity</strong> — approximated via keyword density × 0.75 + 0.28</span></div>
          <div className="formula-row"><span className="formula-weight tag-green">0.3</span><span><strong>Citation Relevance</strong> — scaled by paper count: 0.55 + n × 0.10</span></div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [query, setQuery]           = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [stepStates, setStepStates] = useState({})
  const [results, setResults]       = useState(null)
  const [error, setError]           = useState(null)
  const [activeTab, setActiveTab]   = useState('research')
  const esRef = useRef(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setStepStates({})
    setResults(null)
    setError(null)

    if (esRef.current) esRef.current.close()

    try {
      const response = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Server error')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processChunk = (chunk) => {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.event === 'step') {
              setStepStates(prev => ({
                ...prev,
                [payload.step]: { status: payload.status, detail: payload.detail }
              }))
            } else if (payload.event === 'result') {
              setResults(payload.data)
              setIsSearching(false)
            } else if (payload.event === 'error') {
              setError(payload.detail)
              setIsSearching(false)
            }
          } catch { /* ignore parse errors */ }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        processChunk(decoder.decode(value, { stream: true }))
      }
      setIsSearching(false)

    } catch (err) {
      setError(err.message)
      setIsSearching(false)
    }
  }

  const handleExport = () => {
    if (!results) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 15, contentW = pageW - margin * 2
    let y = 20

    doc.setFillColor(26, 32, 55)
    doc.rect(0, 0, pageW, 35, 'F')
    doc.setTextColor(139, 92, 246); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text('Research Report', margin, 16)
    doc.setFontSize(9); doc.setTextColor(160, 170, 200); doc.setFont('helvetica', 'normal')
    doc.text(`Query: ${query}`, margin, 24)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 30)
    y = 45

    doc.setTextColor(139, 92, 246); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Executive Summary', margin, y); y += 7
    doc.setDrawColor(139, 92, 246); doc.setLineWidth(0.5)
    doc.line(margin, y, pageW - margin, y); y += 5
    doc.setTextColor(30, 30, 30); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const summaryLines = doc.splitTextToSize(results.summary, contentW)
    doc.text(summaryLines, margin, y); y += summaryLines.length * 5 + 8

    doc.setTextColor(139, 92, 246); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Methodology Comparison', margin, y); y += 4
    doc.setDrawColor(139, 92, 246); doc.line(margin, y, pageW - margin, y); y += 4

    autoTable(doc, {
      startY: y,
      head: [['Paper', 'Model Type', 'Dataset', 'Accuracy', 'Complexity', 'Limitation']],
      body: results.papers.map(p => [p.title||'—', p.model_type||p.method||'—', p.dataset||'—', p.accuracy||'—', p.complexity||'—', p.limitation||'—']),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { cellPadding: 2.5, overflow: 'linebreak' },
    })
    y = doc.lastAutoTable.finalY + 12

    if (y > 250) { doc.addPage(); y = 20 }
    doc.setTextColor(139, 92, 246); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Synthesized Insights', margin, y); y += 4
    doc.setDrawColor(139, 92, 246); doc.line(margin, y, pageW - margin, y); y += 6

    const typeColors = { Trend: [59, 130, 246], Gap: [239, 68, 68], 'Future Direction': [16, 185, 129] }
    results.insights.forEach(insight => {
      if (y > 270) { doc.addPage(); y = 20 }
      const color = typeColors[insight.type] || [99, 102, 241]
      doc.setFillColor(...color); doc.roundedRect(margin, y, 28, 6, 2, 2, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.text(insight.type || 'Insight', margin + 2, y + 4)
      doc.setTextColor(30, 30, 30); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(insight.text, contentW - 32)
      doc.text(lines, margin + 32, y + 4)
      y += Math.max(lines.length * 5, 8) + 4
      if (insight.supporting_papers?.length) {
        insight.supporting_papers.forEach(sp => {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.setFontSize(8); doc.setTextColor(100, 100, 120)
          const evLines = doc.splitTextToSize(`  ↳ ${sp.title}: ${sp.evidence}`, contentW - 8)
          doc.text(evLines, margin + 4, y)
          y += evLines.length * 4.5 + 2
        })
      }
    })

    const total = doc.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 170, 200)
      doc.text(`AI Research Assistant · Page ${i} of ${total}`, margin, 292)
    }
    const filename = `Research_Report_${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const showPipeline = isSearching || Object.keys(stepStates).length > 0

  return (
    <div className="app-container">
      <header>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Research Assistant
        </motion.h1>
        <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          Autonomous multi-agent knowledge synthesis engine
        </motion.p>
      </header>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} hasResults={!!results} />

      <AnimatePresence mode="wait">
        {activeTab === 'research' && (
          <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <motion.div className="glass-panel" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <form onSubmit={handleSearch} className="search-container">
                <input
                  id="research-query"
                  type="text"
                  placeholder="What would you like to research? (e.g. Latest NLP models)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  disabled={isSearching}
                />
                <button type="submit" id="search-btn" disabled={isSearching || !query.trim()}>
                  {isSearching ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                  {isSearching ? 'Analyzing...' : 'Research'}
                </button>
              </form>
              {error && (
                <div className="error-box">
                  ⚠️ {error}
                </div>
              )}
            </motion.div>

            <AnimatePresence>
              {showPipeline && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AgentThinking steps={stepStates} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {results && (
                <motion.div
                  key="results"
                  className="results-grid"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {/* Summary + Scoring */}
                  <div className="glass-panel">
                    <div className="summary-header">
                      <h2 className="card-title"><FileText size={22} /> Executive Summary</h2>
                      <button id="export-btn" onClick={handleExport} className="export-btn">
                        <Download size={15} /> Export PDF
                      </button>
                    </div>
                    <p className="summary-text">{results.summary}</p>
                    <ScoringPanel scoring={results.scoring} />
                  </div>

                  {/* Comparison Table */}
                  <ComparisonTable papers={results.papers} />

                  {/* Insights */}
                  <div className="glass-panel">
                    <h2 className="card-title"><Lightbulb size={22} /> Synthesized Insights
                      <span className="insights-sub">with explainability</span>
                    </h2>
                    <ul className="insight-list">
                      {results.insights.map((insight, idx) => (
                        <InsightCard key={idx} insight={insight} idx={idx} />
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'architecture' && (
          <motion.div key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ArchitectureTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
