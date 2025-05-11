# Dự án GiaSuToan

Ứng dụng full-stack với giao diện người dùng React và backend Flask, hỗ trợ gia sư giáo dục với khả năng RAG (Retrieval-Augmented Generation).

## Yêu cầu hệ thống

- Node.js (v18+)
- Python (v3.11+)
- Git
- Docker & Docker Compose (để triển khai bằng container)

## Cấu trúc dự án

```
GiaSuToan/
├── frontend/       # Giao diện React (Vite)
├── Backend/        # Backend Flask
│   ├── mongoDB/    # Cấu hình MongoDB
│   ├── routes/     # Các route API
│   ├── middleware/ # Middleware xác thực
│   ├── chroma_db/  # Cơ sở dữ liệu vector
│   ├── documents/  # Lưu trữ tài liệu
│   ├── uploads/    # Thư mục tải lên
│   ├── API_Rag.py  # Dịch vụ FastAPI cho RAG
│   ├── Rag.py      # Chức năng RAG cốt lõi
│   └── embedding_service.py # Dịch vụ nhúng tài liệu
├── docker-compose.yml # Cấu hình Docker
└── render.yaml     # Cấu hình triển khai Render
```

## Bắt đầu

### Sao chép Repository

```bash
git clone <repository-url>
cd GiaSuToan
```

### Triển khai Docker (Được khuyến nghị)

Cách dễ nhất để chạy toàn bộ ứng dụng là sử dụng Docker Compose:

```bash
docker-compose up -d
```

Điều này sẽ khởi động:
- Dịch vụ Frontend tại http://localhost:3000
- Dịch vụ Backend tại http://localhost:5000
- Dịch vụ API RAG tại http://localhost:8000

### Cài đặt Backend (Thủ công)

1. Thiết lập môi trường ảo Python và cài đặt các phụ thuộc:

```bash
cd Backend
python -m venv venv

# Trên Windows
venv\Scripts\activate

# Trên macOS/Linux
source venv/bin/activate

# Cài đặt các phụ thuộc
pip install -r requirements.txt
```

2. Tạo file `.env` trong thư mục Backend:

```
# Kết nối MongoDB (Ứng dụng hiện tại đang sử dụng MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Cài đặt JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRES=3600

# Cài đặt RAG API
API_RAG_URL=http://localhost:8000
```

3. Cấu hình MongoDB:
   - Ứng dụng đã được cấu hình để kết nối với MongoDB Atlas
   - Nếu bạn muốn sử dụng MongoDB cục bộ, hãy chỉnh sửa `Backend/mongoDB/config.py` để thay đổi chuỗi kết nối

4. Đảm bảo các thư mục sau tồn tại (tạo chúng nếu chưa có):
   - `Backend/chroma_db/`
   - `Backend/uploads/`
   - `Backend/documents/`

5. Khởi động Server Backend:

```bash
python app.py
```

Server backend sẽ chạy tại http://localhost:5000

### Cài đặt Dịch vụ API RAG (Thủ công)

Để chạy dịch vụ RAG riêng biệt:

```bash
cd Backend
python -m venv venv  # Nếu chưa tạo
venv\Scripts\activate  # Trên Windows
pip install -r requirements.txt.api_rag
uvicorn API_Rag:app --host 0.0.0.0 --port 8000
```

Dịch vụ API RAG sẽ chạy tại http://localhost:8000

### Cài đặt Frontend (Thủ công)

1. Cài đặt các phụ thuộc:

```bash
cd frontend
npm install
```

2. Khởi động server phát triển:

```bash
npm run dev
```

Server phát triển frontend sẽ chạy tại http://localhost:3000

## Triển khai trên Render

Dự án này được cấu hình để dễ dàng triển khai trên Render bằng file `render.yaml`.

### Yêu cầu triển khai

1. Tài khoản Render
2. Cơ sở dữ liệu MongoDB Atlas (đã được cấu hình sẵn)

### Các bước triển khai

1. Đẩy mã của bạn lên repository Git (GitHub, GitLab, v.v.)
2. Trong bảng điều khiển Render, nhấp vào "New" và chọn "Blueprint"
3. Kết nối repository Git của bạn
4. Render sẽ tự động phát hiện cấu hình `render.yaml`
5. Cập nhật các biến môi trường nếu cần:
   - `MONGO_URI` có thể giữ nguyên hoặc thay đổi tùy nhu cầu
   - Các biến khác sẽ được đặt tự động

### Triển khai thủ công

Nếu bạn muốn triển khai các dịch vụ riêng biệt:

#### Backend

1. Tạo Web Service mới trong Render
2. Kết nối repository của bạn
3. Đặt lệnh build: `pip install -r Backend/requirements.txt`
4. Đặt lệnh khởi động: `cd Backend && gunicorn app:app --bind 0.0.0.0:$PORT`
5. Thêm các biến môi trường:
   - `MONGO_URI` (sử dụng chuỗi kết nối MongoDB Atlas)
   - `JWT_SECRET_KEY`
   - `DB_NAME`
   - `API_RAG_URL`

