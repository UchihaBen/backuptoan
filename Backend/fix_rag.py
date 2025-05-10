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

def test_rag_original():
    """Kiểm tra phương thức RAG hiện tại"""
    logger.info("===== KIỂM TRA RAG BAN ĐẦU =====")
    
    question = "Hàm đồng biến là gì?"
    logger.info(f"Câu hỏi: '{question}'")
    
    query_embedding = sentence_transformer.encode([question]).tolist()
    
    # Phương thức hiện tại - search_similar_chunks
    results = collection.query(query_embeddings=query_embedding, n_results=3)
    
    logger.info(f"Số lượng kết quả: {len(results['documents'][0]) if results['documents'] else 0}")
    
    return results

def test_rag_improved():
    """Kiểm tra phương thức RAG cải tiến"""
    logger.info("\n===== KIỂM TRA RAG CẢI TIẾN =====")
    
    question = "Hàm đồng biến là gì?"
    logger.info(f"Câu hỏi: '{question}'")
    
    query_embedding = sentence_transformer.encode([question]).tolist()
    
    # Đếm tổng số chunks trong database
    collection_info = collection.get(include=["metadatas"])
    total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
    logger.info(f"Tổng số chunks trong database: {total_chunks}")
    
    # Phương thức cải tiến - tăng n_results
    search_top_k = min(total_chunks, 10)  # Tìm tối đa 10 kết quả hoặc tất cả chunks nếu ít hơn 10
    
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=search_top_k
    )
    
    logger.info(f"Số lượng kết quả (cải tiến): {len(results['documents'][0]) if results['documents'] else 0}")
    
    return results

def compare_results(original, improved):
    """So sánh kết quả giữa phương thức cũ và mới"""
    logger.info("\n===== SO SÁNH KẾT QUẢ =====")
    
    # Số lượng kết quả
    original_count = len(original['documents'][0]) if original['documents'] else 0
    improved_count = len(improved['documents'][0]) if improved['documents'] else 0
    
    logger.info(f"Số lượng kết quả ban đầu: {original_count}")
    logger.info(f"Số lượng kết quả cải tiến: {improved_count}")
    
    # In ra các kết quả ban đầu
    if original_count > 0:
        logger.info("\nKết quả ban đầu:")
        for i, (doc, metadata, score) in enumerate(zip(
            original['documents'][0],
            original['metadatas'][0],
            original['distances'][0]
        )):
            logger.info(f"Kết quả #{i+1}: Score={score:.4f}")
            logger.info(f"  Metadata: {metadata}")
            logger.info(f"  Nội dung: {doc[:100]}...")
    
    # In ra các kết quả cải tiến mới
    if improved_count > 0:
        logger.info("\nKết quả cải tiến:")
        for i, (doc, metadata, score) in enumerate(zip(
            improved['documents'][0],
            improved['metadatas'][0],
            improved['distances'][0]
        )):
            logger.info(f"Kết quả #{i+1}: Score={score:.4f}")
            logger.info(f"  Metadata: {metadata}")
            logger.info(f"  Nội dung: {doc[:100]}...")

def update_rag_file():
    """Hướng dẫn cập nhật file Rag.py"""
    logger.info("\n===== HƯỚNG DẪN CẬP NHẬT FILE RAG.PY =====")
    
    logger.info("""
    Để sửa chữa vấn đề trong file Rag.py, cần thực hiện các thay đổi sau:
    
    1. Cập nhật hàm search_similar_chunks để kiểm tra tổng số chunks
    2. Tăng n_results để có thể lấy nhiều kết quả hơn
    
    Đoạn mã cần sửa:
    
    ```python
    def search_similar_chunks(question, top_k=3):
        query_embedding = sentence_ef.encode([question]).tolist()
        
        # NEW: Kiểm tra số lượng chunks có sẵn
        collection_info = collection.get(include=["metadatas"])
        total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
        search_top_k = min(top_k, total_chunks)
        
        # Đảm bảo search_top_k ít nhất là 1 nếu có chunks
        if total_chunks > 0 and search_top_k < 1:
            search_top_k = 1
        
        results = collection.query(query_embeddings=query_embedding, n_results=search_top_k)
    
        return [
            {'page': metadata['page'], 'content': doc, 'score': score}
            for doc, metadata, score in zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
        ] if results["documents"] else []
    ```
    
    Thay đổi này sẽ đảm bảo:
    1. Luôn kiểm tra số lượng chunks thực tế trong database
    2. Không yêu cầu nhiều kết quả hơn số chunks có sẵn
    3. Tránh lỗi khi truy vấn với số lượng quá lớn
    
    Nếu bạn muốn truy xuất nhiều hơn 3 kết quả mặc định, có thể tăng giá trị top_k trong các lời gọi hàm search_similar_chunks.
    """)

if __name__ == "__main__":
    logger.info("Bắt đầu kiểm tra và cải tiến phương thức RAG")
    
    # Kiểm tra phương thức ban đầu
    original_results = test_rag_original()
    
    # Kiểm tra phương thức cải tiến
    improved_results = test_rag_improved()
    
    # So sánh kết quả
    compare_results(original_results, improved_results)
    
    # Hướng dẫn cập nhật
    update_rag_file()
    
    logger.info("\nHoàn tất kiểm tra! Vui lòng cập nhật file Rag.py theo hướng dẫn") 