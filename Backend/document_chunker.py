import os
import re
import json
import time
from datetime import datetime
import pandas as pd
from pathlib import Path
import hashlib
import tiktoken

# Import có thể gây lỗi nếu không có thư viện, cho phép import thất bại
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    from model_manager import get_model_instance  # Import model manager
    # Khởi tạo model SentenceTransformer nếu có
    EMBEDDING_MODEL = None
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
    CHROMA_CLIENT = None
except ImportError:
    # Không gây lỗi nếu không có thư viện
    pass

try:
    import PyPDF2
except ImportError:
    print("Warning: PyPDF2 not installed. PDF processing will not be available.")

try:
    import docx
except ImportError:
    print("Warning: python-docx not installed. DOCX processing will not be available.")

# Định nghĩa đường dẫn
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_DIR = os.path.join(BASE_DIR, "documents")
CHUNKS_DIR = os.path.join(BASE_DIR, "chunks")

# Đảm bảo thư mục tồn tại
os.makedirs(DOCUMENTS_DIR, exist_ok=True)
os.makedirs(CHUNKS_DIR, exist_ok=True)

# Khởi tạo tokenizer giống với mô hình trong ebd_document.py
TOKENIZER = tiktoken.get_encoding("cl100k_base")  # Tokenizer tương thích với các mô hình OpenAI mới nhất

# Hàm khởi tạo embedding model nếu cần nhưng chỉ khi gọi trực tiếp
def initialize_embedding():
    global EMBEDDING_MODEL, CHROMA_CLIENT
    if EMBEDDING_MODEL is None:
        try:
            print("Initializing embedding model...")
            # Sử dụng model_manager để tải model từ cache
            EMBEDDING_MODEL = get_model_instance()
            CHROMA_CLIENT = chromadb.PersistentClient(path=DB_PATH)
            print("Embedding model initialized")
            return True
        except Exception as e:
            print(f"Failed to initialize embedding model: {e}")
            return False
    return True

# Hàm đếm tokens
def count_tokens(text):
    tokens = TOKENIZER.encode(text)
    return len(tokens)

# Hàm tạo ID duy nhất cho tài liệu
def generate_document_id(title, content):
    unique_string = f"{title}_{content[:100]}_{time.time()}"
    return hashlib.md5(unique_string.encode()).hexdigest()

# Hàm đọc file PDF
def read_pdf(file_path):
    text = ""
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n\n"
    return text

# Hàm đọc file DOCX
def read_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

# Hàm đọc file văn bản thông thường
def read_text_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

# Hàm phân tích nội dung file dựa vào định dạng
def extract_text_from_file(file_path):
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == ".pdf":
        return read_pdf(file_path)
    elif file_extension == ".docx":
        return read_docx(file_path)
    elif file_extension in [".txt", ".md"]:
        return read_text_file(file_path)
    else:
        raise ValueError(f"Không hỗ trợ định dạng file: {file_extension}")

