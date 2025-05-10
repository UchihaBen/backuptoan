import os
import chromadb
from sentence_transformers import SentenceTransformer
import logging
from mongoDB.config import chunks_collection
from bson import ObjectId

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

def diagnose_chromadb():
    """Kiểm tra và hiển thị thông tin về ChromaDB"""
    logger.info("===== CHẨN ĐOÁN CHROMADB =====")
    
    # Kiểm tra collection có tồn tại
    collections = chroma_client.list_collections()
    logger.info(f"Số lượng collection: {len(collections)}")
    for coll in collections:
        logger.info(f"Collection name: {coll.name}")
    
    # Kiểm tra số lượng documents trong collection
    try:
        collection_info = collection.get(include=["metadatas"])
        total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
        logger.info(f"Tổng số chunks trong collection 'my_collection': {total_chunks}")
        
        if total_chunks > 0:
            # Kiểm tra document_ids có trong metadata
            document_ids = set()
            for metadata in collection_info["metadatas"]:
                if "document_id" in metadata:
                    document_ids.add(metadata["document_id"])
            
            logger.info(f"Số lượng document_id khác nhau: {len(document_ids)}")
            logger.info(f"Danh sách document_id: {document_ids}")
            
            # Kiểm tra query có hoạt động
            logger.info("Thử nghiệm truy vấn đơn giản không lọc...")
            results = collection.query(
                query_embeddings=sentence_transformer.encode(["hàm đồng biến"]).tolist(),
                n_results=5
            )
            logger.info(f"Số lượng kết quả (không lọc): {len(results['documents'][0]) if results['documents'] else 0}")
            
            # Thử truy vấn với where
            if document_ids:
                test_doc_id = list(document_ids)[0]
                logger.info(f"Thử nghiệm truy vấn với document_id={test_doc_id}...")
                
                try:
                    results_where = collection.query(
                        query_embeddings=sentence_transformer.encode(["hàm đồng biến"]).tolist(),
                        where={"document_id": test_doc_id},
                        n_results=5
                    )
                    logger.info(f"Số lượng kết quả (có lọc): {len(results_where['documents'][0]) if results_where['documents'] else 0}")
                except Exception as e:
                    logger.error(f"Lỗi khi truy vấn với where: {str(e)}")
                    logger.info("Thử kiểm tra cấu trúc metadata...")
                    if collection_info["metadatas"]:
                        logger.info(f"Metadata của một số documents đầu tiên:")
                        for i, metadata in enumerate(collection_info["metadatas"][:5]):
                            logger.info(f"  Document {i}: {metadata}")
                    
    except Exception as e:
        logger.error(f"Lỗi khi kiểm tra collection: {str(e)}")

def check_rag_pipeline():
    """Kiểm tra quá trình RAG với câu hỏi về hàm đồng biến"""
    logger.info("\n===== KIỂM TRA RAG PIPELINE =====")
    
    # Tạo embedding và tìm kiếm
    question = "Hàm đồng biến là gì?"
    logger.info(f"Câu hỏi: '{question}'")
    
    query_embedding = sentence_transformer.encode([question]).tolist()
    logger.info(f"Đã tạo query embedding với kích thước: {len(query_embedding[0])}")
    
    # Tìm kiếm không lọc
    try:
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=5
        )
        
        if results["documents"] and len(results["documents"][0]) > 0:
            logger.info(f"Tìm thấy {len(results['documents'][0])} kết quả")
            for i, (doc, metadata, score) in enumerate(zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )):
                logger.info(f"Kết quả #{i+1}: Score={score:.4f}")
                logger.info(f"  Metadata: {metadata}")
                logger.info(f"  Nội dung: {doc[:100]}...")
        else:
            logger.warning("Không tìm thấy kết quả nào")
    except Exception as e:
        logger.error(f"Lỗi khi tìm kiếm: {str(e)}")

