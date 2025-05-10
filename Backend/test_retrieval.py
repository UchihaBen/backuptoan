import os
import chromadb
from sentence_transformers import SentenceTransformer
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Đường dẫn và cấu hình
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")
MODEL_NAME = "intfloat/multilingual-e5-base"

# Khởi tạo model và ChromaDB
sentence_transformer = SentenceTransformer(MODEL_NAME)
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")

def search_similar_chunks(question, top_k=5):
    """
    Tìm kiếm các chunk có nội dung tương tự với câu hỏi
    
    Args:
        question: Câu hỏi cần tìm kiếm
        top_k: Số lượng kết quả cần trả về
    
    Returns:
        list: Danh sách các chunk tương tự
    """
    logger.info(f"Đang tìm kiếm cho câu hỏi: '{question}'")
    query_embedding = sentence_transformer.encode([question]).tolist()
    
    # Kiểm tra số lượng chunks trong collection
    collection_info = collection.get(include=["metadatas"])
    total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
    logger.info(f"Tổng số chunks trong ChromaDB: {total_chunks}")
    
    if total_chunks == 0:
        logger.warning("Không có chunks nào trong ChromaDB")
        return []
    
    # Thực hiện tìm kiếm
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(top_k, total_chunks)
    )
    
    if not results["documents"] or len(results["documents"][0]) == 0:
        logger.warning("Không tìm thấy kết quả nào")
        return []
    
    # Format kết quả
    chunks_found = []
    for i, (doc, metadata, score) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    )):
        logger.info(f"Kết quả #{i+1}: Score={score:.4f}")
        logger.info(f"  Metadata: {metadata}")
        logger.info(f"  Nội dung: {doc[:100]}...")
        
        chunks_found.append({
            'metadata': metadata,
            'content': doc,
            'score': score
        })
    
    return chunks_found

# Test với các câu hỏi liên quan đến hàm đồng biến
test_questions = [
    "Thế nào là hàm đồng biến?",
    "Hàm đồng biến là gì?",
    "Hàm đồng biến trên một khoảng là gì?",
    "Điều kiện để hàm số đồng biến",
    "Công thức xác định hàm đồng biến"
]

# Thử lần lượt từng câu hỏi
for i, question in enumerate(test_questions):
    logger.info(f"\n----- Test câu hỏi #{i+1}: '{question}' -----")
    results = search_similar_chunks(question)
    logger.info(f"Tìm thấy {len(results)} kết quả cho câu hỏi: '{question}'")
    logger.info("-" * 50) 