# Hàm chia văn bản thành các chunk dựa trên số lượng token
def split_text_into_chunks(text, chunk_size=1000, chunk_overlap=200):
    """
    Chia văn bản thành các chunk với kích thước và độ chồng lấn cho trước.
    
    Args:
        text (str): Văn bản cần chia
        chunk_size (int): Số token tối đa cho một chunk (khoảng 1000 token ~ 750 từ)
        chunk_overlap (int): Số token chồng lấn giữa các chunk liên tiếp
    
    Returns:
        list: Danh sách các chunk văn bản
    """
    print(f"Bắt đầu chia văn bản thành các chunk với kích thước {chunk_size} token và độ chồng lấn {chunk_overlap} token")
    
    # Nếu văn bản rỗng hoặc rất ngắn
    if not text or len(text) < 10:
        return [text] if text else []
    
    # Chia văn bản thành các câu để có đơn vị nhỏ hơn đoạn văn
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = []
    current_chunk_tokens = 0
    
    # Độ linh hoạt kích thước - chỉ tạo chunk mới nếu vượt quá ngưỡng này
    # Chúng ta sẽ cho phép chunk đạt ít nhất 80% kích thước mục tiêu trước khi đóng
    min_chunk_threshold = chunk_size * 0.8
    
    for sentence in sentences:
        if not sentence.strip():
            continue
        
        # Đếm token trong câu hiện tại
        sentence_tokens = TOKENIZER.encode(sentence)
        sentence_token_count = len(sentence_tokens)
        
        # Nếu câu quá dài (vượt quá chunk_size), chia nó thành các từ
        if sentence_token_count > chunk_size:
            # Nếu chunk hiện tại không rỗng và đạt kích thước tối thiểu, lưu lại trước
            if current_chunk and current_chunk_tokens >= min_chunk_threshold:
                chunks.append(" ".join(current_chunk))
                
                # Giữ lại phần chồng lấn cho chunk tiếp theo
                overlap_text = []
                overlap_token_count = 0
                
                # Đi ngược từ cuối để lấy các câu chồng lấn
                for i in range(len(current_chunk) - 1, -1, -1):
                    tokens = TOKENIZER.encode(current_chunk[i])
                    if overlap_token_count + len(tokens) <= chunk_overlap:
                        overlap_text.insert(0, current_chunk[i])
                        overlap_token_count += len(tokens)
                    else:
                        break
                
                current_chunk = overlap_text
                current_chunk_tokens = overlap_token_count
            
            # Chia câu dài thành các từ
            words = sentence.split()
            word_chunk = []
            word_chunk_tokens = 0
            
            for word in words:
                word_tokens = TOKENIZER.encode(word + " ")
                word_token_count = len(word_tokens)
                
                # Nếu thêm từ này không làm vượt quá kích thước chunk
                if word_chunk_tokens + word_token_count <= chunk_size:
                    word_chunk.append(word + " ")
                    word_chunk_tokens += word_token_count
                else:
                    # Lưu chunk từ hiện tại nếu có
                    if word_chunk:
                        full_text = "".join(word_chunk)
                        
                        # Thêm vào chunk hiện tại nếu có thể
                        if current_chunk_tokens + word_chunk_tokens <= chunk_size:
                            current_chunk.append(full_text)
                            current_chunk_tokens += word_chunk_tokens
                        else:
                            # Lưu chunk hiện tại và tạo chunk mới
                            if current_chunk:
                                chunks.append(" ".join(current_chunk))
                            
                            # Tạo chunk mới với độ chồng lấn
                            overlap_text = []
                            overlap_token_count = 0
                            
                            for i in range(len(current_chunk) - 1, -1, -1):
                                tokens = TOKENIZER.encode(current_chunk[i])
                                if overlap_token_count + len(tokens) <= chunk_overlap:
                                    overlap_text.insert(0, current_chunk[i])
                                    overlap_token_count += len(tokens)
                                else:
                                    break
                            
                            current_chunk = overlap_text
                            current_chunk.append(full_text)
                            current_chunk_tokens = overlap_token_count + word_chunk_tokens
                    
                    # Bắt đầu một word chunk mới
                    word_chunk = [word + " "]
                    word_chunk_tokens = word_token_count
            
            # Xử lý phần word_chunk còn lại
            if word_chunk:
                full_text = "".join(word_chunk)
                
                # Thêm vào chunk hiện tại nếu có thể
                if current_chunk_tokens + word_chunk_tokens <= chunk_size:
                    current_chunk.append(full_text)
                    current_chunk_tokens += word_chunk_tokens
                else:
                    # Lưu chunk hiện tại và tạo chunk mới
                    if current_chunk:
                        chunks.append(" ".join(current_chunk))
                    
                    # Tạo chunk mới với độ chồng lấn
                    overlap_text = []
                    overlap_token_count = 0
                    
                    for i in range(len(current_chunk) - 1, -1, -1):
                        tokens = TOKENIZER.encode(current_chunk[i])
                        if overlap_token_count + len(tokens) <= chunk_overlap:
                            overlap_text.insert(0, current_chunk[i])
                            overlap_token_count += len(tokens)
                        else:
                            break
                    
                    current_chunk = overlap_text
                    current_chunk.append(full_text) 
                    current_chunk_tokens = overlap_token_count + word_chunk_tokens
        else:
            # Kiểm tra nếu thêm câu này vào sẽ vượt quá kích thước chunk
            if current_chunk_tokens + sentence_token_count > chunk_size:
                # Kiểm tra xem chunk hiện tại đã đạt kích thước tối thiểu chưa
                if current_chunk_tokens >= min_chunk_threshold:
                    # Lưu chunk hiện tại và bắt đầu một chunk mới
                    chunks.append(" ".join(current_chunk))
                    
                    # Tạo chunk mới với độ chồng lấn
                    overlap_text = []
                    overlap_token_count = 0
                    
                    for i in range(len(current_chunk) - 1, -1, -1):
                        tokens = TOKENIZER.encode(current_chunk[i])
                        if overlap_token_count + len(tokens) <= chunk_overlap:
                            overlap_text.insert(0, current_chunk[i])
                            overlap_token_count += len(tokens)
                        else:
                            break
                    
                    current_chunk = overlap_text
                    current_chunk.append(sentence)
                    current_chunk_tokens = overlap_token_count + sentence_token_count
                else:
                    # Nếu chunk hiện tại chưa đủ lớn, thêm câu và đóng chunk ngay cả khi vượt quá chunk_size
                    # Điều này là để đảm bảo kích thước tối thiểu cho chunk
                    current_chunk.append(sentence)
                    current_chunk_tokens += sentence_token_count
                    
                    # Lưu chunk vì nó đã vượt quá kích thước
                    chunks.append(" ".join(current_chunk))
                    
                    # Bắt đầu chunk mới với overlap từ chunk vừa đóng
                    overlap_text = []
                    overlap_token_count = 0
                    
                    for i in range(len(current_chunk) - 1, -1, -1):
                        tokens = TOKENIZER.encode(current_chunk[i])
                        if overlap_token_count + len(tokens) <= chunk_overlap:
                            overlap_text.insert(0, current_chunk[i])
                            overlap_token_count += len(tokens)
                        else:
                            break
                    
                    current_chunk = overlap_text
                    current_chunk_tokens = overlap_token_count
            else:
                # Thêm câu vào chunk hiện tại
                current_chunk.append(sentence)
                current_chunk_tokens += sentence_token_count
    
    # Thêm chunk cuối cùng nếu còn và đạt kích thước tối thiểu
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    print(f"Đã chia thành {len(chunks)} chunks dựa trên token")
    
    # Kiểm tra token count trong mỗi chunk để xác nhận
    for i, chunk in enumerate(chunks):
        token_count = len(TOKENIZER.encode(chunk))
        print(f"  Chunk {i+1}: {token_count} tokens")
    
    # Tính toán thống kê để in ra
    token_counts = [len(TOKENIZER.encode(chunk)) for chunk in chunks]
    if token_counts:
        avg_tokens = sum(token_counts) / len(token_counts)
        min_tokens = min(token_counts)
        max_tokens = max(token_counts)
        print(f"  Thống kê: TB={avg_tokens:.1f}, Min={min_tokens}, Max={max_tokens} tokens")
        print(f"  Mức sử dụng: {avg_tokens/chunk_size*100:.1f}% kích thước chunk")
    return chunks