def fix_embeddings():
    """Cố gắng sửa chữa vấn đề với embeddings"""
    logger.info("\n===== FIX EMBEDDINGS =====")
    
    # Kiểm tra dữ liệu trong MongoDB
    try:
        # Đếm số lượng chunks trong MongoDB
        total_chunks = chunks_collection.count_documents({})
        logger.info(f"Tổng số chunks trong MongoDB: {total_chunks}")
        
        # Đếm số lượng chunks theo document_id
        pipeline = [
            {"$group": {"_id": "$document_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        doc_counts = list(chunks_collection.aggregate(pipeline))
        
        if doc_counts:
            logger.info("Số lượng chunks theo document_id:")
            for doc in doc_counts:
                logger.info(f"  Document ID {doc['_id']}: {doc['count']} chunks")
            
            # Chọn document để tái tạo embedding
            target_doc_id = doc_counts[0]["_id"]
            logger.info(f"Chọn document_id={target_doc_id} để tái tạo embedding")
            
            # Xóa embedding cũ nếu có
            try:
                existing_results = collection.get(
                    where={"document_id": target_doc_id},
                    include=["metadatas"]
                )
                
                if existing_results and len(existing_results["ids"]) > 0:
                    logger.info(f"Tìm thấy {len(existing_results['ids'])} embedding cũ, tiến hành xóa")
                    collection.delete(ids=existing_results["ids"])
                    logger.info(f"Đã xóa {len(existing_results['ids'])} embedding cũ")
            except Exception as delete_error:
                logger.error(f"Lỗi khi xóa embedding cũ: {str(delete_error)}")
            
            # Tìm chunks của document
            document_chunks = list(chunks_collection.find({"document_id": target_doc_id}))
            logger.info(f"Tìm thấy {len(document_chunks)} chunks cho document_id={target_doc_id}")
            
            if document_chunks:
                # Chuẩn bị dữ liệu để nhúng
                documents = []
                metadatas = []
                ids = []
                
                for chunk in document_chunks:
                    chunk_content = chunk.get("content", "")
                    if not chunk_content:
                        continue
                    
                    documents.append(chunk_content)
                    
                    # Chuẩn bị metadata - đảm bảo document_id là string
                    metadata = {
                        "document_id": str(target_doc_id),
                        "chunk_id": str(chunk.get("_id")),
                        "chunk_index": chunk.get("index"),
                        "title": chunk.get("title", ""),
                        "word_count": chunk.get("word_count", 0),
                        "page": chunk.get("index", 0)
                    }
                    metadatas.append(metadata)
                    
                    # Tạo ID duy nhất cho mỗi chunk
                    chunk_id = f"doc_{target_doc_id}_chunk_{chunk.get('index')}"
                    ids.append(chunk_id)
                
                if documents:
                    # Tạo embedding
                    embeddings = sentence_transformer.encode(documents).tolist()
                    logger.info(f"Đã tạo {len(embeddings)} embeddings")
                    
                    # Lưu vào ChromaDB
                    collection.add(
                        documents=documents,
                        embeddings=embeddings,
                        metadatas=metadatas,
                        ids=ids
                    )
                    logger.info(f"Đã lưu {len(documents)} embeddings vào ChromaDB")
                    
                    # Kiểm tra lại
                    try:
                        check_result = collection.get(
                            where={"document_id": str(target_doc_id)},
                            include=["metadatas"]
                        )
                        
                        saved_count = len(check_result["ids"]) if check_result and "ids" in check_result else 0
                        logger.info(f"Kiểm tra lại: Đã lưu {saved_count}/{len(documents)} chunk trong ChromaDB")
                    except Exception as check_error:
                        logger.error(f"Lỗi khi kiểm tra kết quả: {str(check_error)}")
        else:
            logger.warning("Không tìm thấy document nào trong MongoDB")
    except Exception as e:
        logger.error(f"Lỗi khi kiểm tra MongoDB: {str(e)}")

if __name__ == "__main__":
    logger.info("Bắt đầu quy trình kiểm tra và sửa chữa ChromaDB")
    
    # Chẩn đoán tình trạng
    diagnose_chromadb()
    
    # Kiểm tra RAG pipeline
    check_rag_pipeline()
    
    # Thử sửa embeddings
    fix_embeddings()
    
    logger.info("\nQuy trình hoàn tất! Vui lòng kiểm tra logs để biết thêm chi tiết.") 