from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from bson import ObjectId
import re
import uuid

# Import các collection từ MongoDB
from mongoDB.config import documents_collection, chunks_collection
import mongoDB.db_schema as db_schema
from middleware.auth_middleware import token_required_request
# Import service embedding
import embedding_service

documents_bp = Blueprint('documents', __name__)

# Thiết lập thư mục lưu file
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

def allowed_file(filename):
    """Kiểm tra phần mở rộng của file có được phép không"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/', methods=['GET'])
@token_required_request
def get_documents():
    """Lấy danh sách tất cả các tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        current_user = get_jwt_identity()
        print(f"Người dùng yêu cầu: {current_user}")
        
        # Lấy tham số phân trang từ query string
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        # Lấy danh sách tài liệu từ database
        documents = db_schema.get_all_documents(limit=limit, skip=skip)
        
        # Format lại ngày để dễ đọc
        for doc in documents:
            if 'upload_date' in doc and isinstance(doc['upload_date'], datetime):
                doc['upload_date'] = doc['upload_date'].strftime('%d/%m/%Y %H:%M')
        
        return jsonify(documents), 200
    except Exception as e:
        current_app.logger.error(f"Error getting documents: {str(e)}")
        return jsonify({"error": f"Không thể lấy danh sách tài liệu: {str(e)}"}), 500

@documents_bp.route('/<document_id>', methods=['GET'])
@token_required_request
def get_document(document_id):
    """Lấy thông tin chi tiết của một tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        current_user = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
        
        # Lấy thông tin tài liệu
        document = db_schema.get_document_by_id(doc_id)
        
        if not document:
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
        
        # Format lại ngày để dễ đọc
        if 'upload_date' in document and isinstance(document['upload_date'], datetime):
            document['upload_date'] = document['upload_date'].strftime('%d/%m/%Y %H:%M')
        
        return jsonify(document), 200
    except Exception as e:
        current_app.logger.error(f"Error getting document details: {str(e)}")
        return jsonify({"error": f"Không thể lấy thông tin tài liệu: {str(e)}"}), 500

@documents_bp.route('/<document_id>/chunks', methods=['GET'])
@token_required_request
def get_document_chunks_api(document_id):
    """Lấy danh sách các chunk của một tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        current_user = get_jwt_identity()
        
        print(f"==== DEBUG GET DOCUMENT CHUNKS ====")
        print(f"Document ID từ URL: {document_id}")
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
                print(f"Document ID hợp lệ, đã chuyển đổi thành ObjectId: {doc_id}")
            else:
                doc_id = document_id
                print(f"Document ID không phải là ObjectId hợp lệ, giữ nguyên: {doc_id}")
        except Exception as e:
            print(f"Lỗi khi chuyển đổi document_id: {str(e)}")
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
        
        # Lấy thông tin document để kiểm tra xem có tồn tại không
        document = db_schema.get_document_by_id(doc_id)
        if not document:
            print(f"Không tìm thấy document với ID: {doc_id}")
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
        
        print(f"Đã tìm thấy document: {document['title']}")
        
        # Lấy danh sách chunk
        chunks = db_schema.get_document_chunks(doc_id)
        
        if not chunks:
            print(f"Không tìm thấy chunk nào cho document ID: {doc_id}")
            return jsonify([]), 200
        
        print(f"Tìm thấy {len(chunks)} chunk cho document")
        print(f"==============================")
        
        return jsonify(chunks), 200
    except Exception as e:
        current_app.logger.error(f"Error getting document chunks: {str(e)}")
        return jsonify({"error": f"Không thể lấy danh sách chunk: {str(e)}"}), 500

@documents_bp.route('/<document_id>/chunks/<int:chunk_index>', methods=['GET'])
@token_required_request
def get_chunk_content(document_id, chunk_index):
    """Lấy nội dung của một chunk cụ thể"""
    try:
        # Lấy thông tin người dùng từ token
        current_user = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
        
        # Lấy thông tin chunk
        chunk = db_schema.get_chunk_by_document_and_index(doc_id, chunk_index)
        
        if not chunk:
            return jsonify({"error": "Không tìm thấy chunk"}), 404
        
        return jsonify(chunk), 200
    except Exception as e:
        current_app.logger.error(f"Error getting chunk content: {str(e)}")
        return jsonify({"error": f"Không thể lấy nội dung chunk: {str(e)}"}), 500

