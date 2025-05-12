import os
import chromadb
from sentence_transformers import SentenceTransformer
from mongoDB.config import chunks_collection
from bson import ObjectId
import logging
import time

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
            
        # Convert doc_id to string for consistent comparisons
        str_doc_id = str(doc_id)
        
        logger.info(f"Bắt đầu tạo embedding cho tài liệu {str_doc_id}")
            
        # Lấy tất cả các chunk của tài liệu từ MongoDB
        document_chunks = list(chunks_collection.find({"document_id": str_doc_id}))
        
        if not document_chunks:
            logger.warning(f"Không tìm thấy chunk nào cho tài liệu {str_doc_id}")
            return {"success": False, "message": "Không tìm thấy chunk nào cho tài liệu này", "chunks_count": 0}
            
        # Đầu tiên, xóa hết các embedding cũ của tài liệu này nếu có
        logger.info(f"Xóa các embedding cũ của tài liệu {str_doc_id} trước khi tạo mới")
        
        try:
            # Tìm các chunk có metadata.document_id khớp với document_id
            existing_results = collection.get(
                where={"document_id": str_doc_id},
                include=["metadatas", "documents", "embeddings"]
            )
            
            if existing_results and len(existing_results["ids"]) > 0:
                logger.info(f"Tìm thấy {len(existing_results['ids'])} embedding cũ, tiến hành xóa")
                # Xóa các embedding từ ChromaDB
                collection.delete(
                    ids=existing_results["ids"]
                )
                logger.info(f"Đã xóa {len(existing_results['ids'])} embedding cũ")
            else:
                logger.info(f"Không tìm thấy embedding cũ cho tài liệu {str_doc_id}")
                
        except Exception as delete_error:
            logger.error(f"Lỗi khi xóa embedding cũ: {str(delete_error)}")
            # Vẫn tiếp tục quá trình embedding mới
            
        # Chuẩn bị dữ liệu để nhúng và lưu vào ChromaDB
        documents = []
        metadatas = []
        ids = []
        
        for chunk in document_chunks:
            # Lấy nội dung của chunk
            chunk_content = chunk.get("content", "")
            if not chunk_content:
                logger.warning(f"Bỏ qua chunk trống: document_id={str_doc_id}, chunk_index={chunk.get('index')}")
                continue
                
            # Thêm vào danh sách để nhúng
            documents.append(chunk_content)
            
            # Chuẩn bị metadata
            metadata = {
                "document_id": str_doc_id,
                "chunk_id": str(chunk.get("_id")),
                "chunk_index": chunk.get("index"),
                "title": chunk.get("title", ""),
                "word_count": chunk.get("word_count", 0),
                "page": chunk.get("index", 0)  # Thêm trường page để tương thích với API_Rag.py
            }
            metadatas.append(metadata)
            
            # Tạo ID duy nhất cho mỗi chunk trong ChromaDB
            chunk_id = f"doc_{str_doc_id}_chunk_{chunk.get('index')}"
            ids.append(chunk_id)
        
        # Nếu không có nội dung để nhúng
        if not documents:
            logger.warning(f"Không có nội dung nào để nhúng cho tài liệu {str_doc_id}")
            return {"success": False, "message": "Không có nội dung nào để nhúng", "chunks_count": 0}
            
        # Tạo embedding cho tất cả các nội dung
        logger.info(f"Đang tạo embedding cho {len(documents)} chunk của tài liệu {str_doc_id}")
        embeddings = sentence_transformer.encode(documents).tolist()
        
        # Log thông tin chi tiết để debug
        logger.info(f"Số lượng documents: {len(documents)}")
        logger.info(f"Số lượng embeddings: {len(embeddings)}")
        logger.info(f"Số lượng metadatas: {len(metadatas)}")
        logger.info(f"Số lượng ids: {len(ids)}")
        
        # Lưu vào ChromaDB with retries - Thêm cơ chế retry để đảm bảo dữ liệu được lưu
        max_retries = 3
        retry_count = 0
        success = False
        
        while retry_count < max_retries and not success:
            try:
                # Lưu vào ChromaDB
                logger.info(f"Đang thêm {len(documents)} chunk vào ChromaDB (lần thử {retry_count + 1})")
                collection.add(
                    documents=documents,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                
                # Reset chromaDB client để đảm bảo dữ liệu được cập nhật từ disk
                logger.info("Tạo lại kết nối tới ChromaDB để đảm bảo dữ liệu mới nhất")
                new_client = chromadb.PersistentClient(path=DB_PATH)
                fresh_collection = new_client.get_collection(name="my_collection")
                
                # Xác minh ngay lập tức dữ liệu đã được lưu
                verification = fresh_collection.get(
                    where={"document_id": str_doc_id},
                    include=["metadatas"]
                )
                
                if verification and "ids" in verification and len(verification["ids"]) == len(documents):
                    logger.info(f"Xác minh thành công: Đã lưu {len(verification['ids'])}/{len(documents)} chunk")
                    success = True
                else:
                    logger.warning(f"Xác minh thất bại: Chỉ tìm thấy {len(verification.get('ids', []))}/{len(documents)} chunk. Thử lại...")
                    retry_count += 1
                    time.sleep(1)  # Đợi 1 giây trước khi thử lại
                
            except Exception as add_error:
                logger.error(f"Lỗi khi thêm vào ChromaDB (lần thử {retry_count + 1}): {str(add_error)}")
                retry_count += 1
                if retry_count < max_retries:
                    logger.info(f"Thử lại lần {retry_count + 1}...")
                    time.sleep(1)  # Đợi 1 giây trước khi thử lại
        
        # Đảm bảo dữ liệu được lưu
        logger.info("Commit thay đổi vào ChromaDB")
        # PersistentClient trong ChromaDB 1.0.8 tự động persist data
        # Không cần gọi persist() method nữa
        try:
            # Thử gọi persist() nếu phiên bản cũ hơn hỗ trợ
            try:
                if hasattr(chroma_client, "persist"):
                    chroma_client.persist()
                    logger.info("Đã gọi persist() thành công")
            except Exception as persist_error:
                logger.warning(f"persist() không được hỗ trợ hoặc lỗi: {str(persist_error)}")
            
            logger.info("ChromaDB tự động lưu trữ dữ liệu")
        except Exception as persist_error:
            logger.error(f"Lỗi khi commit ChromaDB: {str(persist_error)}")
            # Vẫn tiếp tục để kiểm tra kết quả
        
        # Kiểm tra lại xem đã lưu thành công chưa
        try:
            check_result = collection.get(
                where={"document_id": str_doc_id},
                include=["metadatas"]
            )
            
            saved_count = len(check_result["ids"]) if check_result and "ids" in check_result else 0
            logger.info(f"Kiểm tra lại: Đã lưu {saved_count}/{len(documents)} chunk trong ChromaDB")
            
            if saved_count < len(documents):
                logger.warning(f"Không lưu được đủ số lượng embedding! Đã lưu {saved_count}/{len(documents)}")
                if saved_count == 0:
                    return {"success": False, "message": f"Không lưu được dữ liệu vào ChromaDB sau {max_retries} lần thử", "chunks_count": 0}
            
            # Cập nhật trạng thái đã nhúng trong MongoDB sau khi đã xác minh dữ liệu có trong ChromaDB
            chunks_collection.update_many(
                {"document_id": str_doc_id},
                {"$set": {"embedding_status": "completed", "embedding_verified": True}}
            )
        except Exception as check_error:
            logger.error(f"Lỗi khi kiểm tra kết quả: {str(check_error)}")
            return {"success": False, "message": f"Lỗi khi xác minh kết quả: {str(check_error)}", "chunks_count": 0}
        
        return {
            "success": True, 
            "message": f"Đã tạo embedding cho {len(documents)} chunk", 
            "chunks_count": len(documents)
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi tạo embedding: {str(e)}")
        import traceback
        traceback.print_exc()
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
