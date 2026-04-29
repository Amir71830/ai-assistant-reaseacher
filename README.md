# 🔬 AI Research Assistant

An autonomous multi-agent AI research assistant that automates literature reviews using arXiv, RAG pipelines, and a modern React frontend.

---

## 🗂️ Project Structure

```
ai-research-assistant/
├── backend/                  # Python FastAPI backend
│   ├── agents/               # Multi-agent pipeline (planner, retriever, analyzer, writer)
│   ├── core/                 # RAG engine & utilities
│   ├── main.py               # FastAPI entry point
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Main application
│   │   └── index.css         # Global styles
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.9+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | Latest | https://git-scm.com |
| VSCode | Latest | https://code.visualstudio.com |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Amir71830/ai-assistant-reaseacher.git
cd ai-assistant-reaseacher
```

Open in VSCode:
```bash
code .
```

---

### 2. Backend Setup (Python / FastAPI)

#### a) Create & activate a virtual environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

#### b) Install dependencies

```bash
pip install -r requirements.txt
```

#### c) Create the `.env` file

Create a file at `backend/.env` with the following content:

```env
HUGGINGFACE_API_TOKEN=your_huggingface_token_here
```

> Get your free token at: https://huggingface.co/settings/tokens

#### d) Start the backend server

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup (React / Vite)

Open a **new terminal** in VSCode (`Ctrl + Shift + `` ` ``), then:

```bash
cd frontend
npm install
npm run dev
```

The app will be live at: **http://localhost:5173**

---

## 🖥️ Running with VSCode (Recommended)

### Use the Split Terminal

1. Press `Ctrl + Shift + `` ` ``  to open terminal
2. Run the **backend** in terminal 1:
   ```bash
   cd backend && venv\Scripts\activate && uvicorn main:app --reload
   ```
3. Click the **+** icon to open terminal 2, run the **frontend**:
   ```bash
   cd frontend && npm run dev
   ```

### Recommended VSCode Extensions

- **Python** (`ms-python.python`) — Python IntelliSense & debugging
- **Pylance** (`ms-python.vscode-pylance`) — Type checking
- **ES7+ React/Redux** (`dsznajder.es7-react-js-snippets`) — React snippets
- **Vite** (`antfu.vite`) — Vite integration

---

## 🔗 Ports Summary

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Make sure virtualenv is activated: `venv\Scripts\activate` |
| `npm: command not found` | Install Node.js from https://nodejs.org |
| `CORS error` in browser | Ensure backend is running on port 8000 |
| Port already in use | Change port: `uvicorn main:app --port 8001` |
| HuggingFace 401 error | Check your API token in `backend/.env` |

---

## 📄 License

MIT
# ai-research-assistant
