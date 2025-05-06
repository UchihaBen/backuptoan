from flask import Blueprint, request, jsonify
from bson import ObjectId
from werkzeug.security import generate_password_hash
from mongoDB.config import users_collection, questions_collection
from middlewares.auth import admin_required
import datetime

admin = Blueprint('admin', __name__)

@admin.route('/users', methods=['GET'])
@admin_required
def get_users():
    """API lấy danh sách tất cả người dùng (chỉ admin)"""
    users = list(users_collection.find())
    
    # Chuyển ObjectId sang string để serialization JSON
    for user in users:
        user['_id'] = str(user['_id'])
        # Loại bỏ mật khẩu
        if 'password' in user:
            del user['password']
    
    return jsonify({
        "users": users
    }), 200

@admin.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """API xóa người dùng (chỉ admin)"""
    try:
        # Chuyển user_id thành ObjectId
        obj_id = ObjectId(user_id)
        
        # Kiểm tra người dùng có tồn tại không
        user = users_collection.find_one({"_id": obj_id})
        if not user:
            return jsonify({"error": "Người dùng không tồn tại"}), 404
        
        # Xóa người dùng
        result = users_collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 1:
            return jsonify({"message": "Xóa người dùng thành công"}), 200
        else:
            return jsonify({"error": "Không thể xóa người dùng"}), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/users/<user_id>/role', methods=['PATCH'])
@admin_required
def update_user_role(user_id):
    """API cập nhật vai trò của người dùng (chỉ admin)"""
    try:
        data = request.get_json()
        
        if 'role' not in data or data['role'] not in ['user', 'admin']:
            return jsonify({"error": "Vai trò không hợp lệ"}), 400
        
        # Chuyển user_id thành ObjectId
        obj_id = ObjectId(user_id)
        
        # Kiểm tra người dùng có tồn tại không
        user = users_collection.find_one({"_id": obj_id})
        if not user:
            return jsonify({"error": "Người dùng không tồn tại"}), 404
        
        # Cập nhật vai trò
        result = users_collection.update_one(
            {"_id": obj_id},
            {"$set": {"role": data['role']}}
        )
        
        if result.modified_count == 1:
            return jsonify({"message": "Cập nhật vai trò thành công"}), 200
        else:
            return jsonify({"error": "Không thể cập nhật vai trò"}), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/users', methods=['POST'])
