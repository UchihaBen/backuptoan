from bson import ObjectId
from mongoDB.config import users_collection

def create_user(user_data):
    """
    Create a new user
    
    Args:
        user_data (dict): User data
        
    Returns:
        ObjectId: ID of the newly created user
        
    Raises:
        ValueError: If username or email already exists
    """
    # Check if username already exists
    if users_collection.find_one({"username": user_data['username']}):
        raise ValueError("Username already exists")
    
    # Check if email already exists
    if users_collection.find_one({"email": user_data['email']}):
        raise ValueError("Email already exists")
    
    # Add user to database
    result = users_collection.insert_one(user_data)
    return result.inserted_id

def get_user_by_id(user_id):
    """
    Get user information by ID
    
    Args:
        user_id (str): User ID
        
    Returns:
        dict: User information (excluding password)
    """
    # Convert user_id to ObjectId if it's a string
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Find user
    user = users_collection.find_one({"_id": user_id})
    
    if user:
        # Convert ObjectId to string for JSON serialization
        user['_id'] = str(user['_id'])
        # Remove password
        if 'password' in user:
            del user['password']
    
    return user

def get_user_by_username(username):
    """
    Get user information by username
    
    Args:
        username (str): Username
        
    Returns:
        dict: User information (including password for authentication)
    """
    user = users_collection.find_one({"username": username})
    
    if user:
        # Convert ObjectId to string for JSON serialization
        user['_id'] = str(user['_id'])
    
    return user

def get_user_by_email(email):
    """
    Get user information by email
    
    Args:
        email (str): User email
        
    Returns:
        dict: User information (including password for authentication)
    """
    user = users_collection.find_one({"email": email})
    
    if user:
        # Convert ObjectId to string for JSON serialization
        user['_id'] = str(user['_id'])
    
    return user

def update_user(user_id, update_data):
    """
    Update user information
    
    Args:
        user_id (str): User ID
        update_data (dict): Data to update
        
    Returns:
        bool: True if update is successful
        
    Raises:
        ValueError: If updating to a username or email that already exists
    """
    # Convert user_id to ObjectId if it's a string
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Check if updating username
    if 'username' in update_data:
        existing = users_collection.find_one({"username": update_data['username'], "_id": {"$ne": user_id}})
        if existing:
            raise ValueError("Username already exists")
    
    # Check if updating email
    if 'email' in update_data:
        existing = users_collection.find_one({"email": update_data['email'], "_id": {"$ne": user_id}})
        if existing:
            raise ValueError("Email already exists")
    
    # Update user information
    result = users_collection.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    return result.modified_count > 0 