# Hướng dẫn triển khai với URL tùy chỉnh

File này hướng dẫn cách thay đổi URL từ localhost sang địa chỉ tùy chỉnh khi triển khai hệ thống.

## Các file cần chú ý

Hệ thống đã được thiết kế để sử dụng file cấu hình trung tâm, giúp việc thay đổi URL dễ dàng hơn:

- `frontend/src/config.js`: File cấu hình trung tâm chứa tất cả các URL API
- `frontend/src/lib/api.js`: Sử dụng URL từ config để tạo các instance axios

## Cách thay đổi URL

### Sử dụng biến môi trường

**Frontend**:
- File `.env.production` đã tồn tại trong thư mục `frontend/`. Bạn chỉ cần sửa các giá trị sau:
```
VITE_API_URL=https://api.your-domain.com
VITE_RAG_API_URL=https://rag.your-domain.com
```

**Backend**:
- File `.env` đã được tạo sẵn trong thư mục `Backend/`. Chỉ cần mở file này và sửa giá trị `API_RAG_URL` nếu muốn thay đổi:
```
API_RAG_URL=https://rag.your-domain.com
```

## Kiểm tra sau khi thay đổi

Sau khi thay đổi URL, hãy kiểm tra:

1. Frontend có thể kết nối được với Backend API và RAG API
2. Các tính năng như authentication, chat, quiz, và grading vẫn hoạt động bình thường
3. CORS được cấu hình đúng đắn trên cả Backend và RAG API

## Lưu ý về CORS

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