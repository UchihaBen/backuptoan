import os
import re
import json
import time
from datetime import datetime
import pandas as pd
from pathlib import Path
import hashlib
import tiktoken

# Import cÃ³ thá»ƒ gÃ¢y lá»—i náº¿u khÃ´ng cÃ³ thÆ° viá»‡n, cho phÃ©p import tháº¥t báº¡i
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    # Khá»Ÿi táº¡o model SentenceTransformer náº¿u cÃ³
    EMBEDDING_MODEL = None
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
    CHROMA_CLIENT = None
except ImportError:
    # KhÃ´ng gÃ¢y lá»—i náº¿u khÃ´ng cÃ³ thÆ° viá»‡n
    pass

try:
    import PyPDF2
except ImportError:
    print("Warning: PyPDF2 not installed. PDF processing will not be available.")

try:
    import docx
except ImportError:
    print("Warning: python-docx not installed. DOCX processing will not be available.")

# Äá»‹nh nghÄ©a Ä‘Æ°á»ng dáº«n
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_DIR = os.path.join(BASE_DIR, "documents")
CHUNKS_DIR = os.path.join(BASE_DIR, "chunks")

# Äáº£m báº£o thÆ° má»¥c tá»“n táº¡i
os.makedirs(DOCUMENTS_DIR, exist_ok=True)
os.makedirs(CHUNKS_DIR, exist_ok=True)

# Khá»Ÿi táº¡o tokenizer giá»‘ng vá»›i mÃ´ hÃ¬nh trong ebd_document.py
TOKENIZER = tiktoken.get_encoding("cl100k_base")  # Tokenizer tÆ°Æ¡ng thÃ­ch vá»›i cÃ¡c mÃ´ hÃ¬nh OpenAI má»›i nháº¥t

# HÃ m khá»Ÿi táº¡o embedding model náº¿u cáº§n nhÆ°ng chá»‰ khi gá»i trá»±c tiáº¿p
def initialize_embedding():
    global EMBEDDING_MODEL, CHROMA_CLIENT
    if EMBEDDING_MODEL is None:
        try:
            print("Initializing embedding model...")
            # ÄÃ¢y lÃ  model giá»‘ng vá»›i ebd_document.py
            EMBEDDING_MODEL = SentenceTransformer("intfloat/multilingual-e5-base")
            CHROMA_CLIENT = chromadb.PersistentClient(path=DB_PATH)
            print("Embedding model initialized")
            return True
        except Exception as e:
            print(f"Failed to initialize embedding model: {e}")
            return False
    return True

# HÃ m Ä‘áº¿m tokens
def count_tokens(text):
    tokens = TOKENIZER.encode(text)
    return len(tokens)

# HÃ m táº¡o ID duy nháº¥t cho tÃ i liá»‡u
def generate_document_id(title, content):
    unique_string = f"{title}_{content[:100]}_{time.time()}"
    return hashlib.md5(unique_string.encode()).hexdigest()

# HÃ m Ä‘á»c file PDF
def read_pdf(file_path):
    text = ""
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n\n"
    return text

# HÃ m Ä‘á»c file DOCX
def read_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

# HÃ m Ä‘á»c file vÄƒn báº£n thÃ´ng thÆ°á»ng
def read_text_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

# HÃ m phÃ¢n tÃ­ch ná»™i dung file dá»±a vÃ o Ä‘á»‹nh dáº¡ng
def extract_text_from_file(file_path):
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == ".pdf":
        return read_pdf(file_path)
    elif file_extension == ".docx":
        return read_docx(file_path)
    elif file_extension in [".txt", ".md"]:
        return read_text_file(file_path)
    else:
        raise ValueError(f"KhÃ´ng há»— trá»£ Ä‘á»‹nh dáº¡ng file: {file_extension}")

