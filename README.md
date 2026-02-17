# MediScan

An AI-powered medication scanning and analysis tool that helps you understand what's in your medicine.

## Features

- **Medication Scanner** - Capture or upload photos of medication packaging to instantly identify the medicine, its active ingredients, side effects, and symptoms it treats
- **AI-Powered Analysis** - Uses Google Gemini AI to extract structured data from medication images
- **Knowledge Graph** - Interactive visualization showing relationships between medications, ingredients, and effects
- **Symptom Search** - Search symptoms to find related medications and their treatments
- **Fuzzy Search** - Intelligent search powered by Fuse.js for finding medications and effects

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **Sigma.js + Graphology** - Graph visualization

### Backend
- **Express.js** - REST API server
- **TypeScript** - Type safety
- **Google Gemini AI** - Image analysis and medication identification
- **Fuse.js** - Fuzzy search

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mediscan
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env` file in the `backend` directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5001
   ```

### Running the Application

**Development:**

Start both servers:
```bash
# From project root
./start-dev.sh
```

Or manually:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Production:**
```bash
# Build backend
cd backend && npm run build && npm start

# Build frontend
cd frontend && npm run build && npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/scan` | Analyze medication image (base64) |
| `GET` | `/api/medications/:name` | Get medication by name |
| `GET` | `/api/ingredients/:name` | Get ingredient by name |
| `GET` | `/api/effects/:name` | Get effect by name |
| `GET` | `/api/search?q=query` | Search effects by keyword |
| `POST` | `/api/data` | Merge new data into database |

## Project Structure

```
mediscan/
├── frontend/           # Next.js frontend
│   ├── app/           # App Router pages
│   │   ├── scan/      # Medication scanner page
│   │   ├── search/    # Symptom search page
│   │   └── graph/     # Knowledge graph visualization
│   └── public/        # Static assets
├── backend/           # Express.js backend
│   ├── routes/        # API route handlers
│   │   ├── scan.ts    # Image scanning endpoint
│   │   └── api.ts     # Data retrieval endpoints
│   ├── lib/           # Utilities and store
│   └── types/         # TypeScript types
└── db.json            # JSON database storage
```

## Data Model

```typescript
interface GraphData {
  medications: {
    [name: string]: {
      name: string;
      ingredients: string[];
      sideEffects: string[];
      symptomsTreated: string[];
    };
  };
  ingredients: {
    [name: string]: {
      name: string;
      medications: string[];
      description: string;
    };
  };
  effects: {
    [name: string]: {
      name: string;
      medicationsCausingIt: string[];
      medicationsTreatingIt: string[];
      description: string;
    };
  };
}
```

## Disclaimer

This is an educational tool and should not be used as a substitute for professional medical advice. Always consult a healthcare provider for medical decisions.
