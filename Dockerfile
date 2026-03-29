FROM python:3.11-slim

# HF Spaces runs as a non-root user; create a writable home
WORKDIR /app

# Install dependencies first (better layer caching)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the full project
COPY . .

# Make sure Python can find the 'backend' package from the project root
ENV PYTHONPATH=/app

# HF Spaces exposes port 7860 by default
EXPOSE 7860

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
