# Municipal AI System - Local Development Guide

Follow these steps to set up and run the Municipal AI System locally.

## Prerequisities

- **Python 3.10+**
- **Node.js 18+** & **npm**

---

## 1. Backend Setup (FastAPI)

The backend handles the AI models and database interactions.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv .venv
   # Activate on Windows:
   .venv\Scripts\activate
   # Activate on macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   ```bash
   python app.py
   ```
   *The backend will be available at: `http://localhost:8000`*

---

## 2. Frontend Setup (React + Vite)

The frontend provides the user interface for the system.

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Set up Environment Variables:**
   - Create a `.env` file in the `frontend` folder.
   - You can copy the contents of `.env.example` and update the values.
   - **Crucial:** Ensure `VITE_API_BASE_URL` points to your local backend:
     ```env
     VITE_API_BASE_URL="http://localhost:8000"
     GEMINI_API_KEY="your_gemini_api_key_here"
     ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The frontend will be available at: `http://localhost:3000`*

---

## Troubleshooting

- **CORS Issues:** The backend is configured to allow requests from the frontend port. Ensure the ports match your configuration.
- **Model Files:** Ensure the `.pkl` model files are present in the `backend` directory, as they are required for the AI pipeline to function.
- **Node Version:** If you encounter errors during `npm install`, ensure you are using a compatible Node.js version.
