from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request, get_jwt
import os
import secrets
from services.user_service import create_user, get_user_by_username, get_user_by_email, update_user, get_user_by_id

auth = Blueprint('auth', __name__)

# Mã bí mật cho JWT, nên đặt trong biến môi trường
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_jwt_secret_key')
JWT_EXPIRATION = 24 * 60 * 60  # 24 giờ

@auth.route('/register', methods=['POST'])
def register():
    """API đăng ký người dùng mới"""
    data = request.get_json()
    
    # Kiểm tra dữ liệu đầu vào
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} là bắt buộc"}), 400
    
    try:
        # Tạo người dùng mới
        user_id = create_user({
            "username": data['username'],
            "email": data['email'],
            "password": generate_password_hash(data['password']),
            "role": "user",
            "created_at": datetime.datetime.utcnow()
        })
        
        return jsonify({
            "message": "Đăng ký thành công",
            "user_id": str(user_id)
        }), 201
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth.route('/login', methods=['POST'])
def login():
    """API đăng nhập"""
    data = request.get_json()
    
    # Kiểm tra dữ liệu đầu vào
    if not data.get('username') or not data.get('password'):
        return jsonify({"error": "Tên đăng nhập và mật khẩu là bắt buộc"}), 400
    
    # Tìm người dùng theo tên đăng nhập
    user = get_user_by_username(data['username'])
    
    if not user:
        return jsonify({"error": "Tên đăng nhập hoặc mật khẩu không đúng"}), 401
    
    # Kiểm tra mật khẩu
    if not check_password_hash(user['password'], data['password']):
        return jsonify({"error": "Tên đăng nhập hoặc mật khẩu không đúng"}), 401
    
    # Cập nhật thời gian đăng nhập cuối
    update_user(user['_id'], {"last_login": datetime.datetime.utcnow()})
    
    # Tạo token JWT sử dụng flask_jwt_extended
    user_id_str = str(user['_id'])  # Đảm bảo user_id là chuỗi
    access_token = create_access_token(
        identity=user_id_str, 
        additional_claims={
            'username': user['username'],
            'role': user['role']
        }
    )
    
    return jsonify({
        "token": access_token,
        "user": {
            "id": str(user['_id']),
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    }), 200

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    """API yêu cầu đặt lại mật khẩu"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({"error": "Email là bắt buộc"}), 400
    
    # Tìm người dùng theo email
    user = get_user_by_email(data['email'])
    
    if not user:
        return jsonify({"error": "Không tìm thấy tài khoản với email này"}), 404
    
    # Tạo token đặt lại mật khẩu
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    
    # Cập nhật thông tin token vào người dùng
    update_user(user['_id'], {
        "resetPasswordToken": reset_token,
        "resetPasswordExpires": reset_expires
    })
    
    # Trong ứng dụng thực tế, gửi email với link đặt lại mật khẩu
    # Ví dụ: send_reset_email(user['email'], reset_token)
    
    return jsonify({
        "message": "Đã gửi email đặt lại mật khẩu",
        "token": reset_token  # Chỉ để test, không nên trả về token trong production
    })

@auth.route('/reset-password', methods=['POST'])
def reset_password():
    """API đặt lại mật khẩu với token"""
    data = request.get_json()
    
    if not data.get('token') or not data.get('password'):
        return jsonify({"error": "Token và mật khẩu mới là bắt buộc"}), 400
    
    try:
        # Tìm người dùng với token và kiểm tra hạn token
        user = get_user_by_reset_token(data['token'])
        
        if not user or user['resetPasswordExpires'] < datetime.datetime.utcnow():
            return jsonify({"error": "Token đã hết hạn hoặc không hợp lệ"}), 400
        
        # Cập nhật mật khẩu
        update_user(user['_id'], {
            "password": generate_password_hash(data['password']),
            "resetPasswordToken": None,
            "resetPasswordExpires": None
        })
        
        return jsonify({"message": "Đặt lại mật khẩu thành công"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def get_user_by_reset_token(token):
    """Tìm người dùng theo token đặt lại mật khẩu"""
    from mongoDB.config import users_collection
    
    user = users_collection.find_one({"resetPasswordToken": token})
    if user:
        user['_id'] = str(user['_id'])
    return user

@auth.route('/me', methods=['GET'])
def verify_token():
    """API kiểm tra token JWT và trả về thông tin người dùng"""
    try:
        # Kiểm tra JWT token
        verify_jwt_in_request()
        
        # Lấy thông tin từ token
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        print(f"Verifying token for user_id: {user_id}")
        print(f"Claims: {claims}")
        
        # Lấy thông tin chi tiết từ database
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "Không tìm thấy thông tin người dùng"}), 404
        
        return jsonify({
            "user": {
                "id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "role": user['role']
            },
            "token_info": {
                "identity": user_id,
                "username": claims.get('username', 'N/A'),
                "role": claims.get('role', 'N/A')
            }
        }), 200
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return jsonify({"error": "Token không hợp lệ hoặc đã hết hạn"}), 401 