---
title: Municipal AI System Backend
emoji: 🏛️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# 🏛️ CivicMind: Municipal AI System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by AI](https://img.shields.io/badge/AI-Powered-blue.svg)](#core-ai-pipeline)

**CivicMind** is a full-stack municipal management platform that leverages Machine Learning to transform citizen reports into actionable operational intelligence. It automates the classification, prioritization, and routing of municipal issues (like potholes, waste, or utility failures) to ensure rapid and transparent city governance.

---

## 🚀 Key Features

- **🧠 Intelligent Routing**: Automatically predicts the department and category of a report using a custom NLP pipeline.
- **⚖️ Priority Prediction**: Evaluates report urgency (High/Medium/Low) based on historical patterns and safety risks.
- **📊 Real-time Dashboard**: A unified interface for department managers to oversee queues and verify AI predictions.
- **📱 Citizen Portal**: Intuitive submission process for citizens to report issues and track resolution status.
- **✨ Premium UI/UX**: Designed with modern aesthetics, featuring GSAP-powered animations and responsive Bento grids.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Animation**: [GSAP](https://greensock.com/gsap/) + [Motion](https://motion.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI/ML**: Scikit-learn, XGBoost, Pandas
- **Database**: Turso (libSQL)
- **Security**: JWT Authentication + Bcrypt hashing

---

## 🏗️ Project Structure

```text
├── backend/                # FastAPI Application
│   ├── app/                # Application logic & Models
│   ├── municipal.db        # Local database for dev
│   ├── sync_managers.py    # Database synchronization
│   └── unified_pipeline_v2.py # ML training & inference pipeline
├── frontend/               # React + Vite Application
│   ├── src/                # Component architecture
│   │   ├── features/       # Feature-based logic
│   │   └── services/       # API integration
│   └── public/             # Static assets (Logos, Videos)
└── Dockerfile              # Deployment configuration
```

---

## ⚙️ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Environment variables: Copy `frontend/.env.example` to `frontend/.env` and configure `VITE_API_BASE_URL`.*

---

## 🧪 Core AI Pipeline

The system uses a sequential four-model pipeline for each report:
1. **Department Model**: Predicts the target municipal department.
2. **Category Model**: Narrow down the specific issue type within the department.
3. **Priority Model**: Determines the urgency score.
4. **Repeat Detection**: Identifies if the issue has been reported multiple times recently.

*Models are trained on 1,000+ historical records for high-precision accuracy (avg. 98% accuracy).*

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

We welcome contributions to help make our cities smarter! Please feel free to open issues or submit pull requests.

---

Built with ❤️ for better cities.