# HÃ m chia vÄƒn báº£n thÃ nh cÃ¡c chunk dá»±a trÃªn sá»‘ lÆ°á»£ng token
def split_text_into_chunks(text, chunk_size=1000, chunk_overlap=200):
    """
    Chia vÄƒn báº£n thÃ nh cÃ¡c chunk vá»›i kÃ­ch thÆ°á»›c vÃ  Ä‘á»™ chá»“ng láº¥n cho trÆ°á»›c.
    
    Args:
        text (str): VÄƒn báº£n cáº§n chia
        chunk_size (int): Sá»‘ token tá»‘i Ä‘a cho má»™t chunk (khoáº£ng 1000 token ~ 750 tá»«)
        chunk_overlap (int): Sá»‘ token chá»“ng láº¥n giá»¯a cÃ¡c chunk liÃªn tiáº¿p
    
    Returns:
        list: Danh sÃ¡ch cÃ¡c chunk vÄƒn báº£n
    """
    print(f"Báº¯t Ä‘áº§u chia vÄƒn báº£n thÃ nh cÃ¡c chunk vá»›i kÃ­ch thÆ°á»›c {chunk_size} token vÃ  Ä‘á»™ chá»“ng láº¥n {chunk_overlap} token")
    
    # Náº¿u vÄƒn báº£n rá»—ng hoáº·c ráº¥t ngáº¯n
    if not text or len(text) < 10:
        return [text] if text else []
    
    # Chia vÄƒn báº£n thÃ nh cÃ¡c cÃ¢u Ä‘á»ƒ cÃ³ Ä‘Æ¡n vá»‹ nhá» hÆ¡n Ä‘oáº¡n vÄƒn
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = []
    current_chunk_tokens = 0
    
    # Äá»™ linh hoáº¡t kÃ­ch thÆ°á»›c - chá»‰ táº¡o chunk má»›i náº¿u vÆ°á»£t quÃ¡ ngÆ°á»¡ng nÃ y
    # ChÃºng ta sáº½ cho phÃ©p chunk Ä‘áº¡t Ã­t nháº¥t 80% kÃ­ch thÆ°á»›c má»¥c tiÃªu trÆ°á»›c khi Ä‘Ã³ng
    min_chunk_threshold = chunk_size * 0.8
    
    for sentence in sentences:
        if not sentence.strip():
            continue
        
        # Äáº¿m token trong cÃ¢u hiá»‡n táº¡i
        sentence_tokens = TOKENIZER.encode(sentence)
        sentence_token_count = len(sentence_tokens)
        
        # Náº¿u cÃ¢u quÃ¡ dÃ i (vÆ°á»£t quÃ¡ chunk_size), chia nÃ³ thÃ nh cÃ¡c tá»«
        if sentence_token_count > chunk_size:
            # Náº¿u chunk hiá»‡n táº¡i khÃ´ng rá»—ng vÃ  Ä‘áº¡t kÃ­ch thÆ°á»›c tá»‘i thiá»ƒu, lÆ°u láº¡i trÆ°á»›c
            if current_chunk and current_chunk_tokens >= min_chunk_threshold:
                chunks.append(" ".join(current_chunk))
                
                # Giá»¯ láº¡i pháº§n chá»“ng láº¥n cho chunk tiáº¿p theo
                overlap_text = []
                overlap_token_count = 0
                
                # Äi ngÆ°á»£c tá»« cuá»‘i Ä‘á»ƒ láº¥y cÃ¡c cÃ¢u chá»“ng láº¥n
                for i in range(len(current_chunk) - 1, -1, -1):
                    tokens = TOKENIZER.encode(current_chunk[i])
                    if overlap_token_count + len(tokens) <= chunk_overlap:
                        overlap_text.insert(0, current_chunk[i])
                        overlap_token_count += len(tokens)
                    else:
                        break
                
                current_chunk = overlap_text
                current_chunk_tokens = overlap_token_count
            
            # Chia cÃ¢u dÃ i thÃ nh cÃ¡c tá»«
            words = sentence.split()
            word_chunk = []
            word_chunk_tokens = 0
            
            for word in words:
                word_tokens = TOKENIZER.encode(word + " ")
                word_token_count = len(word_tokens)
                
                # Náº¿u thÃªm tá»« nÃ y khÃ´ng lÃ m vÆ°á»£t quÃ¡ kÃ­ch thÆ°á»›c chunk
                if word_chunk_tokens + word_token_count <= chunk_size:
                    word_chunk.append(word + " ")
                    word_chunk_tokens += word_token_count
                else:
                    # LÆ°u chunk tá»« hiá»‡n táº¡i náº¿u cÃ³
                    if word_chunk:
                        full_text = "".join(word_chunk)
                        
                        # ThÃªm vÃ o chunk hiá»‡n táº¡i náº¿u cÃ³ thá»ƒ
                        if current_chunk_tokens + word_chunk_tokens <= chunk_size:
                            current_chunk.append(full_text)
                            current_chunk_tokens += word_chunk_tokens
                        else:
                            # LÆ°u chunk hiá»‡n táº¡i vÃ  táº¡o chunk má»›i
                            if current_chunk:
                                chunks.append(" ".join(current_chunk))
                            
                            # Táº¡o chunk má»›i vá»›i Ä‘á»™ chá»“ng láº¥n
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
                    
                    # Báº¯t Ä‘áº§u má»™t word chunk má»›i
                    word_chunk = [word + " "]
                    word_chunk_tokens = word_token_count
            
            # Xá»­ lÃ½ pháº§n word_chunk cÃ²n láº¡i
            if word_chunk:
                full_text = "".join(word_chunk)
                
                # ThÃªm vÃ o chunk hiá»‡n táº¡i náº¿u cÃ³ thá»ƒ
                if current_chunk_tokens + word_chunk_tokens <= chunk_size:
                    current_chunk.append(full_text)
                    current_chunk_tokens += word_chunk_tokens
                else:
                    # LÆ°u chunk hiá»‡n táº¡i vÃ  táº¡o chunk má»›i
                    if current_chunk:
                        chunks.append(" ".join(current_chunk))
                    
                    # Táº¡o chunk má»›i vá»›i Ä‘á»™ chá»“ng láº¥n
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
            # Kiá»ƒm tra náº¿u thÃªm cÃ¢u nÃ y vÃ o sáº½ vÆ°á»£t quÃ¡ kÃ­ch thÆ°á»›c chunk
            if current_chunk_tokens + sentence_token_count > chunk_size:
                # Kiá»ƒm tra xem chunk hiá»‡n táº¡i Ä‘Ã£ Ä‘áº¡t kÃ­ch thÆ°á»›c tá»‘i thiá»ƒu chÆ°a
                if current_chunk_tokens >= min_chunk_threshold:
                    # LÆ°u chunk hiá»‡n táº¡i vÃ  báº¯t Ä‘áº§u má»™t chunk má»›i
                    chunks.append(" ".join(current_chunk))
                    
                    # Táº¡o chunk má»›i vá»›i Ä‘á»™ chá»“ng láº¥n
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
                    # Náº¿u chunk hiá»‡n táº¡i chÆ°a Ä‘á»§ lá»›n, thÃªm cÃ¢u vÃ  Ä‘Ã³ng chunk ngay cáº£ khi vÆ°á»£t quÃ¡ chunk_size
                    # Äiá»u nÃ y lÃ  Ä‘á»ƒ Ä‘áº£m báº£o kÃ­ch thÆ°á»›c tá»‘i thiá»ƒu cho chunk
                    current_chunk.append(sentence)
                    current_chunk_tokens += sentence_token_count
                    
                    # LÆ°u chunk vÃ¬ nÃ³ Ä‘Ã£ vÆ°á»£t quÃ¡ kÃ­ch thÆ°á»›c
                    chunks.append(" ".join(current_chunk))
                    
                    # Báº¯t Ä‘áº§u chunk má»›i vá»›i overlap tá»« chunk vá»«a Ä‘Ã³ng
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
                # ThÃªm cÃ¢u vÃ o chunk hiá»‡n táº¡i
                current_chunk.append(sentence)
                current_chunk_tokens += sentence_token_count
    
    # ThÃªm chunk cuá»‘i cÃ¹ng náº¿u cÃ²n vÃ  Ä‘áº¡t kÃ­ch thÆ°á»›c tá»‘i thiá»ƒu
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    print(f"ÄÃ£ chia thÃ nh {len(chunks)} chunks dá»±a trÃªn token")
    
    # Kiá»ƒm tra token count trong má»—i chunk Ä‘á»ƒ xÃ¡c nháº­n
    for i, chunk in enumerate(chunks):
        token_count = len(TOKENIZER.encode(chunk))
        print(f"  Chunk {i+1}: {token_count} tokens")
    
    # TÃ­nh toÃ¡n thá»‘ng kÃª Ä‘á»ƒ in ra
    token_counts = [len(TOKENIZER.encode(chunk)) for chunk in chunks]
    if token_counts:
        avg_tokens = sum(token_counts) / len(token_counts)
        min_tokens = min(token_counts)
        max_tokens = max(token_counts)
        print(f"  Thá»‘ng kÃª: TB={avg_tokens:.1f}, Min={min_tokens}, Max={max_tokens} tokens")
        print(f"  Má»©c sá»­ dá»¥ng: {avg_tokens/chunk_size*100:.1f}% kÃ­ch thÆ°á»›c chunk")
    return chunks

