# Use Python base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Thiết lập pip config
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONUNBUFFERED=1

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables for model download
ENV HF_HUB_DOWNLOAD_TIMEOUT=1000
ENV HF_HUB_ENABLE_HF_TRANSFER=1
ENV HF_HUB_DISABLE_SYMLINKS_WARNING=1

# Create cache directory
RUN mkdir -p /root/.cache/torch/sentence_transformers

# Tải model trước với timeout dài hơn
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-large')"

# Copy the rest of the application
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["python", "app.py"] 