# db_schema.py - Khởi tạo cấu trúc database
from pymongo.errors import CollectionInvalid, OperationFailure
from mongoDB.config import db, users_collection, conversations_collection, messages_collection, questions_collection, answers_collection, submissions_collection, user_topics_collection, quiz_attempts_collection, documents_collection, chunks_collection
import datetime

def create_collections():
    """Tạo collections nếu chưa tồn tại"""
    required_collections = [
        "users", "conversations", "messages", 
        "exercises", "questions", "submissions", "answers",
        "user_topics", "quiz_attempts", "documents", "chunks"  # Thêm collections mới
    ]
    
    existing_collections = db.list_collection_names()
    
    for col in required_collections:
        if col not in existing_collections:
            try:
                db.create_collection(col)
                print(f"✅ Created collection: {col}")
            except CollectionInvalid:
                print(f"⚠️ Collection {col} already exists")

def setup_indexes():
    """Tạo indexes cho các collection (chỉ chạy 1 lần)"""
    # Indexes cho users
    if "username_1" not in users_collection.index_information():
        users_collection.create_index("username", unique=True, name="username_unique")
        users_collection.create_index("email", unique=True, name="email_unique")
    
    # Indexes cho conversations
    if "user_id_1" not in conversations_collection.index_information():
        conversations_collection.create_index("user_id", name="user_id_index")
    
    # Indexes cho messages
    if "conversation_id_1" not in messages_collection.index_information():
        messages_collection.create_index("conversation_id", name="conversation_id_index")
    
    # Indexes cho questions và answers
    questions_collection.create_index("exercise_id")
    answers_collection.create_index([("submission_id", 1), ("question_id", 1)])
    
    # Indexes cho user_topics collection
    user_topics_collection.create_index([("user_id", 1), ("topic_name", 1), ("exercise_type", 1)], 
                                         unique=True, name="user_topic_unique")
    
    # Indexes cho quiz_attempts collection
    quiz_attempts_collection.create_index("user_id", name="user_id_index")
    quiz_attempts_collection.create_index("topic_id", name="topic_id_index")
    quiz_attempts_collection.create_index("topic_name", name="topic_name_index")
    quiz_attempts_collection.create_index("completed_at", name="completed_at_index")
    
    # Indexes cho documents collection
    documents_collection.create_index("title", name="title_index")
    documents_collection.create_index("upload_date", name="upload_date_index")
    documents_collection.create_index("created_by", name="created_by_index")
    
    # Indexes cho chunks collection
    chunks_collection.create_index("document_id", name="document_id_index")
    chunks_collection.create_index([("document_id", 1), ("index", 1)], unique=True, name="document_chunk_index")
    chunks_collection.create_index("title", name="chunk_title_index")
    
    print("✅ All indexes created!")

