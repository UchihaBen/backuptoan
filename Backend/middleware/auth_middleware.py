from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
import os
from services.user_service import get_user_by_id

# Lấy JWT_SECRET từ biến môi trường hoặc sử dụng giá trị mặc định
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_jwt_secret_key')

def token_required(f):
    """
    Decorator để kiểm tra JWT token và truyền thông tin user vào hàm controller
    Sử dụng cho routes có tham số current_user
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Sử dụng flask_jwt_extended để xác thực token
            verify_jwt_in_request()
            
            # Lấy thông tin từ token
            user_id = get_jwt_identity()
            claims = get_jwt()
            
            # Debug
            print(f"Debug - JWT Identity: {user_id}")
            print(f"Debug - JWT Claims: {claims}")
            
            # Lấy thông tin user từ database
            current_user = get_user_by_id(user_id)
            
            if not current_user:
                return jsonify({'error': 'Không tìm thấy thông tin người dùng'}), 401
            
            # Đồng thời lưu thông tin vào request để tương thích với code cũ
            request.user_id = user_id
            request.username = claims.get('username', '')
            request.role = claims.get('role', '')
                
            return f(current_user, *args, **kwargs)
            
        except Exception as e:
            print(f"Error in token_required: {e}")
            return jsonify({'error': 'Lỗi xác thực - Vui lòng đăng nhập lại'}), 401
    
    return decorated

def token_required_request(f):
    """
    Decorator để kiểm tra JWT token và lưu thông tin vào request
    Sử dụng cho routes cũ sử dụng middlewares/auth.py
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Sử dụng flask_jwt_extended để xác thực token
            verify_jwt_in_request()
            
            # Lấy thông tin từ token
            user_id = get_jwt_identity()
            claims = get_jwt()
            
            # Debug
            print(f"Debug - JWT Identity: {user_id}")
            print(f"Debug - JWT Claims: {claims}")
            
            # Lưu thông tin vào request để sử dụng trong route handler
            request.user_id = user_id
            request.username = claims.get('username', '')
            request.role = claims.get('role', '')
            
            # Debug
            print(f"Debug - Extracted user_id: {request.user_id}")
            print(f"Debug - Extracted role: {request.role}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Error in token_required_request: {e}")
            return jsonify({"error": "Lỗi xác thực - Vui lòng đăng nhập lại"}), 401
        
    return decorated

def admin_required(f):
    """
    Decorator để kiểm tra quyền admin
    Phải sử dụng sau token_required
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Bạn không có quyền thực hiện hành động này'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required_request(f):
    """
    Decorator để kiểm tra quyền admin
    Sử dụng cho routes cũ không có tham số current_user
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get('role', '')
            
            # Kiểm tra role
            if role != 'admin':
                return jsonify({"error": "Bạn không có quyền thực hiện hành động này"}), 403
                
            # Lưu thông tin vào request để sử dụng trong controller
            request.user_id = get_jwt_identity()
            request.username = claims.get('username', '')
            request.role = role
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Error in admin_required_request: {e}")
            return jsonify({"error": "Lỗi xác thực - Vui lòng đăng nhập lại"}), 401
        
    return decorated 