@documents_bp.route('/upload', methods=['POST'])
@token_required_request
def upload_document():
    """Upload tài liệu và chia thành các chunk"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        print(f"User uploading document: {user_id}")
        
        # Debug thông tin request
        print("Content-Type:", request.content_type)
        print("Form data:", list(request.form.keys()))
        if 'file' in request.files:
            print("File name:", request.files['file'].filename)
        else:
            print("No file found in request")
        
        # Kiểm tra xem có file được gửi lên không
        if 'file' not in request.files:
            return jsonify({"error": "Không có file nào được gửi lên"}), 400
        
        file = request.files['file']
        
        # Kiểm tra tên file
        if file.filename == '':
            return jsonify({"error": "Tên file không hợp lệ"}), 400
        
        # Kiểm tra phần mở rộng của file
        if not allowed_file(file.filename):
            return jsonify({"error": f"File không được hỗ trợ. Chỉ chấp nhận: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        # Lấy thông tin từ form
        title = request.form.get('title', 'Tài liệu không có tiêu đề')
        
        # Chuyển đổi chunkSize và chunkOverlap thành số nguyên
        try:
            chunk_size = int(request.form.get('chunkSize', 1000))
            chunk_overlap = int(request.form.get('chunkOverlap', 200))
        except ValueError:
            return jsonify({"error": "Kích thước chunk và độ chồng lấp phải là số nguyên"}), 400
        
        # Tạo tên file an toàn và lưu file
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Đọc nội dung file
        content = ""
        if file_ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif file_ext == 'pdf':
            # Sử dụng thư viện PyPDF2 hoặc pdfplumber để đọc file PDF
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:  # Kiểm tra nếu page_text là None
                            content += page_text + "\n\n"
                        else:
                            content += "\n\n"  # Thêm khoảng trống cho trang không có text
            except ImportError:
                return jsonify({"error": "Không thể xử lý file PDF. Thư viện pdfplumber chưa được cài đặt."}), 500
            except Exception as e:
                return jsonify({"error": f"Lỗi khi đọc file PDF: {str(e)}"}), 500
        elif file_ext == 'docx':
            # Sử dụng thư viện python-docx để đọc file DOCX
            try:
                import docx
                doc = docx.Document(file_path)
                content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            except ImportError:
                return jsonify({"error": "Không thể xử lý file DOCX. Thư viện python-docx chưa được cài đặt."}), 500
            except Exception as e:
                return jsonify({"error": f"Lỗi khi đọc file DOCX: {str(e)}"}), 500
        
        # Kiểm tra nếu nội dung rỗng
        if not content.strip():
            return jsonify({"error": "Không thể đọc nội dung từ file. File có thể rỗng hoặc định dạng không hỗ trợ."}), 400
        
        # Tính toán số từ
        word_count = len(re.findall(r'\w+', content))
        
        # Ước tính số token (khoảng 4/3 số từ)
        estimated_tokens = int(word_count * 1.33)
        
        # Chia nội dung thành các chunk
        chunks = split_into_chunks(content, chunk_size, chunk_overlap)
        chunks_count = len(chunks)
        
        # Kiểm tra nếu không có chunk nào
        if chunks_count == 0:
            return jsonify({"error": "Không thể chia tài liệu thành các chunk. Nội dung có thể quá ngắn."}), 400
        
        # Tính số token trung bình mỗi chunk
        avg_tokens_per_chunk = 0
        if chunks_count > 0:
            avg_tokens_per_chunk = estimated_tokens / chunks_count
        
        # Tạo document record trong database
        document = {
            "title": title,
            "created_by": user_id,
            "file_path": file_path,
            "file_type": file_ext,
            "file_size": file_size,
            "upload_date": datetime.utcnow(),
            "chunks_count": chunks_count,
            "total_tokens": estimated_tokens,
            "total_words": word_count,
            "chunk_settings": {
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "avg_tokens_per_chunk": avg_tokens_per_chunk
            }
        }
        
        document_id = documents_collection.insert_one(document).inserted_id
        
        # Lưu các chunk vào database
        for i, chunk_text in enumerate(chunks):
            # Tính số từ trong chunk
            chunk_word_count = len(re.findall(r'\w+', chunk_text))
            
            # Tạo tiêu đề cho chunk (lấy 50 ký tự đầu tiên)
            chunk_title = chunk_text[:50].strip() + "..." if len(chunk_text) > 50 else chunk_text.strip()
            
            # Ước tính số token trong chunk
            chunk_tokens = int(chunk_word_count * 1.33)
            
            chunk = {
                "document_id": str(document_id),
                "index": i,
                "title": chunk_title,
                "content": chunk_text,
                "tokens": chunk_tokens,
                "word_count": chunk_word_count,
                "embedding": None  # Sẽ được cập nhật sau nếu cần
            }
            
            chunks_collection.insert_one(chunk)
        
        return jsonify({
            "success": True,
            "document_id": str(document_id),
            "title": title,
            "chunks_count": chunks_count
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error uploading document: {str(e)}")
        return jsonify({"error": f"Không thể tải lên tài liệu: {str(e)}"}), 500

def split_into_chunks(text, chunk_size, chunk_overlap):
    """Chia văn bản thành các chunk nhỏ hơn
    
    Args:
        text: Văn bản cần chia
        chunk_size: Kích thước mỗi chunk (đơn vị token, ước tính)
        chunk_overlap: Số token chồng lấn giữa các chunk
        
    Returns:
        List các chunk văn bản
    """
    # Ước tính số từ tương ứng với số token
    word_chunk_size = int(chunk_size * 0.75)  # 1 token ~ 0.75 từ
    word_chunk_overlap = int(chunk_overlap * 0.75)
    
    # Tách văn bản thành các từ
    words = re.findall(r'\S+|\s+', text)
    
    # Khởi tạo các biến
    chunks = []
    current_chunk = []
    current_size = 0
    
    # Chia thành các chunk
    for word in words:
        current_chunk.append(word)
        current_size += 1
        
        if current_size >= word_chunk_size:
            # Thêm chunk hiện tại vào danh sách
            chunks.append(''.join(current_chunk))
            
            # Giữ lại phần chồng lấn cho chunk tiếp theo
            if word_chunk_overlap > 0:
                current_chunk = current_chunk[-word_chunk_overlap:]
                current_size = word_chunk_overlap
            else:
                current_chunk = []
                current_size = 0
    
    # Thêm phần còn lại nếu có
    if current_chunk:
        chunks.append(''.join(current_chunk))
    
    return chunks

@documents_bp.route('/<document_id>', methods=['PUT'])
@token_required_request
def update_document(document_id):
    """Cập nhật thông tin của một tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({"error": "Không có dữ liệu để cập nhật"}), 400
            
        # Kiểm tra dữ liệu đầu vào
        if 'title' not in data:
            return jsonify({"error": "Tên tài liệu là bắt buộc"}), 400
            
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Kiểm tra tài liệu tồn tại
        document = db_schema.get_document_by_id(doc_id)
        if not document:
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
            
        # Cập nhật thông tin
        update_data = {"title": data['title']}
        
        # Thực hiện cập nhật
        result = documents_collection.update_one(
            {"_id": doc_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                "message": "Cập nhật tài liệu thành công",
                "document_id": str(doc_id)
            }), 200
        else:
            return jsonify({"message": "Không có thay đổi"}), 200
            
    except Exception as e:
        current_app.logger.error(f"Error updating document: {str(e)}")
        return jsonify({"error": f"Không thể cập nhật tài liệu: {str(e)}"}), 500

