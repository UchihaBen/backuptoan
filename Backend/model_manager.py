import os
import logging
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Đường dẫn
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAME = "intfloat/multilingual-e5-base"
MODEL_CACHE_DIR = os.path.join(BASE_DIR, "model_cache")

def get_model():
    """
    Tải và trả về model SentenceTransformer
    - Kiểm tra nếu model đã được lưu trong bộ nhớ
    - Nếu chưa, tải model từ Hugging Face và lưu vào thư mục local
    """
    # Tạo thư mục cache nếu chưa tồn tại
    os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
    
    # Đường dẫn đến thư mục lưu model cụ thể
    model_path = os.path.join(MODEL_CACHE_DIR, MODEL_NAME.replace("/", "_"))
    
    logger.info(f"Kiểm tra model tại đường dẫn: {model_path}")
    
    # Kiểm tra xem model đã tồn tại trong bộ nhớ cache hay chưa
    if os.path.exists(model_path) and os.path.isdir(model_path):
        # Kiểm tra xem thư mục có chứa file model cần thiết không
        model_files = os.listdir(model_path)
        if 'modules.json' in model_files or 'config.json' in model_files:
            logger.info(f"Tìm thấy model trong cache, đang tải từ: {model_path}")
            try:
                # Tải model từ thư mục cache local
                model = SentenceTransformer(model_path)
                logger.info("Đã tải model từ cache thành công")
                return model
            except Exception as e:
                logger.error(f"Lỗi khi tải model từ cache: {e}")
                logger.info("Thử tải lại model từ Hugging Face...")
    
    # Nếu không tìm thấy trong cache hoặc có lỗi, tải từ Hugging Face và lưu vào cache
    logger.info(f"Đang tải model từ Hugging Face: {MODEL_NAME}")
    try:
        # Tải model từ Hugging Face và lưu vào thư mục cụ thể
        model = SentenceTransformer(MODEL_NAME)
        
        # Lưu model vào thư mục cache để sử dụng lần sau
        os.makedirs(model_path, exist_ok=True)
        model.save(model_path)
        logger.info(f"Đã tải model từ Hugging Face thành công và lưu vào: {model_path}")
        
        return model
    except Exception as e:
        logger.error(f"Lỗi khi tải model từ Hugging Face: {e}")
        raise

# Biến toàn cục để lưu trữ instance của model
_model_instance = None

def get_model_instance():
    """
    Trả về instance của model đã được khởi tạo trước đó hoặc tải model mới
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = get_model()
    return _model_instance 