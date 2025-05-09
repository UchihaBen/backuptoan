from flask import Blueprint, request, jsonify
import requests
import datetime
import os
from bson import ObjectId
from services.chat_service import save_message, create_conversation, get_conversation_messages, get_user_conversations, delete_conversation
from middleware.auth_middleware import token_required

chat = Blueprint('chat', __name__)

# Lấy URL của API_RAG từ biến môi trường, mặc định là host.docker.internal:8000
API_RAG_URL = os.environ.get('API_RAG_URL', 'http://host.docker.internal:8000')

@chat.route('/ask', methods=['POST'])
@token_required
def ask_question(current_user):
    """
    API endpoint xử lý câu hỏi từ frontend:
    1. Nhận câu hỏi từ frontend
    2. Lưu câu hỏi vào database
    3. Gọi API AI để lấy câu trả lời
    4. Lưu câu trả lời vào database
    5. Trả về kết quả cho frontend
    """
    data = request.get_json()
    user_id = current_user['_id']  # Lấy user_id từ token
    question = data.get('question')
    conversation_id = data.get('conversationId')
    
    # Validate input
    if not question:
        return jsonify({"error": "Question is required"}), 400
    
    # Nếu không có conversation_id, tạo mới
    if not conversation_id:
        conversation_id = create_conversation([user_id])
    
    # Lưu câu hỏi của người dùng vào DB
    user_message_id = save_message(conversation_id, user_id, question)
    
    try:
        # URL cho API_RAG
        rag_url = f"{API_RAG_URL}/answer"
        print(f"DEBUG: Đang kết nối tới API RAG qua URL: {rag_url}")
        
        # Thông số kết nối
        timeout_seconds = 30
        headers = {"Content-Type": "application/json"}
        payload = {"question": question}
        
        # Gửi request tới API service
        print(f"DEBUG: Gửi payload: {str(payload)}")
        ai_response = requests.post(
            rag_url, 
            json=payload, 
            timeout=timeout_seconds,
            headers=headers
        )
        
        print(f"DEBUG: Nhận phản hồi từ {rag_url} - Status code: {ai_response.status_code}")
        
        if ai_response.status_code == 200:
            response_data = ai_response.json()
            print(f"DEBUG: Nội dung phản hồi từ {rag_url}: {str(response_data)[:100]}...")
            bot_response = response_data.get("answer", "Không thể lấy câu trả lời")
        else:
            error_text = ai_response.text[:200] if ai_response.text else "Không có nội dung phản hồi"
            print(f"DEBUG: Lỗi từ {rag_url}: Status {ai_response.status_code} - {error_text}")
            bot_response = f"Lỗi từ AI service: Status code {ai_response.status_code}"
    except requests.exceptions.ConnectTimeout:
        print(f"DEBUG: Lỗi timeout khi kết nối tới {rag_url} sau {timeout_seconds} giây")
        bot_response = "Lỗi kết nối đến AI service: Timeout khi kết nối"
    except requests.exceptions.ConnectionError as e:
        print(f"DEBUG: Lỗi kết nối đến {rag_url}: {str(e)}")
        bot_response = f"Lỗi kết nối đến AI service: Không thể kết nối đến API"
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DEBUG: Lỗi không xác định: {str(e)}")
        bot_response = f"Lỗi kết nối đến AI service: {str(e)}"
    
    # Lưu câu trả lời vào DB
    bot_message_id = save_message(conversation_id, "bot", bot_response)
    
    # Trả về kết quả cho frontend
    return jsonify({
        "conversationId": str(conversation_id),
        "botResponse": bot_response,
        "userMessageId": str(user_message_id),
        "botMessageId": str(bot_message_id)
    })

@chat.route('/messages/<conversation_id>', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    """
    Lấy tin nhắn của một cuộc hội thoại
    """
    try:
        messages = get_conversation_messages(conversation_id)
        return jsonify({"messages": messages})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@chat.route('/history', methods=['GET'])
@token_required
def get_chat_history(current_user):
    """
    Lấy lịch sử hội thoại của người dùng
    """
    try:
        # Lấy số lượng hội thoại tối đa từ query param, mặc định là 10
        limit = request.args.get('limit', 10, type=int)
        
        # Debug để kiểm tra user_id
        print(f"get_chat_history: user_id = {current_user['_id']}")
        
        # Lấy danh sách hội thoại của người dùng
        conversations = get_user_conversations(current_user['_id'], limit)
        
        # Kiểm tra và đảm bảo JSON serializable
        for conv in conversations:
            # Kiểm tra từng trường trong conversation
            for key, value in list(conv.items()):
                # Kiểm tra nếu trường nào không phải kiểu primitive
                if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                    print(f"Converting non-serializable field: {key}, type: {type(value)}")
                    conv[key] = str(value)
            
            # Kiểm tra các array/list trong conversation
            for key, value in list(conv.items()):
                if isinstance(value, list):
                    # Chuyển đổi phần tử không serializable trong list
                    for i, item in enumerate(value):
                        if not isinstance(item, (str, int, float, bool, type(None), list, dict)):
                            value[i] = str(item)
        
        # Kiểm tra kết quả trước khi trả về
        print(f"Returning {len(conversations)} conversations")
        
        return jsonify({"conversations": conversations})
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

@chat.route('/conversations/<conversation_id>', methods=['GET'])
@token_required
def get_conversation_detail(current_user, conversation_id):
    """
    Lấy chi tiết một cuộc hội thoại và tin nhắn
    """
    try:
        # Lấy số lượng tin nhắn tối đa từ query param, mặc định là 50
        limit = request.args.get('limit', 50, type=int)
        
        # Lấy tin nhắn của cuộc hội thoại
        messages = get_conversation_messages(conversation_id, limit)
        
        return jsonify({
            "conversation_id": conversation_id,
            "messages": messages
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@chat.route('/conversations/<conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation_route(current_user, conversation_id):
    """
    Xóa một cuộc hội thoại và tất cả tin nhắn của nó
    """
    try:
        # Kiểm tra người dùng có quyền xóa hội thoại này không
        from mongoDB.config import conversations_collection
        conversation = conversations_collection.find_one({
            "_id": ObjectId(conversation_id),
            "participants": current_user['_id']
        })
        
        if not conversation:
            return jsonify({"error": "Không tìm thấy hội thoại hoặc bạn không có quyền xóa"}), 404
        
        # Xóa hội thoại và tin nhắn
        success = delete_conversation(conversation_id)
        
        if success:
            return jsonify({"message": "Đã xóa hội thoại thành công"})
        else:
            return jsonify({"error": "Không thể xóa hội thoại"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@chat.route('/conversations', methods=['POST'])
@token_required
def create_new_conversation(current_user):
    """
    Tạo cuộc hội thoại mới
    """
    try:
        user_id = current_user['_id']
        data = request.get_json()
        title = data.get('title', f'Hội thoại mới ({datetime.datetime.now().strftime("%d/%m/%Y %H:%M")})')
        
        print(f"Creating new conversation for user: {user_id}, title: {title}")
        
        # Tạo hội thoại mới
        conversation_id = create_conversation([user_id], title)
        
        # Chuyển conversation_id thành string để trả về JSON
        conversation_id_str = str(conversation_id)
        print(f"Created conversation with ID: {conversation_id_str}")
        
        return jsonify({
            "message": "Đã tạo hội thoại mới",
            "conversation_id": conversation_id_str
        }), 201
    except Exception as e:
        print(f"Error creating conversation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400 