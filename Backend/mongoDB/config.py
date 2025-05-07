# config.py - Kết nối MongoDB và khai báo collections
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load biến môi trường
load_dotenv()

# Lấy thông tin kết nối từ .env hoặc giá trị mặc định
# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://thanhlct1423:Thanh01042003@giasutoan.mjwwhvn.mongodb.net/?retryWrites=true&w=majority&appName=GiaSuToan")
DB_NAME = os.getenv("DB_NAME", "ChatGiaSu")

try:
    # Kết nối MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print("✅ Connected to MongoDB!")
    
    # Khai báo các collection (chỉ khai báo, KHÔNG tạo indexes/schema ở đây)
    users_collection = db["users"]
    conversations_collection = db["conversations"]
    messages_collection = db["messages"]
    exercises_collection = db["exercises"]
    questions_collection = db["questions"]
    submissions_collection = db["submissions"]
    answers_collection = db["answers"]

    # Khai báo thêm các collection mới
    user_topics_collection = db["user_topics"]  # Collection lưu chủ đề học tập của người dùng 
    quiz_attempts_collection = db["quiz_attempts"]  # Collection lưu các bài kiểm tra
    documents_collection = db["documents"]  # Collection lưu thông tin tài liệu
    chunks_collection = db["chunks"]  # Collection lưu thông tin các chunk

except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)