def add_validation_rules():
    """Thêm validation schema cho collections"""
    try:
        # Validation cho users
        db.command({
            "collMod": "users",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["username", "email", "password", "role"],
                    "properties": {
                        "username": {"bsonType": "string", "minLength": 3},
                        "email": {"bsonType": "string", "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"},
                        "password": {"bsonType": "string", "minLength": 6},
                        "role": {"enum": ["user", "admin"], "description": "must be either 'user' or 'admin'"}
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho conversations
        db.command({
            "collMod": "conversations",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["participants", "title", "created_at"],
                    "properties": {
                        "participants": {"bsonType": "array", "items": {"oneOf": [{"bsonType": "objectId"}, {"bsonType": "string"}]}},
                        "title": {"bsonType": "string"},
                        "created_at": {"bsonType": "date"},
                        "updated_at": {"bsonType": "date"},
                        "last_message": {"bsonType": "string"}
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho messages
        db.command({
            "collMod": "messages",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["conversation_id", "content", "role", "timestamp"],
                    "properties": {
                        "conversation_id": {"bsonType": "string"},
                        "content": {"bsonType": "string"},
                        "role": {"enum": ["user", "assistant", "system"]},
                        "timestamp": {"bsonType": "date"}
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho user_topics
        db.command({
            "collMod": "user_topics",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "topic_name", "proficiency_level", "last_updated"],
                    "properties": {
                        "user_id": {"bsonType": "string"},
                        "topic_name": {"bsonType": "string"},
                        "proficiency_level": {"bsonType": "double", "minimum": 0, "maximum": 10},
                        "last_updated": {"bsonType": "date"},
                        "strength_areas": {"bsonType": "array", "items": {"bsonType": "string"}},
                        "weakness_areas": {"bsonType": "array", "items": {"bsonType": "string"}}
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho quiz_attempts
        db.command({
            "collMod": "quiz_attempts",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "topic_name", "topic_id", "score", "total_questions", "completed_at", "questions"],
                    "properties": {
                        "user_id": {"bsonType": "string"},
                        "topic_name": {"bsonType": "string"},
                        "topic_id": {"bsonType": "string"},
                        "exercise_type": {"bsonType": "string"},
                        "score": {"bsonType": "double", "minimum": 0, "maximum": 10},
                        "total_questions": {"bsonType": "int", "minimum": 1},
                        "total_correct": {"bsonType": "int", "minimum": 0},
                        "time_spent": {"bsonType": "int", "minimum": 0},
                        "started_at": {"bsonType": "date"},
                        "completed_at": {"bsonType": "date"},
                        "questions": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "object",
                                "required": ["question", "options", "correct_answer", "user_answer", "is_correct", "difficulty", "solution"],
                                "properties": {
                                    "question": {"bsonType": "string"},
                                    "options": {"bsonType": "array", "items": {"bsonType": "string"}},
                                    "correct_answer": {"bsonType": "int"},
                                    "user_answer": {"bsonType": "int"},
                                    "is_correct": {"bsonType": "bool"},
                                    "difficulty": {"enum": ["easy", "medium", "hard"]},
                                    "solution": {"bsonType": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho questions collection
        db.command({
            "collMod": "questions",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["topic", "created_by", "created_at", "questions"],
                    "properties": {
                        "topic": {"bsonType": "string"},
                        "created_by": {"bsonType": "string"},
                        "created_at": {"bsonType": "date"},
                        "questions": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "object",
                                "required": ["question", "options", "correct_answer", "difficulty", "solution"],
                                "properties": {
                                    "question": {"bsonType": "string"},
                                    "options": {"bsonType": "array", "items": {"bsonType": "string"}},
                                    "correct_answer": {"bsonType": "int"},
                                    "difficulty": {"enum": ["easy", "medium", "hard"]},
                                    "solution": {"bsonType": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        # Validation cho documents collection
        db.command({
            "collMod": "documents",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["title", "created_by", "upload_date", "file_type", "chunks_count"],
                    "properties": {
                        "title": {"bsonType": "string"},
                        "created_by": {"bsonType": "string"},
                        "file_path": {"bsonType": "string"},
                        "file_type": {"bsonType": "string"},
                        "file_size": {"bsonType": "int"},
                        "upload_date": {"bsonType": "date"},
                        "chunks_count": {"bsonType": "int"},
                        "total_tokens": {"bsonType": "int"},
                        "total_words": {"bsonType": "int"},
                        "chunk_settings": {
                            "bsonType": "object",
                            "properties": {
                                "chunk_size": {"bsonType": "int"},
                                "chunk_overlap": {"bsonType": "int"},
                                "avg_tokens_per_chunk": {"bsonType": "double"}
                            }
                        }
                    }
                }
            },
            "validationLevel": "strict", 
            "validationAction": "error"
        })
        
        # Validation cho chunks collection
        db.command({
            "collMod": "chunks",
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["document_id", "index", "content", "title"],
                    "properties": {
                        "document_id": {"bsonType": "string"},
                        "index": {"bsonType": "int"},
                        "title": {"bsonType": "string"},
                        "content": {"bsonType": "string"},
                        "tokens": {"bsonType": "int"},
                        "word_count": {"bsonType": "int"},
                        "embedding": {"bsonType": "array", "items": {"bsonType": "double"}}
                    }
                }
            },
            "validationLevel": "strict",
            "validationAction": "error"
        })
        
        print("✅ Added validation rules to collections")
    except Exception as e:
        print(f"❌ Error adding validation rules: {e}")

def create_initial_admin():
    """Tạo admin user mặc định (chỉ chạy 1 lần)"""
    from werkzeug.security import generate_password_hash  # Sử dụng thư viện băm phổ biến
    
    admin_data = {  
        "username": "admin",
        "email": "admin@giasu.com",
        "password": generate_password_hash("Admin@123"),  # Băm mật khẩu
        "role": "admin",
        "created_at": datetime.datetime.utcnow(),
        "is_verified": True
    }
    
    if not users_collection.find_one({"role": "admin"}):
        try:
            users_collection.insert_one(admin_data)
            print("✅ Created initial admin user")
        except Exception as e:
            print(f"❌ Failed to create admin: {e}")
    else:
        print("⚠️ Admin user already exists")

def initialize_database():
    """Chạy toàn bộ quy trình khởi tạo database"""
    print("\n🚀 Starting database initialization...")
    create_collections()
    setup_indexes()
    add_validation_rules()
    create_initial_admin()
    print("\n🎉 Database initialized successfully!")

# Các hàm tiện ích
def get_recent_attempts(user_id, topic_name=None, exercise_type=None, limit=5):
    """Lấy các bài kiểm tra gần đây của người dùng
    
    Args:
        user_id: ID của người dùng
        topic_name: Tên chủ đề (tùy chọn)
        exercise_type: Loại bài tập (tùy chọn)
        limit: Số lượng bài kiểm tra tối đa cần lấy
        
    Returns:
        List các bài kiểm tra gần đây nhất
    """
    filter_query = {"user_id": user_id}
    
    if topic_name:
        filter_query["topic_name"] = topic_name
        
    if exercise_type:
        filter_query["exercise_type"] = exercise_type
    
    # Tìm kiếm các bài kiểm tra và sắp xếp theo thời gian hoàn thành
    attempts = list(quiz_attempts_collection.find(
        filter_query
    ).sort("completed_at", -1).limit(limit))
    
    # Chuyển đổi ObjectId thành string để dễ sử dụng trong JSON
    for attempt in attempts:
        attempt["_id"] = str(attempt["_id"])
        if "user_id" in attempt:
            attempt["user_id"] = str(attempt["user_id"])
        if "topic_id" in attempt:
            attempt["topic_id"] = str(attempt["topic_id"])
    
    return attempts

def get_all_documents(limit=100, skip=0):
    """Lấy danh sách tất cả các tài liệu đã tải lên
    
    Args:
        limit: Số lượng tài liệu tối đa cần lấy
        skip: Số lượng tài liệu cần bỏ qua (phân trang)
        
    Returns:
        List các tài liệu
    """
    documents = list(documents_collection.find().sort("upload_date", -1).skip(skip).limit(limit))
    
    # Chuyển đổi ObjectId thành string
    for doc in documents:
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        if "created_by" in doc:
            doc["created_by"] = str(doc["created_by"])
    
    return documents

def get_document_by_id(document_id):
    """Lấy thông tin chi tiết của một tài liệu
    
    Args:
        document_id: ID của tài liệu
        
    Returns:
        Thông tin chi tiết của tài liệu hoặc None nếu không tìm thấy
    """
    document = documents_collection.find_one({"_id": document_id})
    
    if document:
        document["id"] = str(document["_id"])
        document["_id"] = str(document["_id"])
        if "created_by" in document:
            document["created_by"] = str(document["created_by"])
    
    return document

def get_document_chunks(document_id):
    """Lấy tất cả các chunk của một tài liệu
    
    Args:
        document_id: ID của tài liệu (có thể là string hoặc ObjectId)
        
    Returns:
        List các chunk thuộc tài liệu
    """
    # Chuyển đổi document_id sang string nếu cần thiết
    doc_id_str = str(document_id)
    
    print(f"Tìm các chunk cho document_id: {doc_id_str}")
    
    # Thử tìm kiếm với document_id là string
    chunks = list(chunks_collection.find({"document_id": doc_id_str}).sort("index", 1))
    
    # Nếu không tìm thấy chunk nào, in thông tin debug
    if not chunks:
        print(f"Không tìm thấy chunk nào với document_id: {doc_id_str}")
        # Liệt kê một vài chunk đầu tiên trong collection để kiểm tra
        sample_chunks = list(chunks_collection.find().limit(3))
        print(f"Mẫu các chunk trong DB: {sample_chunks}")
    else:
        print(f"Tìm thấy {len(chunks)} chunk")
    
    # Chuyển đổi ObjectId thành string
    for chunk in chunks:
        chunk["id"] = str(chunk["_id"])
        chunk["_id"] = str(chunk["_id"])
    
    return chunks

def get_chunk_by_id(chunk_id):
    """Lấy thông tin của một chunk cụ thể
    
    Args:
        chunk_id: ID của chunk
        
    Returns:
        Thông tin của chunk hoặc None nếu không tìm thấy
    """
    chunk = chunks_collection.find_one({"_id": chunk_id})
    
    if chunk:
        chunk["id"] = str(chunk["_id"])
        chunk["_id"] = str(chunk["_id"])
    
    return chunk

def get_chunk_by_document_and_index(document_id, index):
    """Lấy thông tin của một chunk dựa vào ID tài liệu và chỉ số
    
    Args:
        document_id: ID của tài liệu (có thể là string hoặc ObjectId)
        index: Chỉ số của chunk
        
    Returns:
        Thông tin của chunk hoặc None nếu không tìm thấy
    """
    # Chuyển đổi document_id sang string nếu cần thiết
    doc_id_str = str(document_id)
    
    print(f"Tìm chunk với document_id: {doc_id_str}, index: {index}")
    
    # Tìm chunk với document_id là string và index
    chunk = chunks_collection.find_one({"document_id": doc_id_str, "index": index})
    
    if not chunk:
        print(f"Không tìm thấy chunk nào với document_id: {doc_id_str}, index: {index}")
    else:
        print(f"Tìm thấy chunk: {chunk['_id']}")
    
    if chunk:
        chunk["id"] = str(chunk["_id"])
        chunk["_id"] = str(chunk["_id"])
    
    return chunk

if __name__ == "__main__":
    initialize_database()