@documents_bp.route('/<document_id>', methods=['DELETE'])
@token_required_request
def delete_document(document_id):
    """Xóa một tài liệu, tất cả các chunk của nó và các embedding tương ứng"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Kiểm tra tài liệu tồn tại
        document = db_schema.get_document_by_id(doc_id)
        if not document:
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
            
        # Xóa các embedding từ ChromaDB (nếu có)
        embedding_service.delete_document_embeddings(document_id)
        
        # Xóa tất cả các chunk của tài liệu
        chunks_collection.delete_many({"document_id": str(doc_id)})
        
        # Xóa tài liệu
        result = documents_collection.delete_one({"_id": doc_id})
        
        # Xóa file từ hệ thống nếu có
        if 'file_path' in document and document['file_path']:
            try:
                if os.path.exists(document['file_path']):
                    os.remove(document['file_path'])
            except Exception as e:
                print(f"Không thể xóa file {document['file_path']}: {str(e)}")
        
        return jsonify({
            "message": "Xóa tài liệu thành công",
            "document_id": str(doc_id)
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error deleting document: {str(e)}")
        return jsonify({"error": f"Không thể xóa tài liệu: {str(e)}"}), 500

@documents_bp.route('/<document_id>/chunks/<int:chunk_index>', methods=['PUT'])
@token_required_request
def update_chunk(document_id, chunk_index):
    """Cập nhật nội dung của một chunk"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({"error": "Không có dữ liệu để cập nhật"}), 400
            
        # Kiểm tra dữ liệu đầu vào
        required_fields = ['title', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Trường {field} là bắt buộc"}), 400
                
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Lấy thông tin chunk
        chunk = db_schema.get_chunk_by_document_and_index(doc_id, chunk_index)
        
        if not chunk:
            return jsonify({"error": "Không tìm thấy chunk"}), 404
            
        # Cập nhật thông tin
        update_data = {
            "title": data['title'],
            "content": data['content']
        }
        
        # Cập nhật word_count và tokens nếu nội dung thay đổi
        if 'content' in data and data['content'] != chunk.get('content', ''):
            # Tính số từ
            word_count = len(re.findall(r'\w+', data['content']))
            # Ước tính tokens
            tokens = int(word_count * 1.33)
            
            update_data["word_count"] = word_count
            update_data["tokens"] = tokens
            
        # Thực hiện cập nhật
        result = chunks_collection.update_one(
            {"document_id": str(doc_id), "index": chunk_index},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                "message": "Cập nhật chunk thành công",
                "chunk_index": chunk_index
            }), 200
        else:
            return jsonify({"message": "Không có thay đổi"}), 200
            
    except Exception as e:
        current_app.logger.error(f"Error updating chunk: {str(e)}")
        return jsonify({"error": f"Không thể cập nhật chunk: {str(e)}"}), 500

