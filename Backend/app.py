from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta
from routes.chat import chat
from routes.auth import auth
from routes.admin import admin
from routes.quiz import quiz  # Import quiz blueprint
from routes.documents import documents_bp  # Import documents blueprint mới
from middleware.auth_middleware import token_required, token_required_request, admin_required, admin_required_request
# Import các routes khác khi bạn tạo thêm

app = Flask(__name__)

# Cấu hình CORS đơn giản hơn và bao quát hơn
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # Cho phép tất cả origins trong development
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"])

# Thêm cái này để đảm bảo Preflight được xử lý đúng
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# Endpoint kiểm tra
@app.route('/api/test-cors', methods=['GET', 'OPTIONS'])
def test_cors():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({"message": "CORS is working!"}), 200

# Cấu hình JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'your_jwt_secret_key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# Mang các middleware từ middlewares/auth.py (số nhiều) vào middleware/auth_middleware.py (số ít)
# Đây là để đảm bảo các routes hiện tại sử dụng middlewares/auth tiếp tục hoạt động
import sys, os
middleware_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'middlewares')
if not os.path.exists(middleware_dir):
    os.makedirs(middleware_dir)
    
# Tạo file auth.py trong thư mục middlewares nếu chưa có
auth_file = os.path.join(middleware_dir, 'auth.py')
with open(auth_file, 'w') as f:
    f.write('from middleware.auth_middleware import token_required_request as token_required\n')
    f.write('from middleware.auth_middleware import admin_required_request as admin_required\n')

# Đăng ký các route blueprint
app.register_blueprint(chat, url_prefix='/api/chat')
app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(admin, url_prefix='/api/admin')
app.register_blueprint(quiz, url_prefix='/api/quiz')  # Đăng ký quiz blueprint
app.register_blueprint(documents_bp, url_prefix='/api/documents')  # Đăng ký documents blueprint
# Đăng ký các routes khác tại đây

@app.route('/test-upload')
def test_upload():
    return render_template('test_upload.html')

@app.route('/')
def home():
    return render_template('index.html')

# Thêm endpoint để khởi tạo lại database
@app.route('/api/reinitialize-db', methods=['POST'])
def reinitialize_database():
    # Chỉ cho phép gọi từ localhost
    if request.remote_addr == '127.0.0.1' or request.remote_addr == 'localhost':
        try:
            from mongoDB.db_schema import initialize_database
            initialize_database()
            return jsonify({"message": "Database initialized successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Access denied"}), 403

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000) 