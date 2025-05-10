import os
import chromadb
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage


GENMINI_API_KEY = "AIzaSyCkouU85gLzz8utrcOzz8MwsJ3Pgqqfuqc"
genai.configure(api_key=GENMINI_API_KEY)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")


MODEL_NAME = "intfloat/multilingual-e5-base"
sentence_ef = SentenceTransformer(MODEL_NAME)
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")


def search_similar_chunks(question, top_k=3):
    query_embedding = sentence_ef.encode([question]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    return [
        {'page': metadata['page'], 'content': doc, 'score': score}
        for doc, metadata, score in zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
    ] if results["documents"] else []

def generate_answer_with_genmini(question, context, image_paths=None):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')

        input_parts = [
    f"""
    # HÆ°á»›ng Dáº«n Táº¡o CÃ¢u Há»i Tráº¯c Nghiá»‡m ToÃ¡n Há»c ThÃ´ng Minh

    ## ðŸ¤– Vai TrÃ²
    Báº¡n lÃ  má»™t trá»£ lÃ½ AI chuyÃªn táº¡o cÃ¢u há»i tráº¯c nghiá»‡m ToÃ¡n há»c.

    ## ðŸ“š Äáº§u VÃ o
    ðŸ“– ThÃ´ng tin tá»« sÃ¡ch giÃ¡o khoa:
    """ + context + """

    â“ CÃ¢u há»i cá»§a há»c sinh:
    """ + question + """

    ## ðŸŽ¯ NguyÃªn Táº¯c Táº¡o CÃ¢u Há»i
    1. YÃªu Cáº§u CÆ¡ Báº£n:
       - LiÃªn quan trá»±c tiáº¿p Ä‘áº¿n chá»§ Ä‘á» CÃ¢u há»i cá»§a há»c sinh.
       - XÃ¢y dá»±ng dá»±a trÃªn thÃ´ng tin tá»« sÃ¡ch giÃ¡o khoa.
       - CÃ³ Ä‘á»™ khÃ³ Ä‘a dáº¡ng

    2. Chiáº¿n LÆ°á»£c Chi Tiáº¿t
       - PhÃ¢n tÃ­ch sÃ¢u cÃ¢u há»i cá»§a há»c sinh vÃ  thÃ´ng tin tá»« sÃ¡ch giÃ¡o khoa.
       - XÃ¡c Ä‘á»‹nh tá»« khÃ³a chÃ­nh
       - Táº¡o cÃ¢u há»i tá»« nháº­n biáº¿t Ä‘áº¿n váº­n dá»¥ng cao

    ## ðŸ§® Quy Táº¯c Viáº¿t CÃ´ng Thá»©c ToÃ¡n Há»c
    ### NguyÃªn Táº¯c Báº¯t Buá»™c:
    1. CÃ´ng Thá»©c Inline:
       - LuÃ´n sá»­ dá»¥ng \( ... \)
       - VÃ­ dá»¥: \( x^2 + y^2 = z^2 \)
       - KHÃ”NG Ä‘Æ°á»£c dÃ¹ng $ ... $ hay [ ... ]

    2. CÃ´ng Thá»©c Block:
       - LuÃ´n sá»­ dá»¥ng $$ ... $$
       - VÃ­ dá»¥: 
         $$\int_{a}^{b} f(x) dx$$
       - Xuá»‘ng dÃ²ng trÆ°á»›c vÃ  sau cÃ´ng thá»©c
       - KHÃ”NG Ä‘Æ°á»£c dÃ¹ng \[ ... \]

    3. CÃ¡c LÆ°u Ã Quan Trá»ng:
       - Sá»­ dá»¥ng kÃ½ tá»± toÃ¡n há»c gá»‘c
       - KhÃ´ng thÃªm khoáº£ng tráº¯ng thá»«a
       - Sá»­ dá»¥ng cÃ¡c lá»‡nh LaTeX chuáº©n
       - Æ¯u tiÃªn cÃ¡c hÃ m toÃ¡n há»c chuáº©n: \sin, \cos, \lim, \log, v.v.

    ## ðŸ“ Cáº¥u TrÃºc CÃ¢u Há»i
    - Tá»•ng: **10 cÃ¢u há»i**
    - Má»—i cÃ¢u: 4 Ä‘Ã¡p Ã¡n (A, B, C, D)
    - Chá»‰ 1 Ä‘Ã¡p Ã¡n Ä‘Ãºng

    ## ðŸ” Äá»‹nh Dáº¡ng JSON
    ```json
    {
      "questions": [
        {
          "question": "Ná»™i dung cÃ¢u há»i",
          "options": {
            "A": "ÄÃ¡p Ã¡n A",
            "B": "ÄÃ¡p Ã¡n B", 
            "C": "ÄÃ¡p Ã¡n C",
            "D": "ÄÃ¡p Ã¡n D"
          },
          "answer": "B",
          "solution": "Giáº£i thÃ­ch chi tiáº¿t"
        }
      ]
    }
    ```

    ## âš ï¸ LÆ°u Ã QUAN TRá»ŒNG
    - Náº¿u khÃ´ng Ä‘á»§ thÃ´ng tin: Tráº£ vá» JSON rá»—ng
    - Æ¯u tiÃªn thuáº­t ngá»¯ tá»« text chunk
    - TrÃ¡nh cÃ¢u há»i quÃ¡ khÃ³/dá»…
    - LUÃ”N LUÃ”N tuÃ¢n thá»§ quy táº¯c viáº¿t cÃ´ng thá»©c toÃ¡n há»c
    """
]


        if image_paths:
            for img_path in image_paths:
                if os.path.exists(img_path):
                    input_parts.append(PILImage.open(img_path))

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "âŒ KhÃ´ng cÃ³ pháº£n há»“i tá»« GenMini."

    except Exception as e:
        return f"âš ï¸ Lá»—i khi gá»i GenMini API: {str(e)}"
def rag_pipeline(question):
    retrieved_chunks = search_similar_chunks(question, top_k=3)
    image_paths = []

    context = "\n\n".join(f"{chunk['content']}" for chunk in retrieved_chunks)
    answer = generate_answer_with_genmini(question, context, image_paths) if context else "âŒ KhÃ´ng tÃ¬m tháº¥y tÃ i liá»‡u phÃ¹ há»£p."

    return {
        'question': question,
        'retrieved_chunks': retrieved_chunks,
        'answer': answer
    }



if __name__ == "__main__":
    user_question = "Äiá»u kiá»‡n Ä‘á»ƒ má»™t Ä‘iá»ƒm lÃ  cá»±c tiá»ƒu cá»§a hÃ m sá»‘ lÃ  gÃ¬?"
    result = rag_pipeline(user_question)

    print("\n===== ðŸ“– Káº¿t quáº£ tÃ¬m kiáº¿m =====")
    for chunk in result['retrieved_chunks']:
        print(f"- Trang {chunk['page']}: {chunk['content'][:200]}...")  # Chá»‰ hiá»ƒn thá»‹ 200 kÃ½ tá»± Ä‘áº§u tiÃªn

    print("\n===== Gia sÆ° tráº£ lá»i =====")
    print(f"### Káº¿t quáº£: \n\n**{result['answer']}**")  