@documents_bp.route('/<document_id>/chunks/<int:chunk_index>', methods=['DELETE'])
@token_required_request
def delete_chunk(document_id, chunk_index):
    """Xóa một chunk cụ thể"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Lấy thông tin chunk để kiểm tra
        chunk = db_schema.get_chunk_by_document_and_index(doc_id, chunk_index)
        
        if not chunk:
            return jsonify({"error": "Không tìm thấy chunk"}), 404
            
        # Xóa chunk
        result = chunks_collection.delete_one({"document_id": str(doc_id), "index": chunk_index})
        
        # Cập nhật chunk count trong document
        documents_collection.update_one(
            {"_id": doc_id},
            {"$inc": {"chunks_count": -1}}
        )
        
        # Cập nhật lại index của các chunk còn lại
        chunks_collection.update_many(
            {"document_id": str(doc_id), "index": {"$gt": chunk_index}},
            {"$inc": {"index": -1}}
        )
        
        return jsonify({
            "message": "Xóa chunk thành công",
            "chunk_index": chunk_index
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error deleting chunk: {str(e)}")
        return jsonify({"error": f"Không thể xóa chunk: {str(e)}"}), 500

@documents_bp.route('/<document_id>/embed', methods=['POST'])
@token_required_request
def embed_document(document_id):
    """Tạo embedding cho tất cả các chunk của một tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Kiểm tra tài liệu tồn tại
        document = db_schema.get_document_by_id(doc_id)
        if not document:
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
            
        # Thực hiện embedding
        result = embedding_service.embed_document_chunks(doc_id)
        
        if result["success"]:
            # Cập nhật trạng thái đã embed của tài liệu
            documents_collection.update_one(
                {"_id": doc_id},
                {"$set": {"embedding_status": "completed"}}
            )
            
            return jsonify({
                "message": result["message"],
                "document_id": str(doc_id),
                "chunks_count": result["chunks_count"]
            }), 200
        else:
            return jsonify({"error": result["message"]}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error embedding document: {str(e)}")
        return jsonify({"error": f"Không thể tạo embedding cho tài liệu: {str(e)}"}), 500

@documents_bp.route('/<document_id>/embedding-status', methods=['GET'])
@token_required_request
def get_embedding_status(document_id):
    """Kiểm tra trạng thái embedding của một tài liệu"""
    try:
        # Lấy thông tin người dùng từ token
        user_id = get_jwt_identity()
        
        # Chuyển đổi document_id sang ObjectId nếu có thể
        try:
            if ObjectId.is_valid(document_id):
                doc_id = ObjectId(document_id)
            else:
                doc_id = document_id
        except Exception as e:
            return jsonify({"error": f"ID tài liệu không hợp lệ: {str(e)}"}), 400
            
        # Kiểm tra tài liệu tồn tại
        document = db_schema.get_document_by_id(doc_id)
        if not document:
            return jsonify({"error": "Không tìm thấy tài liệu"}), 404
            
        # Lấy trạng thái embedding
        result = embedding_service.get_embedding_status(doc_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": result.get("message", "Lỗi không xác định")}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error getting embedding status: {str(e)}")
        return jsonify({"error": f"Không thể lấy trạng thái embedding: {str(e)}"}), 500 