# Hàm chính để xử lý tài liệu và lưu các chunk
def process_document(file_path, title, chunk_size=1000, chunk_overlap=200):
    """
    Xử lý tài liệu: đọc nội dung, chia thành các chunk và lưu vào cơ sở dữ liệu
    
    Args:
        file_path (str): Đường dẫn đến file tài liệu
        title (str): Tiêu đề tài liệu
        chunk_size (int): Kích thước chunk (số token)
        chunk_overlap (int): Độ chồng lấn giữa các chunk (số token)
    
    Returns:
        dict: Thông tin về tài liệu đã xử lý và các chunk
    """
    try:
        # Đọc nội dung tài liệu
        document_content = extract_text_from_file(file_path)
        
        # Tạo ID cho tài liệu
        document_id = generate_document_id(title, document_content)
        
        # Tạo thư mục cho tài liệu này nếu chưa tồn tại
        document_chunks_dir = os.path.join(CHUNKS_DIR, document_id)
        os.makedirs(document_chunks_dir, exist_ok=True)
        
        # Tính tổng số token trong toàn bộ văn bản
        total_tokens = count_tokens(document_content)
        
        # Chia tài liệu thành các chunk
        chunks = split_text_into_chunks(document_content, chunk_size, chunk_overlap)
        
        # Đếm trung bình số token mỗi chunk
        avg_tokens_per_chunk = sum(count_tokens(chunk) for chunk in chunks) / len(chunks)
        avg_words_per_chunk = sum(len(re.findall(r'\b\w+\b', chunk)) for chunk in chunks) / len(chunks)
        
        print(f"Đã chia thành {len(chunks)} chunks, trung bình {avg_tokens_per_chunk:.0f} token/chunk (~{avg_words_per_chunk:.0f} từ/chunk)")
        
        # Lưu thông tin tài liệu
        document_info = {
            "id": document_id,
            "title": title,
            "original_filename": os.path.basename(file_path),
            "upload_date": datetime.now().strftime("%Y-%m-%d"),
            "chunks_count": len(chunks),
            "total_characters": len(document_content),
            "total_tokens": total_tokens,
            "total_words": len(re.findall(r'\b\w+\b', document_content)),
            "chunk_settings": {
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "avg_tokens_per_chunk": int(avg_tokens_per_chunk),
                "avg_words_per_chunk": int(avg_words_per_chunk)
            }
        }
        
        # Lưu thông tin tài liệu vào file JSON
        with open(os.path.join(document_chunks_dir, "document_info.json"), "w", encoding="utf-8") as f:
            json.dump(document_info, f, ensure_ascii=False, indent=2)
        
        # Lưu từng chunk vào file riêng biệt
        chunk_infos = []
        for i, chunk_content in enumerate(chunks):
            chunk_id = f"{document_id}_{i+1}"
            chunk_file_path = os.path.join(document_chunks_dir, f"chunk_{i+1}.txt")
            
            # Đếm token trong chunk và số từ
            token_count = count_tokens(chunk_content)
            word_count = len(re.findall(r'\b\w+\b', chunk_content))
            
            # Lưu nội dung chunk
            with open(chunk_file_path, "w", encoding="utf-8") as f:
                f.write(chunk_content)
            
            # Thông tin về chunk
            chunk_info = {
                "id": chunk_id,
                "document_id": document_id,
                "index": i + 1,
                "title": f"Chunk {i + 1}",
                "tokens": token_count,
                "word_count": word_count,
                "characters": len(chunk_content),
                "file_path": chunk_file_path
            }
            chunk_infos.append(chunk_info)
        
        # Lưu thông tin tất cả các chunk vào file JSON
        with open(os.path.join(document_chunks_dir, "chunks_info.json"), "w", encoding="utf-8") as f:
            json.dump(chunk_infos, f, ensure_ascii=False, indent=2)
        
        return {
            "document": document_info,
            "chunks": chunk_infos
        }
    
    except Exception as e:
        print(f"Lỗi khi xử lý tài liệu: {str(e)}")
        raise

