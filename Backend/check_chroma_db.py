import os
import chromadb
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Đường dẫn và cấu hình
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")

# Khởi tạo ChromaDB client
logger.info(f"Kết nối đến ChromaDB tại đường dẫn: {DB_PATH}")
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")

# Lấy thông tin tổng quát
collection_info = collection.get(include=["metadatas", "documents"])
total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
logger.info(f"Tổng số chunks trong ChromaDB: {total_chunks}")

# Hiển thị thông tin chi tiết về các document (nếu có)
if total_chunks > 0:
    logger.info("Danh sách tất cả các document:")
    document_ids = {}
    
    for i, metadata in enumerate(collection_info["metadatas"]):
        doc_id = metadata.get("document_id", "unknown")
        
        # Nhóm theo document_id
        if doc_id not in document_ids:
            document_ids[doc_id] = []
        
        document_ids[doc_id].append({
            "chunk_id": collection_info["ids"][i],
            "metadata": metadata,
            "content_preview": collection_info["documents"][i][:100] + "..." if collection_info["documents"][i] else ""
        })
    
    # Hiển thị số lượng chunk theo từng document_id
    for doc_id, chunks in document_ids.items():
        logger.info(f"Document ID: {doc_id} - Số lượng chunks: {len(chunks)}")
        
        # Hiển thị chi tiết về 3 chunk đầu tiên
        for i, chunk in enumerate(chunks[:3]):
            logger.info(f"  Chunk {i+1}/{len(chunks)}: ID={chunk['chunk_id']}")
            logger.info(f"    Metadata: {chunk['metadata']}")
            logger.info(f"    Nội dung: {chunk['content_preview']}")
        
        if len(chunks) > 3:
            logger.info(f"  ... và {len(chunks) - 3} chunk khác")
else:
    logger.info("Không có dữ liệu nào trong ChromaDB")

# Kiểm tra các collection khác (nếu có)
collections = chroma_client.list_collections()
if len(collections) > 1:
    logger.info(f"Tìm thấy {len(collections)} collection trong ChromaDB:")
    for coll in collections:
        count = chroma_client.get_collection(coll.name).count()
        logger.info(f"  - Collection '{coll.name}': {count} documents") 