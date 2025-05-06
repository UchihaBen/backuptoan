import os
import chromadb
from sentence_transformers import SentenceTransformer
from mongoDB.config import chunks_collection
from bson import ObjectId
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Đường dẫn và cấu hình
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")
MODEL_NAME = "intfloat/multilingual-e5-large"

# Khởi tạo model và ChromaDB
sentence_transformer = SentenceTransformer(MODEL_NAME)
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")

def embed_document_chunks(document_id):
    """
    Tạo embedding cho tất cả các chunk của một tài liệu và lưu vào ChromaDB
    
    Args:
        document_id: ID của tài liệu cần tạo embedding
    
    Returns:
        dict: Kết quả quá trình tạo embedding
    """
    try:
        # Chuyển document_id sang đúng định dạng
        if isinstance(document_id, str) and ObjectId.is_valid(document_id):
            doc_id = ObjectId(document_id)
        else:
            doc_id = document_id
            
        # Lấy tất cả các chunk của tài liệu từ MongoDB
        document_chunks = list(chunks_collection.find({"document_id": str(doc_id)}))
        
        if not document_chunks:
            return {"success": False, "message": "Không tìm thấy chunk nào cho tài liệu này", "chunks_count": 0}
            
        # Chuẩn bị dữ liệu để nhúng và lưu vào ChromaDB
        documents = []
        metadatas = []
        ids = []
        
        for chunk in document_chunks:
            # Lấy nội dung của chunk
            chunk_content = chunk.get("content", "")
            if not chunk_content:
                continue
                
            # Thêm vào danh sách để nhúng
            documents.append(chunk_content)
            
            # Chuẩn bị metadata
            metadata = {
                "document_id": str(doc_id),
                "chunk_id": str(chunk.get("_id")),
                "chunk_index": chunk.get("index"),
                "title": chunk.get("title", ""),
                "word_count": chunk.get("word_count", 0),
                "page": chunk.get("index", 0)  # Thêm trường page để tương thích với API_Rag.py
            }
            metadatas.append(metadata)
            
            # Tạo ID duy nhất cho mỗi chunk trong ChromaDB
            chunk_id = f"doc_{doc_id}_chunk_{chunk.get('index')}"
            ids.append(chunk_id)
        
        # Nếu không có nội dung để nhúng
        if not documents:
            return {"success": False, "message": "Không có nội dung nào để nhúng", "chunks_count": 0}
            
        # Tạo embedding cho tất cả các nội dung
        logger.info(f"Đang tạo embedding cho {len(documents)} chunk của tài liệu {doc_id}")
        embeddings = sentence_transformer.encode(documents).tolist()
        
        # Lưu vào ChromaDB
        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        # Cập nhật trạng thái đã nhúng trong MongoDB
        chunks_collection.update_many(
            {"document_id": str(doc_id)},
            {"$set": {"embedding_status": "completed"}}
        )
        
        return {
            "success": True, 
            "message": f"Đã tạo embedding cho {len(documents)} chunk", 
            "chunks_count": len(documents)
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi tạo embedding: {str(e)}")
        return {"success": False, "message": f"Lỗi khi tạo embedding: {str(e)}", "chunks_count": 0}

def delete_document_embeddings(document_id):
    """
    Xóa các embedding của tài liệu khỏi ChromaDB
    
    Args:
        document_id: ID của tài liệu cần xóa embedding
    
    Returns:
        dict: Kết quả quá trình xóa
    """
    try:
        # Tìm kiếm các chunk có metadata.document_id khớp với document_id
        results = collection.get(
            where={"document_id": str(document_id)},
            include=["metadatas", "documents", "embeddings"]
        )
        
        # Nếu không tìm thấy
        if not results or len(results["ids"]) == 0:
            return {"success": True, "message": "Không tìm thấy embedding nào cho tài liệu này", "deleted_count": 0}
            
        # Xóa các embedding từ ChromaDB
        collection.delete(
            ids=results["ids"]
        )
        
        return {
            "success": True,
            "message": f"Đã xóa {len(results['ids'])} embedding của tài liệu",
            "deleted_count": len(results["ids"])
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi xóa embedding: {str(e)}")
        return {"success": False, "message": f"Lỗi khi xóa embedding: {str(e)}", "deleted_count": 0}

def get_embedding_status(document_id):
    """
    Kiểm tra trạng thái embedding của các chunk trong tài liệu
    
    Args:
        document_id: ID của tài liệu cần kiểm tra
    
    Returns:
        dict: Thông tin về trạng thái embedding
    """
    try:
        # Đếm số lượng chunk đã được embedding trong ChromaDB
        results = collection.get(
            where={"document_id": str(document_id)},
            include=["metadatas"]
        )
        
        # Đếm số lượng chunk trong MongoDB
        total_chunks = chunks_collection.count_documents({"document_id": str(document_id)})
        
        embedded_chunks = len(results["ids"]) if results and "ids" in results else 0
        
        return {
            "success": True,
            "total_chunks": total_chunks,
            "embedded_chunks": embedded_chunks,
            "is_fully_embedded": embedded_chunks == total_chunks and total_chunks > 0
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi kiểm tra trạng thái embedding: {str(e)}")
        return {
            "success": False,
            "message": f"Lỗi khi kiểm tra trạng thái embedding: {str(e)}",
            "is_fully_embedded": False
        } 