# Hàm lấy danh sách tất cả tài liệu đã xử lý
def get_all_documents():
    """Lấy danh sách tất cả tài liệu đã được xử lý"""
    documents = []
    
    # Duyệt qua tất cả thư mục con trong CHUNKS_DIR
    for doc_dir in os.listdir(CHUNKS_DIR):
        doc_path = os.path.join(CHUNKS_DIR, doc_dir)
        
        # Kiểm tra xem có phải là thư mục không
        if os.path.isdir(doc_path):
            info_file = os.path.join(doc_path, "document_info.json")
            
            # Nếu file thông tin tồn tại, đọc và thêm vào danh sách
            if os.path.exists(info_file):
                with open(info_file, "r", encoding="utf-8") as f:
                    doc_info = json.load(f)
                    documents.append(doc_info)
    
    # Sắp xếp theo ngày tải lên, mới nhất đầu tiên
    documents.sort(key=lambda x: x.get("upload_date", ""), reverse=True)
    return documents

# Hàm lấy thông tin tài liệu theo ID
def get_document_by_id(document_id):
    """Lấy thông tin tài liệu theo ID"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return None
    
    info_file = os.path.join(doc_path, "document_info.json")
    if os.path.exists(info_file):
        with open(info_file, "r", encoding="utf-8") as f:
            return json.load(f)
    
    return None

# Hàm lấy danh sách các chunk của một tài liệu
def get_document_chunks(document_id):
    """Lấy danh sách các chunk của một tài liệu theo ID"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return []
    
    chunks_file = os.path.join(doc_path, "chunks_info.json")
    if os.path.exists(chunks_file):
        with open(chunks_file, "r", encoding="utf-8") as f:
            return json.load(f)
    
    return []

# Hàm lấy nội dung của một chunk cụ thể
def get_chunk_content(document_id, chunk_index):
    """Lấy nội dung của một chunk cụ thể"""
    chunk_file = os.path.join(CHUNKS_DIR, document_id, f"chunk_{chunk_index}.txt")
    
    if os.path.exists(chunk_file):
        with open(chunk_file, "r", encoding="utf-8") as f:
            return f.read()
    
    return None

# Hàm xóa một tài liệu và tất cả chunk của nó
def delete_document(document_id):
    """Xóa một tài liệu và tất cả chunk của nó"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return False
    
    # Xóa tất cả file trong thư mục
    for file_name in os.listdir(doc_path):
        file_path = os.path.join(doc_path, file_name)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Lỗi khi xóa file {file_path}: {e}")
    
    # Xóa thư mục
    try:
        os.rmdir(doc_path)
        return True
    except Exception as e:
        print(f"Lỗi khi xóa thư mục {doc_path}: {e}")
        return False

# Hàm tìm kiếm tài liệu theo từ khóa
def search_documents(keyword):
    """Tìm kiếm tài liệu theo từ khóa trong tiêu đề"""
    all_docs = get_all_documents()
    if not keyword:
        return all_docs
    
    keyword = keyword.lower()
    return [doc for doc in all_docs if keyword in doc.get("title", "").lower()]

# Nếu file này được chạy trực tiếp
if __name__ == "__main__":
    print("Module xử lý tài liệu và chia chunk.")
    print(f"Thư mục lưu trữ tài liệu: {DOCUMENTS_DIR}")
    print(f"Thư mục lưu trữ chunk: {CHUNKS_DIR}") 
