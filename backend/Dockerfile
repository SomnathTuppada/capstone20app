# backend/Dockerfile
FROM python:3.11-slim

# Avoid writing .pyc files and enable buffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps required for some Python packages (pandas, openpyxl, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code and model/scaler files
COPY backend/ ./ 

# Expose port used by gunicorn
EXPOSE 5000

# Use gunicorn to serve the Flask app: module is app:app (your app.py must expose `app`)
# You can reduce/increase workers as necessary
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
