FROM python:3.11-slim

WORKDIR /app

# Cài đặt các dependencies hệ thống
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Sao chép file requirements
COPY requirements.txt .

# Cài đặt dependencies Python
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở cổng
EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["python", "app.py"] 