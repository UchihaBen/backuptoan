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

# Đảm bảo không có xung đột giữa bson và pymongo
# Trước tiên kiểm tra xem có package bson riêng lẻ không
RUN pip list | grep -w bson || echo "No standalone bson package, good!" && \
    # Để đảm bảo pymongo hoạt động đúng với bson, chúng ta gỡ bỏ bson riêng lẻ (nếu có) và cài đặt lại pymongo
    pip uninstall -y bson || true && \
    pip install --no-cache-dir pymongo==4.12.1

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở cổng
EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["python", "app.py"] 