@admin_required
def create_user():
    """API tạo người dùng mới (chỉ admin)"""
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} là bắt buộc"}), 400
        
        if data['role'] not in ['user', 'admin']:
            return jsonify({"error": "Vai trò không hợp lệ"}), 400
        
        # Kiểm tra username đã tồn tại chưa
        if users_collection.find_one({"username": data['username']}):
            return jsonify({"error": "Tên đăng nhập đã tồn tại"}), 400
        
        # Kiểm tra email đã tồn tại chưa
        if users_collection.find_one({"email": data['email']}):
            return jsonify({"error": "Email đã tồn tại"}), 400
        
        # Tạo người dùng mới
        new_user = {
            "username": data['username'],
            "email": data['email'],
            "password": generate_password_hash(data['password']),
            "role": data['role'],
            "created_at": datetime.datetime.utcnow()
        }
        
        result = users_collection.insert_one(new_user)
        
        return jsonify({
            "message": "Tạo người dùng thành công",
            "user_id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/questions', methods=['POST'])
@admin_required
def save_questions():
    """API lưu câu hỏi do admin tạo"""
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if 'topic' not in data or not data['topic']:
            return jsonify({"error": "Chủ đề là bắt buộc"}), 400
        
        if 'questions' not in data or not data['questions']:
            return jsonify({"error": "Danh sách câu hỏi là bắt buộc"}), 400
        
        # Lấy thông tin user từ token
        user_id = request.user_id  # Đã được set trong middleware
        
        # Chuẩn bị dữ liệu câu hỏi
        question_set = {
            "topic": data['topic'],
            "created_by": user_id,
            "created_at": datetime.datetime.utcnow(),
            "questions": data['questions']
        }
        
        # Lưu vào database
        result = questions_collection.insert_one(question_set)
        
        return jsonify({
            "message": "Lưu câu hỏi thành công",
            "question_set_id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/questions', methods=['GET'])
@admin_required
def get_question_sets():
    """API lấy danh sách bộ câu hỏi đã tạo (chỉ admin)"""
    try:
        # Lấy tất cả bộ câu hỏi, sắp xếp theo thời gian tạo giảm dần
        question_sets = list(questions_collection.find().sort("created_at", -1))
        
        # Chuyển ObjectId sang string để serialization JSON
        for question_set in question_sets:
            question_set['_id'] = str(question_set['_id'])
            question_set['created_by'] = str(question_set['created_by'])
        
        return jsonify({
            "question_sets": question_sets
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/questions/<question_set_id>', methods=['GET'])
@admin_required
def get_question_set_by_id(question_set_id):
    """API lấy chi tiết bộ câu hỏi theo ID (chỉ admin)"""
    try:
        # Chuyển question_set_id thành ObjectId
        obj_id = ObjectId(question_set_id)
        
        # Tìm bộ câu hỏi theo ID
        question_set = questions_collection.find_one({"_id": obj_id})
        
        if not question_set:
            return jsonify({"error": "Không tìm thấy bộ câu hỏi"}), 404
        
        # Chuyển ObjectId sang string để serialization JSON
        question_set['_id'] = str(question_set['_id'])
        question_set['created_by'] = str(question_set['created_by'])
        
        return jsonify({
            "question_set": question_set
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/questions/<question_set_id>', methods=['PUT'])
@admin_required
def update_question_set(question_set_id):
    """API cập nhật bộ câu hỏi đã tồn tại (chỉ admin)"""
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if 'topic' not in data or not data['topic']:
            return jsonify({"error": "Chủ đề là bắt buộc"}), 400
        
        if 'questions' not in data or not data['questions']:
            return jsonify({"error": "Danh sách câu hỏi là bắt buộc"}), 400
        
        # Chuyển question_set_id thành ObjectId
        obj_id = ObjectId(question_set_id)
        
        # Kiểm tra bộ câu hỏi có tồn tại không
        existing_question_set = questions_collection.find_one({"_id": obj_id})
        if not existing_question_set:
            return jsonify({"error": "Không tìm thấy bộ câu hỏi để cập nhật"}), 404
        
        # Cập nhật bộ câu hỏi
        result = questions_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "topic": data['topic'],
                "questions": data['questions'],
                "updated_at": datetime.datetime.utcnow()
            }}
        )
        
        if result.modified_count == 1:
            return jsonify({
                "message": "Cập nhật bộ câu hỏi thành công",
                "question_set_id": question_set_id
            }), 200
        else:
            return jsonify({"message": "Không có thay đổi nào được cập nhật"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin.route('/questions/<question_set_id>', methods=['DELETE'])
@admin_required
def delete_question_set(question_set_id):
    """API xóa bộ câu hỏi theo ID (chỉ admin)"""
    try:
        # Chuyển question_set_id thành ObjectId
        obj_id = ObjectId(question_set_id)
        
        # Kiểm tra bộ câu hỏi có tồn tại không
        existing_question_set = questions_collection.find_one({"_id": obj_id})
        if not existing_question_set:
            return jsonify({"error": "Không tìm thấy bộ câu hỏi để xóa"}), 404
        
        # Xóa bộ câu hỏi
        result = questions_collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 1:
            return jsonify({
                "message": "Xóa bộ câu hỏi thành công",
                "question_set_id": question_set_id
            }), 200
        else:
            return jsonify({"error": "Không thể xóa bộ câu hỏi"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API lấy danh sách chủ đề cho người dùng (không yêu cầu quyền admin)
@admin.route('/topics', methods=['GET'])
def get_topics_for_users():
    """API lấy danh sách chủ đề cho người dùng"""
    try:
        # Lấy tất cả bộ câu hỏi, sắp xếp theo thời gian tạo giảm dần
        question_sets = list(questions_collection.find({}, {
            "_id": 1,
            "topic": 1,
            "created_at": 1,
            "questions": {"$size": "$questions"}  # Đếm số lượng câu hỏi
        }).sort("created_at", -1))
        
        # Chuyển đổi dữ liệu
        topics = []
        for qs in question_sets:
            topics.append({
                "_id": str(qs["_id"]),
                "name": qs["topic"],
                "questionCount": qs["questions"],
                "updatedAt": qs["created_at"]
            })
        
        return jsonify({
            "question_sets": topics
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# API lấy chi tiết bộ câu hỏi theo ID cho người dùng (không yêu cầu quyền admin)
@admin.route('/topics/<question_set_id>', methods=['GET'])
def get_topic_by_id_for_users(question_set_id):
    """API lấy chi tiết bộ câu hỏi theo ID cho người dùng"""
    try:
        # Chuyển question_set_id thành ObjectId
        obj_id = ObjectId(question_set_id)
        
        # Tìm bộ câu hỏi theo ID
        question_set = questions_collection.find_one({"_id": obj_id})
        
        if not question_set:
            return jsonify({"error": "Không tìm thấy bộ câu hỏi"}), 404
        
        # Chuyển ObjectId sang string để serialization JSON
        question_set['_id'] = str(question_set['_id'])
        question_set['created_by'] = str(question_set['created_by'])
        
        return jsonify({
            "question_set": question_set
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500 