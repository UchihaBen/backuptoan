FROM python:3.9-slim

WORKDIR /app

# Thiết lập pip config
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONUNBUFFERED=1

# Cài đặt các dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tạo thư mục cache cho model
RUN mkdir -p /root/.cache/torch/sentence_transformers

# Tải model trước với timeout dài hơn
ENV HF_HUB_DOWNLOAD_TIMEOUT=1000
ENV HF_HUB_ENABLE_HF_TRANSFER=1
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-large')"

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "API_Rag:app", "--host", "0.0.0.0", "--port", "8000"] 