#### Dịch vụ API RAG

1. Tạo Web Service mới trong Render
2. Kết nối repository của bạn
3. Đặt lệnh build: `pip install -r Backend/requirements.txt.api_rag`
4. Đặt lệnh khởi động: `cd Backend && uvicorn API_Rag:app --host 0.0.0.0 --port $PORT`
5. Thêm biến môi trường:
   - `GENMINI_API_KEY` (Google Gemini API key)

#### Frontend

1. Tạo Static Site mới trong Render
2. Kết nối repository của bạn
3. Đặt lệnh build: `cd frontend && npm install && npm run build`
4. Đặt thư mục phát hành: `frontend/dist`
5. Thêm các biến môi trường:
   - `VITE_API_URL` (URL của dịch vụ backend)
   - `VITE_RAG_API_URL` (URL của dịch vụ RAG API)

### Thay đổi URL khi triển khai

Khi triển khai ứng dụng trên môi trường sản xuất với domain tùy chỉnh, bạn cần thay đổi URL từ localhost sang domain thực:

#### Cách thay đổi URL

**Frontend**:
- File `.env.production` trong thư mục `frontend/` chứa các biến môi trường cho môi trường sản xuất:
```
VITE_API_URL=https://api.your-domain.com
VITE_RAG_API_URL=https://rag.your-domain.com
```

**Backend**:
- File `.env` trong thư mục `Backend/` chứa cấu hình kết nối. Chỉ cần thay đổi giá trị `API_RAG_URL`:
```
API_RAG_URL=https://rag.your-domain.com
```

#### Cấu hình CORS

Khi thay đổi domain, cần cập nhật cấu hình CORS trong `Backend/app.py` và `Backend/API_Rag.py`:

```python
# Trong app.py
CORS(app, 
     origins=["https://your-frontend-domain.com", "*"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"])

# Trong API_Rag.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Tính năng

- Xác thực người dùng với JWT
- Quản lý tài liệu với dịch vụ nhúng
- Tìm kiếm vector với ChromaDB
- RAG (Retrieval-Augmented Generation) cho nội dung giáo dục
- Hệ thống quiz
- Giao diện quản trị
- Chấm điểm bài toán với AI
- Tạo câu hỏi thích ứng

## Các Route API

- Xác thực: `/api/auth/*`
- Chat: `/api/chat/*`
- Quản trị: `/api/admin/*`
- Quiz: `/api/quiz/*`
- Tài liệu: `/api/documents/*`
- RAG API: `/answer`, `/Multiple_Choice_Questions`, v.v.

## Xử lý sự cố

- **Vấn đề ChromaDB**: Nếu bạn gặp sự cố với ChromaDB, hãy đảm bảo thư mục `chroma_db` tồn tại và model SentenceTransformer được cài đặt đúng cách.
- **Kết nối MongoDB**: Kiểm tra chuỗi kết nối MongoDB Atlas trong file .env hoặc trong `mongoDB/config.py` là chính xác.
- **Vấn đề CORS**: Backend được cấu hình để cho phép các yêu cầu từ nhiều nguồn khác nhau, nhưng bạn có thể cần điều chỉnh cài đặt CORS trong `app.py` nếu bạn lưu trữ frontend trên một domain khác.
- **Thiếu phụ thuộc**: Nếu bạn gặp lỗi import module, hãy đảm bảo tất cả các phụ thuộc được cài đặt thông qua `pip install -r requirements.txt` và `pip install -r requirements.txt.api_rag`.
- **Lỗi bson/pymongo**: Nếu gặp lỗi `cannot import name 'SON' from 'bson'`, hãy gỡ cài đặt package bson độc lập và cài đặt lại pymongo:
  ```bash
  pip uninstall -y bson
  pip install pymongo==4.12.1
  ```
  KHÔNG thêm package bson vào file requirements.txt vì sẽ xung đột với bson của pymongo.
- **Lỗi Build trong Render**: Nếu bạn gặp lỗi build trên Render:
  - Kiểm tra package.json trong thư mục gốc có chứa các script build chính xác
  - Đảm bảo file .npmrc có mặt với `legacy-peer-deps=true` để xử lý xung đột phụ thuộc
  - Với các vấn đề frontend, hãy thử triển khai frontend và backend dưới dạng các dịch vụ riêng biệt
  - **Lưu ý về phân biệt chữ hoa/thường**: Đảm bảo tên thư mục khớp chính xác (ví dụ: "Frontend" so với "frontend") vì một số hệ thống phân biệt chữ hoa/thường

## Phát triển

Để xây dựng lại schema cơ sở dữ liệu:
```bash
curl -X POST http://localhost:5000/api/reinitialize-db
```
(Lưu ý: Endpoint này chỉ hoạt động khi được gọi từ localhost)

## Giấy phép

MIT