# HÃ m chÃ­nh Ä‘á»ƒ xá»­ lÃ½ tÃ i liá»‡u vÃ  lÆ°u cÃ¡c chunk
def process_document(file_path, title, chunk_size=1000, chunk_overlap=200):
    """
    Xá»­ lÃ½ tÃ i liá»‡u: Ä‘á»c ná»™i dung, chia thÃ nh cÃ¡c chunk vÃ  lÆ°u vÃ o cÆ¡ sá»Ÿ dá»¯ liá»‡u
    
    Args:
        file_path (str): ÄÆ°á»ng dáº«n Ä‘áº¿n file tÃ i liá»‡u
        title (str): TiÃªu Ä‘á» tÃ i liá»‡u
        chunk_size (int): KÃ­ch thÆ°á»›c chunk (sá»‘ token)
        chunk_overlap (int): Äá»™ chá»“ng láº¥n giá»¯a cÃ¡c chunk (sá»‘ token)
    
    Returns:
        dict: ThÃ´ng tin vá» tÃ i liá»‡u Ä‘Ã£ xá»­ lÃ½ vÃ  cÃ¡c chunk
    """
    try:
        # Äá»c ná»™i dung tÃ i liá»‡u
        document_content = extract_text_from_file(file_path)
        
        # Táº¡o ID cho tÃ i liá»‡u
        document_id = generate_document_id(title, document_content)
        
        # Táº¡o thÆ° má»¥c cho tÃ i liá»‡u nÃ y náº¿u chÆ°a tá»“n táº¡i
        document_chunks_dir = os.path.join(CHUNKS_DIR, document_id)
        os.makedirs(document_chunks_dir, exist_ok=True)
        
        # TÃ­nh tá»•ng sá»‘ token trong toÃ n bá»™ vÄƒn báº£n
        total_tokens = count_tokens(document_content)
        
        # Chia tÃ i liá»‡u thÃ nh cÃ¡c chunk
        chunks = split_text_into_chunks(document_content, chunk_size, chunk_overlap)
        
        # Äáº¿m trung bÃ¬nh sá»‘ token má»—i chunk
        avg_tokens_per_chunk = sum(count_tokens(chunk) for chunk in chunks) / len(chunks)
        avg_words_per_chunk = sum(len(re.findall(r'\b\w+\b', chunk)) for chunk in chunks) / len(chunks)
        
        print(f"ÄÃ£ chia thÃ nh {len(chunks)} chunks, trung bÃ¬nh {avg_tokens_per_chunk:.0f} token/chunk (~{avg_words_per_chunk:.0f} tá»«/chunk)")
        
        # LÆ°u thÃ´ng tin tÃ i liá»‡u
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
        
        # LÆ°u thÃ´ng tin tÃ i liá»‡u vÃ o file JSON
        with open(os.path.join(document_chunks_dir, "document_info.json"), "w", encoding="utf-8") as f:
            json.dump(document_info, f, ensure_ascii=False, indent=2)
        
        # LÆ°u tá»«ng chunk vÃ o file riÃªng biá»‡t
        chunk_infos = []
        for i, chunk_content in enumerate(chunks):
            chunk_id = f"{document_id}_{i+1}"
            chunk_file_path = os.path.join(document_chunks_dir, f"chunk_{i+1}.txt")
            
            # Äáº¿m token trong chunk vÃ  sá»‘ tá»«
            token_count = count_tokens(chunk_content)
            word_count = len(re.findall(r'\b\w+\b', chunk_content))
            
            # LÆ°u ná»™i dung chunk
            with open(chunk_file_path, "w", encoding="utf-8") as f:
                f.write(chunk_content)
            
            # ThÃ´ng tin vá» chunk
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
        
        # LÆ°u thÃ´ng tin táº¥t cáº£ cÃ¡c chunk vÃ o file JSON
        with open(os.path.join(document_chunks_dir, "chunks_info.json"), "w", encoding="utf-8") as f:
            json.dump(chunk_infos, f, ensure_ascii=False, indent=2)
        
        return {
            "document": document_info,
            "chunks": chunk_infos
        }
    
    except Exception as e:
        print(f"Lá»—i khi xá»­ lÃ½ tÃ i liá»‡u: {str(e)}")
        raise

