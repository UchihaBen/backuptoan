import datetime
from bson import ObjectId
from mongoDB.config import conversations_collection, messages_collection

def create_conversation(participants, title=None):
    """
    Tạo cuộc hội thoại mới
    participants: danh sách id người tham gia
    title: tiêu đề hội thoại (optional)
    """
    # Debug log
    print(f"Creating conversation for participants: {participants}, title: {title}")
    print(f"Participants type: {type(participants)}, first item type: {type(participants[0]) if participants else 'None'}")
    
    # Đảm bảo participants là list các ObjectId
    processed_participants = []
    for participant in participants:
        if isinstance(participant, str) and participant != "bot":
            try:
                processed_participants.append(ObjectId(participant))
            except:
                processed_participants.append(participant)
        else:
            processed_participants.append(participant)
    
    conversation = {
        "participants": processed_participants,
        "user_id": str(processed_participants[0]) if processed_participants else "",
        "title": title or "Hội thoại mới",
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    
    print(f"Final conversation object to insert: {conversation}")
    
    try:
        conversation_id = conversations_collection.insert_one(conversation).inserted_id
        print(f"Created conversation with ID: {conversation_id}")
        return conversation_id
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise

def save_message(conversation_id, user_id, content, message_type="text"):
    """
    Lưu tin nhắn vào database
    conversation_id: id cuộc hội thoại
    user_id: id người gửi (hoặc "bot" nếu là tin nhắn từ bot)
    content: nội dung tin nhắn
    message_type: loại tin nhắn (text, image, etc.)
    """
    # Chuyển đổi conversation_id thành ObjectId nếu là string
    if isinstance(conversation_id, str):
        conversation_id = ObjectId(conversation_id)
    
    # Tạo message object
    message = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "content": content,
        "type": message_type,
        "timestamp": datetime.datetime.utcnow()
    }
    
    try:
        # Lưu message
        message_id = messages_collection.insert_one(message).inserted_id
        
        # Cập nhật thời gian và nội dung tin nhắn mới nhất trong cuộc hội thoại
        conversations_collection.update_one(
            {"_id": conversation_id},
            {"$set": {
                "updated_at": datetime.datetime.utcnow(),
                "last_message": content[:50] + "..." if len(content) > 50 else content
            }}
        )
        
        return message_id
    except Exception as e:
        print(f"Error saving message: {e}")
        raise

def get_conversation_messages(conversation_id, limit=50):
    """
    Lấy tin nhắn của một cuộc hội thoại
    conversation_id: id cuộc hội thoại
    limit: số lượng tin nhắn tối đa trả về
    """
    try:
        # Chuyển đổi conversation_id thành ObjectId nếu là string
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        
        # Lấy tin nhắn của cuộc hội thoại, sắp xếp theo thời gian
        messages = list(messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for message in messages:
            message["_id"] = str(message["_id"])
            message["conversation_id"] = str(message["conversation_id"])
            message["timestamp"] = message["timestamp"].isoformat()
        
        return messages
    except Exception as e:
        print(f"Error getting messages: {e}")
        raise

def get_user_conversations(user_id, limit=10):
    """
    Lấy danh sách cuộc hội thoại của một người dùng
    user_id: id người dùng
    limit: số lượng cuộc hội thoại tối đa trả về
    """
    try:
        # Debug log
        print(f"Getting conversations for user_id: {user_id}, type: {type(user_id)}")
        
        # Chuyển đổi user_id thành ObjectId nếu là string
        if isinstance(user_id, str) and user_id != "bot":
            try:
                user_id = ObjectId(user_id)
                print(f"Converted user_id to ObjectId: {user_id}")
            except:
                print(f"Failed to convert user_id to ObjectId: {user_id}")
                pass  # Nếu không phải ObjectId hợp lệ, giữ nguyên
        
        # Query để kiểm tra
        query = {"participants": user_id}
        print(f"MongoDB query: {query}")
        
        # Lấy danh sách cuộc hội thoại, sắp xếp theo thời gian cập nhật
        conversations = list(conversations_collection.find(query).sort("updated_at", -1).limit(limit))
        
        print(f"Found {len(conversations)} conversations")
        
        # Convert ObjectId to string for JSON serialization
        for conversation in conversations:
            conversation["_id"] = str(conversation["_id"])
            conversation["created_at"] = conversation["created_at"].isoformat()
            conversation["updated_at"] = conversation["updated_at"].isoformat()
            
            # Lấy tin nhắn gần nhất để hiển thị preview
            if "last_message" not in conversation:
                last_message = messages_collection.find_one(
                    {"conversation_id": ObjectId(conversation["_id"])},
                    sort=[("timestamp", -1)]
                )
                if last_message:
                    conversation["last_message"] = last_message["content"][:50] + "..." if len(last_message["content"]) > 50 else last_message["content"]
                else:
                    conversation["last_message"] = "Không có tin nhắn"
        
        return conversations
    except Exception as e:
        print(f"Error getting conversations: {e}")
        raise

def delete_conversation(conversation_id):
    """
    Xóa một cuộc hội thoại và tất cả tin nhắn của nó
    conversation_id: id cuộc hội thoại
    returns: True nếu xóa thành công, False nếu không
    """
    try:
        # Chuyển đổi conversation_id thành ObjectId nếu là string
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        
        # Xóa tất cả tin nhắn của cuộc hội thoại
        messages_collection.delete_many({"conversation_id": conversation_id})
        
        # Xóa cuộc hội thoại
        result = conversations_collection.delete_one({"_id": conversation_id})
        
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        return False 