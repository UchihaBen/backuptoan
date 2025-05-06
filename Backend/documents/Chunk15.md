#CHƯƠNG II

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

#Bài 4: KHẢO SÁT SỰ BIẾN THIÊN VÀ VẼ ĐỒ THỊ CỦA HÀM SỐ

#PHẦN LÝ THUYẾT

# 1. SƠ ĐỒ KHẢO SÁT HÀM SỐ

## HĐ1. Làm quen với việc khảo sát và vẽ đồ thị hàm số

Cho hàm số:

\[
y = x^2 - 4x + 3
\]

Thực hiện lần lượt các yêu cầu sau:

a) Tính \( y' \) và tìm các điểm tại đó \( y' = 0 \).  
b) Xét dấu \( y' \), tìm các khoảng đồng biến, nghịch biến và cực trị của hàm số.  
c) Tính \( \lim_{x \to -\infty} y \), \( \lim_{x \to +\infty} y \) và lập bảng biến thiên của hàm số.  
d) Vẽ đồ thị của hàm số và nhận xét về tính đối xứng của đồ thị.  

---

### Sơ đồ khảo sát hàm số \( y = f(x) \)

1. Tìm tập xác định của hàm số.  
2. Khảo sát sự biến thiên của hàm số:  
   - Tính đạo hàm \( y' \). Các điểm tại đó \( y' = 0 \) hoặc đạo hàm không tồn tại.  
   - Xét dấu \( y' \), chỉ ra các khoảng đồng biến, nghịch biến.  
   - Tìm cực trị của hàm số.  
   - Tìm giới hạn tại vô cực, giới hạn vô cực và tìm tiệm cận của đồ thị hàm số (nếu có).  
   - Lập bảng biến thiên của hàm số.  
3. Vẽ đồ thị của hàm số dựa vào bảng biến thiên.  

![Hình bài học](images/image2.png)


### Chú ý:
- Khi vẽ đồ thị, nên xác định thêm một số điểm đặc biệt của đồ thị, chẳng hạn tìm giao điểm của đồ thị với các trục tọa độ (khi có và việc tìm không quá phức tạp).  
- Ngoài ra, cần lưu ý đến tính đối xứng của đồ thị (đối xứng tâm, đối xứng trục).  


# 2. KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ ĐA THỨC BẬC BA

Trong mục này, ta sử dụng sơ đồ tổng quát ở Mục 1 để khảo sát sự biến thiên và vẽ đồ thị của hàm số bậc ba.

## Ví dụ 1.  
**Khảo sát sự biến thiên và vẽ đồ thị của hàm số**  
\[
y = -x^3 + 3x^2 - 4
\]

### Giải

1. **Tập xác định của hàm số**:  
   \[
   D = \mathbb{R}
   \]

2. **Sự biến thiên**:  
   - Tính đạo hàm:  
     \[
     y' = -3x^2 + 6x
     \]
     Giải phương trình \( y' = 0 \):  
     \[
     -3x^2 + 6x = 0 \Rightarrow x(2-x) = 0 \Rightarrow x = 0 \text{ hoặc } x = 2
     \]

   - Xét dấu \( y' \):  
     - Trên khoảng \( (0, 2) \), \( y' > 0 \) nên hàm số đồng biến.  
     - Trên các khoảng \( (-\infty, 0) \) và \( (2, +\infty) \), \( y' < 0 \) nên hàm số nghịch biến trên mỗi khoảng đó.  

   - Hàm số đạt cực tiểu tại \( x = 0 \), giá trị cực tiểu:  
     \[
     y_{CT} = -4
     \]
     Hàm số đạt cực đại tại \( x = 2 \), giá trị cực đại:  
     \[
     y_{CD} = 0
     \]

   - Giới hạn tại vô cực:  
     \[
     \lim_{x \to +\infty} y = -\infty, \quad \lim_{x \to -\infty} y = +\infty
     \]

   - **Bảng biến thiên**:  
     ![Bảng biến thiên](images/Bang_Bien_Thien.png)

3. **Đồ thị (Hình 1.28)**:

   - Giao điểm của đồ thị hàm số với trục tung là \( (0, -4) \).  
   - Giao điểm của đồ thị hàm số với trục hoành:  
     \[
     y = 0 \Rightarrow -x^3 + 3x^2 - 4 = 0
     \]
     Giải phương trình:  
     \[
     (x-2)^2(x+1) = 0 \Rightarrow x = -1 \text{ hoặc } x = 2
     \]
     Vậy giao điểm với trục hoành là \( (-1,0) \) và \( (2,0) \).  
   - Đồ thị có tâm đối xứng tại \( (1, -2) \).

![Hình 1.28](images/Hinh_1_28.png)

### Chú ý:
- Đồ thị của hàm số bậc ba \( y = ax^3 + bx^2 + cx + d \) (với \( a \neq 0 \)) có tâm đối xứng tại điểm có hoành độ:  
  \[
  x = -\frac{b}{3a}
  \]
- Không có tiệm cận.




# 3. KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ PHÂN THỨC HỮU TỈ  

Trong mục này, ta sử dụng sơ đồ tổng quát ở Mục 1 để khảo sát sự biến thiên và vẽ đồ thị của một số hàm phân thức hữu tỉ đơn giản.

## a) Hàm số phân thức \( y = \frac{ax + b}{cx + d} \) (với \( c \neq 0 \), \( ad - bc \neq 0 \)).

## Ví dụ 3.  
Khảo sát sự biến thiên và vẽ đồ thị của hàm số \( y = \frac{x + 1}{x - 2} \).

### Giải  

1. **Tập xác định của hàm số**: \( \mathbb{R} \setminus \{2\} \).


2. Sự biến thiên:

- Ta có: \( y' = \frac{-3}{(x-2)^2} < 0 \) với mọi \( x \neq 2 \).
- Hàm số nghịch biến trên từng khoảng \( (-\infty; 2) \) và \( (2; +\infty) \).
- Hàm số không có cực trị.
- **Tiệm cận**:
  \[
  \lim\limits_{x \to 2^-} y = \lim\limits_{x \to 2^-} \frac{x+1}{x-2} = -\infty; \quad \lim\limits_{x \to 2^+} y = \lim\limits_{x \to 2^+} \frac{x+1}{x-2} = +\infty.
  \]
  \[
  \lim\limits_{x \to -\infty} y = \lim\limits_{x \to -\infty} \frac{x+1}{x-2} = 1; \quad \lim\limits_{x \to +\infty} y = \lim\limits_{x \to +\infty} \frac{x+1}{x-2} = 1.
  \]
  - Do đó, đồ thị của hàm số có tiệm cận đứng là đường thẳng \( x = 2 \), tiệm cận ngang là đường thẳng \( y = 1 \).

- **Bảng biến thiên**:  
  ![Bảng biến thiên](images/Bang_Bien_Thien_3.png)

3. Đồ thị (Hình 1.30):

- Giao điểm của đồ thị hàm số với trục tung là điểm \( \left( 0; -\frac{1}{2} \right) \).
- Giao điểm của đồ thị hàm số với trục hoành là điểm \( (-1; 0) \).
- Đồ thị hàm số nhận giao điểm \( I(2;1) \) của hai đường tiệm cận làm tâm đối xứng và nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận này làm trục đối xứng.

  ![Hình 1.30](images/Hinh_1_30.png)

**Chú ý:**  
Đồ thị của hàm số phân thức \( y = \frac{ax + b}{cx + d} \) (\( c \neq 0 \), \( ad - bc \neq 0 \)):
- Nhận giao điểm của tiệm cận đứng và tiệm cận ngang làm tâm đối xứng.
- Nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận này làm các trục đối xứng.


## b) Hàm số phân thức \( y = \frac{ax^2 + bx + c}{px + q} \)  
*(với \( a \neq 0 \), \( p \neq 0 \), đa thức tử không chia hết cho đa thức mẫu)*

---

## Ví dụ 4.  
**Khảo sát và vẽ đồ thị của hàm số** \( y = \frac{x^2 - x - 1}{x - 2} \).

### Giải:
1. **Tập xác định:** \( \mathbb{R} \setminus \{2\} \).

2. **Sự biến thiên:**
   - Viết lại hàm số: \( y = x + 1 + \frac{1}{x - 2} \).
   - Đạo hàm:
     \[
     y' = 1 - \frac{1}{(x - 2)^2} = \frac{x^2 - 4x + 3}{(x - 2)^2}
     \]
     Giải \( y' = 0 \), ta có \( x^2 - 4x + 3 = 0 \Rightarrow x = 1 \) hoặc \( x = 3 \).

   - **Chiều biến thiên:**
     - Trên các khoảng \( (-\infty; 1) \) và \( (3; +\infty) \), \( y' > 0 \) nên hàm số đồng biến.
     - Trên các khoảng \( (1; 2) \) và \( (2; 3) \), \( y' < 0 \) nên hàm số nghịch biến.

   - **Cực trị:**
     - Cực đại tại \( x = 1 \), \( y_{\text{CD}} = 1 \).
     - Cực tiểu tại \( x = 3 \), \( y_{\text{CT}} = 5 \).

   - **Giới hạn và tiệm cận:**
     \[
     \lim\limits_{x \to 2^-} y = -\infty; \quad \lim\limits_{x \to 2^+} y = +\infty.
     \]
     \[
     \lim\limits_{x \to -\infty} y = x + 1; \quad \lim\limits_{x \to +\infty} y = x + 1.
     \]
     Do đó, đồ thị có **tiệm cận đứng** \( x = 2 \), **tiệm cận xiên** \( y = x + 1 \).

3. **Bảng biến thiên:**  
   ![Bảng biến thiên](images/Bang_Bien_Thien_4.png)

4. **Đồ thị (Hình 1.31):**
   - Giao điểm với trục tung: \( \left(0; \frac{1}{2}\right) \).
   - Đồ thị:
     ![Hình 1.31](images/Hinh_1_31.png)


- Ta có \( y = 0 \Leftrightarrow \frac{x^2 - x - 1}{x - 2} = 0 \Leftrightarrow x = \frac{1 - \sqrt{5}}{2} \) hoặc \( x = \frac{1 + \sqrt{5}}{2} \).  
  Do đó, giao điểm của đồ thị hàm số với trục hoành là các điểm \( \left(\frac{1 - \sqrt{5}}{2}; 0\right) \) và \( \left(\frac{1 + \sqrt{5}}{2}; 0\right) \).

- Đồ thị hàm số nhận giao điểm \( I(2; 3) \) của hai đường tiệm cận làm tâm đối xứng  
  và nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận này làm các trục đối xứng.


**Chú ý:** Đồ thị của hàm số phân thức \( y = \frac{ax^2 + bx + c}{px + q} \)  
\( (a \neq 0, p \neq 0 \), đa thức tử không chia hết cho đa thức mẫu) có các tính chất:  
  - Nhận giao điểm của tiệm cận đứng và tiệm cận xiên làm tâm đối xứng.  
  - Nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận này làm các trục đối xứng.

### Bài tập tương tự 
# 2. KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ ĐA THỨC BẬC BA
1.1 Khảo sát sự biến thiên và vẽ đồ thị của hàm số \( y = x^3 - 2x^2 + 2x -1 \).

#### Giải  

1. **Tập xác định của hàm số**: \( \mathbb{R} \).

2. **Sự biến thiên**:  

   - Ta có: \( y' = 3x^2 - 4x + 2 \). Vậy \( y' > 0 \) với mọi \( x \in \mathbb{R} \).
   - Hàm số đồng biến trên khoảng \( (-\infty; +\infty) \).
   - Hàm số không có cực trị.
   - Giới hạn tại vô cực:
     \[
     \lim\limits_{x \to \pm\infty} y = \lim\limits_{x \to \pm\infty} x^3 \left( 1 - \frac{2}{x} + \frac{2}{x^2} - \frac{1}{x^3} \right) = \pm\infty.
     \]

   - **Bảng biến thiên**:  
     ![Bảng biến thiên](images/Bang_Bien_Thien_2.png)

3. **Đồ thị (Hình 1.29)**:

   - Giao điểm của đồ thị hàm số với trục tung là điểm \( (0;-1) \).
   - Ta có \( y = 0 \Rightarrow x^3 - 2x^2 + 2x - 1 = 0 \Rightarrow (x-1)(x^2 - x + 1) = 0 \Rightarrow x = 1 \).  
     Do đó, giao điểm của đồ thị hàm số với trục hoành là điểm \( (1;0) \).
   - Đồ thị hàm số có tâm đối xứng là điểm \( \left(\frac{2}{3}, \frac{7}{27}\right) \).  

   ![Hình 1.29](images/Hinh_1_29.png)

# 3. KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ PHÂN THỨC HỮU TỈ  
## Ví dụ 5.  
**Khảo sát sự biến thiên và vẽ đồ thị của hàm số** \( y = \frac{x^2 + x - 2}{x + 1} \).

### Giải:
1. **Tập xác định:** \( \mathbb{R} \setminus \{-1\} \).

2. **Sự biến thiên:**
   - Viết lại hàm số: \( y = x - \frac{2}{x + 1} \).
   - Đạo hàm:
     \[
     y' = 1 + \frac{2}{(x + 1)^2} > 0, \quad \forall x \neq -1.
     \]
   - **Chiều biến thiên:**
     - Hàm số đồng biến trên từng khoảng \( (-\infty; -1) \) và \( (-1; +\infty) \).
   - **Cực trị:**  
     - Hàm số không có cực trị.

   - **Giới hạn và tiệm cận:**
     \[
     \lim\limits_{x \to -1^-} y = -\infty; \quad \lim\limits_{x \to -1^+} y = +\infty.
     \]
     \[
     \lim\limits_{x \to -\infty} y = x; \quad \lim\limits_{x \to +\infty} y = x.
     \]
     Do đó, đồ thị có **tiệm cận đứng** \( x = -1 \), **tiệm cận xiên** \( y = x \).

3. **Bảng biến thiên:**  
   ![Bảng biến thiên](images/Bang_Bien_Thien_5.png)

4. **Đồ thị (Hình 1.32):**
   - Giao điểm với trục tung: \( (0; -2) \).
   - Giải \( y = 0 \):
     \[
     \frac{x^2 + x - 2}{x + 1} = 0 \Leftrightarrow x = -2 \text{ hoặc } x = 1.
     \]
     - Giao điểm với trục hoành: \( (-2; 0) \) và \( (1; 0) \).
   - Đồ thị:
     ![Hình 1.32](images/Hinh_1_32.png)


- Đồ thị hàm số nhận giao điểm \( I(-1; -1) \) của hai đường tiệm cận làm tâm đối xứng  
  và nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận này làm các trục đối xứng.
#PHẦN LUYỆN TẬP 
## KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ ĐA THỨC BẬC BA
1.1 Khảo sát sự biến thiên và vẽ đồ thị của hàm số \( y = -2x^3 + 3x^2 - 5x \).

##KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ PHÂN THỨC HỮU TỈ  
1.1 Giải bài toán về **tính hứng mở đầu**, coi \( f(x) \) là hàm số xác định với \( x \geq 1 \).

1.2 Vận dụng: Một bể chứa ban đầu có 200 lít nước. Sau đó, cứ mỗi phút người ta bơm thêm 40 lít nước, đồng thời cho vào bể 20 gam chất khử trùng (hòa tan).
**Câu hỏi:**  
a) Tính thể tích nước và khối lượng chất khử trùng có trong bể sau \( t \) phút.Từ đó tính nồng độ chất khử trùng (gam/lít) trong bể sau \( t \) phút.
b) Coi nồng độ chất khử trùng là hàm số \( f(t) \) với \( t \geq 0 \). Khảo sát sự biến thiên và vẽ đồ thị của hàm số này.
c) Hãy giải thích tại sao nồng độ chất khử trùng tăng theo \( t \) nhưng không vượt ngưỡng 0,5 gam/lít.

1.3 Khảo sát sự biến thiên và vẽ đồ thị của hàm số \( y = \frac{-x^2 + 3x - 1}{x - 2} \).