# HÃ m láº¥y danh sÃ¡ch táº¥t cáº£ tÃ i liá»‡u Ä‘Ã£ xá»­ lÃ½
def get_all_documents():
    """Láº¥y danh sÃ¡ch táº¥t cáº£ tÃ i liá»‡u Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½"""
    documents = []
    
    # Duyá»‡t qua táº¥t cáº£ thÆ° má»¥c con trong CHUNKS_DIR
    for doc_dir in os.listdir(CHUNKS_DIR):
        doc_path = os.path.join(CHUNKS_DIR, doc_dir)
        
        # Kiá»ƒm tra xem cÃ³ pháº£i lÃ  thÆ° má»¥c khÃ´ng
        if os.path.isdir(doc_path):
            info_file = os.path.join(doc_path, "document_info.json")
            
            # Náº¿u file thÃ´ng tin tá»“n táº¡i, Ä‘á»c vÃ  thÃªm vÃ o danh sÃ¡ch
            if os.path.exists(info_file):
                with open(info_file, "r", encoding="utf-8") as f:
                    doc_info = json.load(f)
                    documents.append(doc_info)
    
    # Sáº¯p xáº¿p theo ngÃ y táº£i lÃªn, má»›i nháº¥t Ä‘áº§u tiÃªn
    documents.sort(key=lambda x: x.get("upload_date", ""), reverse=True)
    return documents

