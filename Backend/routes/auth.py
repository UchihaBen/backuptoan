from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request, get_jwt
import os
import secrets
from services.user_service import create_user, get_user_by_username, get_user_by_email, update_user, get_user_by_id

auth = Blueprint('auth', __name__)

# Secret key for JWT, should be set in environment variables
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_jwt_secret_key')
JWT_EXPIRATION = 24 * 60 * 60  # 24 hours

@auth.route('/register', methods=['POST'])
def register():
    """API to register a new user"""
    data = request.get_json()
    
    # Check input data
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    try:
        # Create new user
        user_id = create_user({
            "username": data['username'],
            "email": data['email'],
            "password": generate_password_hash(data['password']),
            "role": "user",
            "created_at": datetime.datetime.utcnow()
        })
        
        return jsonify({
            "message": "Registration successful",
            "user_id": str(user_id)
        }), 201
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth.route('/login', methods=['POST'])
def login():
    """API for login"""
    data = request.get_json()
    
    # Check input data
    if not data.get('username') or not data.get('password'):
        return jsonify({"error": "Username and password are required"}), 400
    
    # Find user by username
    user = get_user_by_username(data['username'])
    
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Verify password
    if not check_password_hash(user['password'], data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Update last login time
    update_user(user['_id'], {"last_login": datetime.datetime.utcnow()})
    
    # Create JWT token using flask_jwt_extended
    user_id_str = str(user['_id'])  # Ensure user_id is a string
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
    """API to request password reset"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({"error": "Email is required"}), 400
    
    # Find user by email
    user = get_user_by_email(data['email'])
    
    if not user:
        return jsonify({"error": "No account found with this email"}), 404
    
    # Create password reset token
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    
    # Update token information for the user
    update_user(user['_id'], {
        "resetPasswordToken": reset_token,
        "resetPasswordExpires": reset_expires
    })
    
    # In a real application, send email with the reset link
    # Example: send_reset_email(user['email'], reset_token)
    
    return jsonify({
        "message": "Password reset email sent",
        "token": reset_token  # Just for testing, don't return token in production
    })

@auth.route('/reset-password', methods=['POST'])
def reset_password():
    """API to reset password with token"""
    data = request.get_json()
    
    if not data.get('token') or not data.get('password'):
        return jsonify({"error": "Token and new password are required"}), 400
    
    try:
        # Find user with the token and check token expiration
        user = get_user_by_reset_token(data['token'])
        
        if not user or user['resetPasswordExpires'] < datetime.datetime.utcnow():
            return jsonify({"error": "Token has expired or is invalid"}), 400
        
        # Update password
        update_user(user['_id'], {
            "password": generate_password_hash(data['password']),
            "resetPasswordToken": None,
            "resetPasswordExpires": None
        })
        
        return jsonify({"message": "Password reset successful"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def get_user_by_reset_token(token):
    """Find user by password reset token"""
    from mongoDB.config import users_collection
    
    user = users_collection.find_one({"resetPasswordToken": token})
    if user:
        user['_id'] = str(user['_id'])
    return user

@auth.route('/me', methods=['GET'])
def verify_token():
    """API to verify JWT token and return user information"""
    try:
        # Verify JWT token
        verify_jwt_in_request()
        
        # Get information from token
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        print(f"Verifying token for user_id: {user_id}")
        print(f"Claims: {claims}")
        
        # Get detailed information from database
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User information not found"}), 404
        
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
        return jsonify({"error": "Token is invalid or has expired"}), 401 