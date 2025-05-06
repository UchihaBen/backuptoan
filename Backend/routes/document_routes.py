from flask import Blueprint, request, jsonify, current_app, send_file
import os
import werkzeug
from werkzeug.utils import secure_filename
import json
from datetime import datetime
import sys

# Thêm thư mục cha vào sys.path để import module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from document_chunker import (
    process_document, 
    get_all_documents, 
    get_document_by_id, 
    get_document_chunks, 
    get_chunk_content,
    delete_document,
    search_documents
)

# Tạo blueprint cho các routes liên quan đến tài liệu
document_bp = Blueprint('document', __name__, url_prefix='/api/documents')

# Thư mục lưu trữ tạm thời các file upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Các định dạng file được phép
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'md'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@document_bp.route('/upload', methods=['POST'])
def upload_document():
    """API để tải lên và xử lý tài liệu"""
    # Kiểm tra xem có file trong request không
    if 'file' not in request.files:
        return jsonify({'error': 'Không có file nào được tải lên'}), 400
    
    file = request.files['file']
    
    # Nếu người dùng không chọn file
    if file.filename == '':
        return jsonify({'error': 'Không có file nào được chọn'}), 400
    
    # Kiểm tra định dạng file
    if not allowed_file(file.filename):
        return jsonify({'error': f'Định dạng file không được hỗ trợ. Các định dạng cho phép: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    try:
        # Lấy thông tin từ form
        title = request.form.get('title', 'Tài liệu không tiêu đề')
        chunk_size = int(request.form.get('chunkSize', 1000))
        chunk_overlap = int(request.form.get('chunkOverlap', 200))
        
        # Lưu file tạm thời
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(temp_path)
        
        # Xử lý tài liệu
        result = process_document(temp_path, title, chunk_size, chunk_overlap)
        
        # Xóa file tạm sau khi xử lý
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'message': 'Tài liệu đã được xử lý thành công',
            'document': result['document']
        }), 201
    
    except Exception as e:
        # Xóa file tạm nếu có lỗi
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'error': f'Lỗi khi xử lý tài liệu: {str(e)}'
        }), 500

@document_bp.route('/', methods=['GET'])
def get_documents():
    """API để lấy danh sách tất cả tài liệu"""
    try:
        # Lấy từ khóa tìm kiếm nếu có
        search_keyword = request.args.get('search', '')
        
        if search_keyword:
            documents = search_documents(search_keyword)
        else:
            documents = get_all_documents()
        
        return jsonify(documents), 200
    
    except Exception as e:
        return jsonify({'error': f'Lỗi khi lấy danh sách tài liệu: {str(e)}'}), 500

@document_bp.route('/<document_id>', methods=['GET'])
def get_document(document_id):
    """API để lấy thông tin chi tiết của một tài liệu"""
    try:
        document = get_document_by_id(document_id)
        
        if not document:
            return jsonify({'error': 'Không tìm thấy tài liệu'}), 404
        
        return jsonify(document), 200
    
    except Exception as e:
        return jsonify({'error': f'Lỗi khi lấy thông tin tài liệu: {str(e)}'}), 500

@document_bp.route('/<document_id>/chunks', methods=['GET'])
def get_chunks(document_id):
    """API để lấy danh sách các chunk của một tài liệu"""
    try:
        document = get_document_by_id(document_id)
        
        if not document:
            return jsonify({'error': 'Không tìm thấy tài liệu'}), 404
        
        chunks = get_document_chunks(document_id)
        
        return jsonify(chunks), 200
    
    except Exception as e:
        return jsonify({'error': f'Lỗi khi lấy danh sách chunk: {str(e)}'}), 500

@document_bp.route('/<document_id>/chunks/<int:chunk_index>', methods=['GET'])
def get_chunk(document_id, chunk_index):
    """API để lấy nội dung của một chunk cụ thể"""
    try:
        document = get_document_by_id(document_id)
        
        if not document:
            return jsonify({'error': 'Không tìm thấy tài liệu'}), 404
        
        content = get_chunk_content(document_id, chunk_index)
        
        if not content:
            return jsonify({'error': 'Không tìm thấy chunk'}), 404
        
        return jsonify({'content': content}), 200
    
    except Exception as e:
        return jsonify({'error': f'Lỗi khi lấy nội dung chunk: {str(e)}'}), 500

@document_bp.route('/<document_id>', methods=['DELETE'])
def delete_doc(document_id):
    """API để xóa một tài liệu và tất cả chunk của nó"""
    try:
        document = get_document_by_id(document_id)
        
        if not document:
            return jsonify({'error': 'Không tìm thấy tài liệu'}), 404
        
        success = delete_document(document_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Tài liệu đã được xóa thành công'}), 200
        else:
            return jsonify({'error': 'Không thể xóa tài liệu'}), 500
    
    except Exception as e:
        return jsonify({'error': f'Lỗi khi xóa tài liệu: {str(e)}'}), 500

# Đăng ký blueprint trong app.py
# app.register_blueprint(document_bp) 