# HÃ m láº¥y thÃ´ng tin tÃ i liá»‡u theo ID
def get_document_by_id(document_id):
    """Láº¥y thÃ´ng tin tÃ i liá»‡u theo ID"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return None
    
    info_file = os.path.join(doc_path, "document_info.json")
    if os.path.exists(info_file):
        with open(info_file, "r", encoding="utf-8") as f:
            return json.load(f)
    
    return None

# HÃ m láº¥y danh sÃ¡ch cÃ¡c chunk cá»§a má»™t tÃ i liá»‡u
def get_document_chunks(document_id):
    """Láº¥y danh sÃ¡ch cÃ¡c chunk cá»§a má»™t tÃ i liá»‡u theo ID"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return []
    
    chunks_file = os.path.join(doc_path, "chunks_info.json")
    if os.path.exists(chunks_file):
        with open(chunks_file, "r", encoding="utf-8") as f:
            return json.load(f)
    
    return []

# HÃ m láº¥y ná»™i dung cá»§a má»™t chunk cá»¥ thá»ƒ
def get_chunk_content(document_id, chunk_index):
    """Láº¥y ná»™i dung cá»§a má»™t chunk cá»¥ thá»ƒ"""
    chunk_file = os.path.join(CHUNKS_DIR, document_id, f"chunk_{chunk_index}.txt")
    
    if os.path.exists(chunk_file):
        with open(chunk_file, "r", encoding="utf-8") as f:
            return f.read()
    
    return None

# HÃ m xÃ³a má»™t tÃ i liá»‡u vÃ  táº¥t cáº£ chunk cá»§a nÃ³
def delete_document(document_id):
    """XÃ³a má»™t tÃ i liá»‡u vÃ  táº¥t cáº£ chunk cá»§a nÃ³"""
    doc_path = os.path.join(CHUNKS_DIR, document_id)
    
    if not os.path.exists(doc_path):
        return False
    
    # XÃ³a táº¥t cáº£ file trong thÆ° má»¥c
    for file_name in os.listdir(doc_path):
        file_path = os.path.join(doc_path, file_name)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Lá»—i khi xÃ³a file {file_path}: {e}")
    
    # XÃ³a thÆ° má»¥c
    try:
        os.rmdir(doc_path)
        return True
    except Exception as e:
        print(f"Lá»—i khi xÃ³a thÆ° má»¥c {doc_path}: {e}")
        return False

# HÃ m tÃ¬m kiáº¿m tÃ i liá»‡u theo tá»« khÃ³a
def search_documents(keyword):
    """TÃ¬m kiáº¿m tÃ i liá»‡u theo tá»« khÃ³a trong tiÃªu Ä‘á»"""
    all_docs = get_all_documents()
    if not keyword:
        return all_docs
    
    keyword = keyword.lower()
    return [doc for doc in all_docs if keyword in doc.get("title", "").lower()]

# Náº¿u file nÃ y Ä‘Æ°á»£c cháº¡y trá»±c tiáº¿p
if __name__ == "__main__":
    print("Module xá»­ lÃ½ tÃ i liá»‡u vÃ  chia chunk.")
    print(f"ThÆ° má»¥c lÆ°u trá»¯ tÃ i liá»‡u: {DOCUMENTS_DIR}")
    print(f"ThÆ° má»¥c lÆ°u trá»¯ chunk: {CHUNKS_DIR}") 
