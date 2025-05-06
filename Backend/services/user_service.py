from bson import ObjectId
from mongoDB.config import users_collection

def create_user(user_data):
    """
    Tạo người dùng mới
    
    Args:
        user_data (dict): Dữ liệu người dùng
        
    Returns:
        ObjectId: ID của người dùng vừa tạo
        
    Raises:
        ValueError: Nếu username hoặc email đã tồn tại
    """
    # Kiểm tra username đã tồn tại chưa
    if users_collection.find_one({"username": user_data['username']}):
        raise ValueError("Tên đăng nhập đã tồn tại")
    
    # Kiểm tra email đã tồn tại chưa
    if users_collection.find_one({"email": user_data['email']}):
        raise ValueError("Email đã tồn tại")
    
    # Thêm người dùng vào database
    result = users_collection.insert_one(user_data)
    return result.inserted_id

def get_user_by_id(user_id):
    """
    Lấy thông tin người dùng theo ID
    
    Args:
        user_id (str): ID người dùng
        
    Returns:
        dict: Thông tin người dùng (không bao gồm mật khẩu)
    """
    # Chuyển đổi user_id thành ObjectId nếu là string
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Tìm người dùng
    user = users_collection.find_one({"_id": user_id})
    
    if user:
        # Chuyển ObjectId sang string để serialization JSON
        user['_id'] = str(user['_id'])
        # Loại bỏ mật khẩu
        if 'password' in user:
            del user['password']
    
    return user

def get_user_by_username(username):
    """
    Lấy thông tin người dùng theo username
    
    Args:
        username (str): Tên đăng nhập
        
    Returns:
        dict: Thông tin người dùng (bao gồm mật khẩu để xác thực)
    """
    user = users_collection.find_one({"username": username})
    
    if user:
        # Chuyển ObjectId sang string để serialization JSON
        user['_id'] = str(user['_id'])
    
    return user

def get_user_by_email(email):
    """
    Lấy thông tin người dùng theo email
    
    Args:
        email (str): Email người dùng
        
    Returns:
        dict: Thông tin người dùng (bao gồm mật khẩu để xác thực)
    """
    user = users_collection.find_one({"email": email})
    
    if user:
        # Chuyển ObjectId sang string để serialization JSON
        user['_id'] = str(user['_id'])
    
    return user

def update_user(user_id, update_data):
    """
    Cập nhật thông tin người dùng
    
    Args:
        user_id (str): ID người dùng
        update_data (dict): Dữ liệu cần cập nhật
        
    Returns:
        bool: True nếu cập nhật thành công
        
    Raises:
        ValueError: Nếu cập nhật username hoặc email đã tồn tại
    """
    # Chuyển đổi user_id thành ObjectId nếu là string
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Kiểm tra nếu cập nhật username
    if 'username' in update_data:
        existing = users_collection.find_one({"username": update_data['username'], "_id": {"$ne": user_id}})
        if existing:
            raise ValueError("Tên đăng nhập đã tồn tại")
    
    # Kiểm tra nếu cập nhật email
    if 'email' in update_data:
        existing = users_collection.find_one({"email": update_data['email'], "_id": {"$ne": user_id}})
        if existing:
            raise ValueError("Email đã tồn tại")
    
    # Cập nhật thông tin người dùng
    result = users_collection.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    return result.modified_count > 0 