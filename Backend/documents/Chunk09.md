   #CHƯƠNG I

   #ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

   # Bài 2: GIÁ TRỊ LỚN NHẤT VÀ GIÁ TRỊ NHỎ NHẤT CỦA HÀM SỐ

   #PHẦN LÝ THUYẾT

   #2. CÁCH TÌM GIÁ TRỊ LỚN NHẤT VÀ GIÁ TRỊ NHỎ NHẤT CỦA HÀM SỐ TRÊN MỘT ĐOẠN  

   ## HĐ2. Hình thành các bước tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số trên một đoạn  

   Xét hàm số \( y = f(x) = x^3 - 2x^2 + 1 \) trên đoạn \( [-1; 2] \), với đồ thị như Hình 1.16.

   a) Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số trên đoạn \( [-1; 2] \).

   ![Hình 1.16](images/Hinh_1_16.png)

   b) Tính đạo hàm f'(x) và tìm các điểm x ∈ (-1; 2) mà f'(x) = 0.

   c) Tính giá trị của hàm số tại hai đầu mút của đoạn [-1; 2] và tại các điểm x đã tìm ở câu b. 
   So sánh số nhỏ nhất trong các giá trị này với min f(x), số lớn nhất trong các giá trị này với max f(x).

   ---

   Giả sử y = f(x) là hàm số liên tục trên [a; b] và có đạo hàm trên (a; b), có thể trừ ra tại một số hữu hạn điểm mà tại đó hàm số không có đạo hàm. Giả sử chỉ có hữu hạn điểm trong đoạn [a; b] mà đạo hàm f'(x) bằng 0.

   Các bước tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số f(x) trên đoạn [a; b]:

   1. Tìm các điểm x₁, x₂,..., xₙ ∈ (a; b), tại đó f'(x) bằng 0 hoặc không tồn tại.
   2. Tính f(x₁), f(x₂),..., f(xₙ), f(a) và f(b).
   3. Tìm số lớn nhất M và số nhỏ nhất m trong các số trên. Ta có:

      \[
      M = \max_{[a;b]} f(x); \quad m = \min_{[a;b]} f(x).
      \]

   ---

   ### Ví dụ 4. 
   **Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số** \( y = x^4 - 4x^2 + 3 \) **trên đoạn** [0; 4].

   **Giải**  
   Ta có:  
   \( y' = 4x^3 - 8x = 4x(x^2 - 2) \);  
   \( y' = 0 \Leftrightarrow x = 0 \) hoặc \( x = \sqrt{2} \) (với \( x \in [0;4] \));

   \( y(0) = 3 \); \( y(4) = 195 \); \( y(\sqrt{2}) = -1 \).

   Do đó:  
   \( \max y_{[0;4]} = 195 \);  
   \( \min y_{[0;4]} = -1 \).

   ### Bài tập tương tự 
   **Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số** \( y = \sin x + \cos x \) **trên đoạn** [0; 2π].

   **Giải**  
   Ta có:  
   \( y' = \cos x - \sin x \);  
   \( y' = 0 \Leftrightarrow \cos x = \sin x \Leftrightarrow x = \frac{\pi}{4} \) hoặc \( x = \frac{5\pi}{4} \) (với \( x \in [0; 2\pi] \));

   \( y(0) = 1 \);  
   \( y(2\pi) = 1 \);  
   \( y(\frac{\pi}{4}) = \sqrt{2} \);  
   \( y(\frac{5\pi}{4}) = -\sqrt{2} \).

   Do đó:  
   \( \max y_{[0;2\pi]} = \sqrt{2} \);  
   \( \min y_{[0;2\pi]} = -\sqrt{2} \).

   ---
   #PHẦN LUYỆN TẬP

   1.1 :**Tìm giá trị lớn nhất và giá trị nhỏ nhất của các hàm số sau:**
   a) \( y = 2x^3 - 3x^2 + 5x + 2 \) trên đoạn [0; 2];  
   b) \( y = (x + 1)e^x \) trên đoạn [-1; 1].

   1.2. Vận dụng: giả sử sự lây lan của một loại virus ở một địa phương có thể được mô hình hóa bằng hàm số  
   \( N(t) = -t^3 + 12t^2 \), \( 0 \leq t \leq 12 \),  
   trong đó \( N \) là số người bị nhiễm bệnh (tính bằng trăm người) và \( t \) là thời gian (tuần).

   a) Hãy ước tính số người tối đa bị nhiễm bệnh ở địa phương đó.  
   b) Đạo hàm \( N'(t) \) biểu thị tốc độ lây lan của virus (còn gọi là tốc độ truyền bệnh). Hỏi virus sẽ lây lan nhanh nhất khi nào?

   1.3. Tìm giá trị lớn nhất và giá trị nhỏ nhất của các hàm số sau:
   a) \( y = 2x^3 - 6x + 3 \) trên đoạn \( [-1; 2] \);  
   b) \( y = x^4 - 3x^2 + 2 \) trên đoạn \( [0; 3] \);  
   c) \( y = x - \sin 2x \) trên đoạn \( [0; \pi] \);  
   d) \( y = (x^2 - x)e^x \) trên đoạn \( [0; 1] \).  

   1.4. Trong các hình chữ nhật có chu vi là 24 cm, hãy tìm hình chữ nhật có diện tích lớn nhất.  

   1.5. Một nhà sản xuất muốn thiết kế một chiếc hộp có dạng hình hộp chữ nhật không có nắp, có đáy là hình vuông và diện tích bề mặt bằng 108 cm² như Hình 1.17.  
   Tìm các kích thước của chiếc hộp sao cho thể tích của hộp là lớn nhất.  
   ![Hình 1.17](images/Hinh_1_17.png)  

   1.6. Một nhà sản xuất cần làm ra những chiếc bình có dạng hình trụ với dung tích 1.000 cm³.  
   Mặt trên và mặt dưới của bình được làm bằng vật liệu có giá 1,2 nghìn đồng/cm², trong khi mặt bên của bình được làm bằng vật liệu có giá 0,75 nghìn đồng/cm².  
   Tìm các kích thước của bình để chi phí vật liệu sản xuất mỗi chiếc bình là nhỏ nhất.

