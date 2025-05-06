# GiaSuToan Project

Full-stack application with a React frontend and Flask backend for educational tutoring with RAG (Retrieval-Augmented Generation) capabilities.

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- MongoDB
- Git

## Project Structure

```
GiaSuToan/
├── Frontend/       # React frontend (Vite)
└── Backend/        # Flask backend
    ├── mongoDB/    # MongoDB configuration
    ├── routes/     # API routes
    ├── models/     # Data models
    ├── chroma_db/  # Vector database
    └── uploads/    # File uploads directory
```

## Getting Started

### Clone the Repository

```bash
git clone <repository-url>
cd GiaSuToan
```

### Backend Setup

1. Set up a Python virtual environment and install dependencies:

```bash
cd Backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

2. Create a `.env` file in the Backend directory:

```
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017
DB_NAME=ChatGiaSu

# JWT Settings
JWT_SECRET=your_jwt_secret_key
```

3. Ensure MongoDB is running:
   - Start MongoDB service on your system
   - The application will connect to `mongodb://localhost:27017` by default

4. Make sure the following directories exist (create them if they don't):
   - `Backend/chroma_db/`
   - `Backend/uploads/`

5. Start the Backend Server:

```bash
python app.py
```

The backend server will start on http://localhost:5000

### Frontend Setup

1. Install dependencies:

```bash
cd Frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

The frontend development server will start on http://localhost:5173

## Deployment on Render

This project is configured for easy deployment on Render using the `render.yaml` file.

### Requirements for Deployment

1. A Render account
2. MongoDB Atlas database (or any MongoDB provider)

### Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. In Render dashboard, click "New" and select "Blueprint"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` configuration
5. Update the environment variables:
   - Set `MONGO_URI` to your MongoDB connection string
   - Other variables will be automatically set

### Manual Deployment

If you prefer to deploy services separately:

#### Backend

1. Create a new Web Service in Render
2. Connect your repository
3. Set build command: `pip install -r Backend/requirements.txt`
4. Set start command: `cd Backend && gunicorn app:app --bind 0.0.0.0:$PORT`
5. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `DB_NAME`

#### Frontend

1. Create a new Static Site in Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set publish directory: `Frontend/dist`
5. Add environment variable:
   - `VITE_API_URL` (URL of your backend service)

## Features

- User authentication with JWT
- Document management with embedding services
- Vector search with ChromaDB
- RAG (Retrieval-Augmented Generation) for educational content
- Quiz system
- Admin interfaces

## API Routes

- Authentication: `/api/auth/*`
- Chat: `/api/chat/*`
- Admin: `/api/admin/*`
- Quiz: `/api/quiz/*`
- Documents: `/api/documents/*`

## Troubleshooting

- **ChromaDB Issues**: If you encounter problems with ChromaDB, ensure the `chroma_db` directory exists and the SentenceTransformer model is properly installed.
- **MongoDB Connection**: Verify MongoDB is running and the connection string in `.env` is correct.
- **CORS Issues**: The backend is configured to allow requests from multiple origins, but you may need to adjust CORS settings in `app.py` if you're hosting the frontend on a different domain.
- **Missing Dependencies**: If you encounter module import errors, ensure all dependencies are installed via `pip install -r requirements.txt`.
- **Build Errors in Render**: If you encounter build errors on Render:
  - Check that package.json in the root directory contains the correct build scripts
  - Ensure .npmrc file is present with `legacy-peer-deps=true` to handle dependency conflicts
  - For frontend issues, try deploying the frontend and backend as separate services
  - **Note on Case Sensitivity**: Ensure that folder names match exactly (e.g. "Frontend" vs "frontend") as some systems are case-sensitive

## Development

To rebuild the database schema:
```bash
curl -X POST http://localhost:5000/api/reinitialize-db
```
(Note: This endpoint only works when called from localhost)

## License