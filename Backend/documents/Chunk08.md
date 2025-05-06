#CHƯƠNG II

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

# Bài 2: GIÁ TRỊ LỚN NHẤT VÀ GIÁ TRỊ NHỎ NHẤT CỦA HÀM SỐ

#PHẦN LÝ THUYẾT

# 1. Định nghĩa

## HĐ1: Nhận biết khái niệm giá trị lớn nhất, giá trị nhỏ nhất của hàm số

Cho hàm số:

\[
y = f(x) = x^2 - 2x, \quad x \in [0;3]
\]

![Hình 1.15](images/Hinh_1_15.png)

**a)** Giá trị lớn nhất \( M \) của hàm số trên đoạn \( [0,3] \) là bao nhiêu?  
Tìm \( x_0 \) sao cho \( f(x_0) = M \).  

**b)** Giá trị nhỏ nhất \( m \) của hàm số trên đoạn \( [0,3] \) là bao nhiêu?  
Tìm \( x_0 \) sao cho \( f(x_0) = m \).  

## Định nghĩa tổng quát
Cho hàm số \( y = f(x) \) xác định trên tập \( D \).

- Số \( M \) được gọi là **giá trị lớn nhất** của hàm số \( y = f(x) \) trên tập \( D \) nếu:

\[
f(x) \leq M, \quad \forall x \in D
\]

Và tồn tại \( x_0 \in D \) sao cho:

\[
f(x_0) = M
\]

Ký hiệu:

\[
M = \max_{x \in D} f(x) \quad \text{hoặc} \quad M = \max f(x).
\]

- Số \( m \) được gọi là **giá trị nhỏ nhất** của hàm số \( y = f(x) \) trên tập \( D \) nếu:

\[
f(x) \geq m, \quad \forall x \in D
\]

Và tồn tại \( x_0 \in D \) sao cho:

\[
f(x_0) = m
\]

Ký hiệu:

\[
m = \min_{x \in D} f(x) \quad \text{hoặc} \quad m = \min f(x).
\]



## Chú ý
- Ta quy ước rằng khi nói giá trị lớn nhất và giá trị nhỏ nhất của hàm số \( f(x) \) (mà không nói "trên tập \( D \)") thì ta hiểu đó là giá trị lớn nhất hay giá trị nhỏ nhất của \( f(x) \) trên tập xác định của hàm số.
- Để tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số trên tập \( D \), ta thường lập bảng biến thiên của hàm số trên tập \( D \) để kết luận.

### Ví dụ 1
Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số \( y = f(x) = \sqrt{1 - x^2} \).

#### Giải
Tập xác định của hàm số là \([-1; 1]\).

##### Cách 1: Sử dụng định nghĩa.
Ta có:
- \( f(x) = \sqrt{1 - x^2} \geq 0 \); dấu bằng xảy ra khi \( 1 - x^2 = 0 \), tức là khi \( x = -1 \) hoặc \( x = 1 \).
  Do đó \( \min f(x) = f(-1) = f(1) = 0 \).

- \( f(x) = \sqrt{1 - x^2} \leq 1 \); dấu bằng xảy ra khi \( 1 - x^2 = 1 \), tức là khi \( x = 0 \).  
  Do đó \( \max f(x) = f(0) = 1 \).

##### Cách 2: Sử dụng bảng biến thiên.
Với \( x \in (-1,1) \), ta có:
\[
y' = \frac{-x}{\sqrt{1 - x^2}}
\]
\( y' = 0 \) khi \( x = 0 \).

Lập bảng biến thiên của hàm số trên đoạn \([-1; 1]\):

![Bảng biến thiên hàm sqrt(1-x^2)](images/Bang_bien_thien_sqrt_1_x2.png)

Từ bảng biến thiên, ta được:
\[
\min f(x) = f(-1) = f(1) = 0; \quad \max f(x) = f(0) = 1.
\]

**Chú ý:** Trong thực hành, ta cũng dùng các ký hiệu \( \min y, \max y \) để chỉ giá trị nhỏ nhất, giá trị lớn nhất (nếu có) của hàm số \( y = f(x) \) trên tập \( D \).  
Do đó, trong Ví dụ 1 ta có thể viết:
\[
\min y = y(-1) = y(1) = 0; \quad \max y = y(0) = 1.
\]

---

### Ví dụ 2
Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của hàm số \( y = x - 2 + \frac{1}{x} \) trên khoảng \( (0; +\infty) \).

#### Giải
Ta có:  
\[
y' = 1 - \frac{1}{x^2}
\]
Giải \( y' = 0 \):
\[
1 - \frac{1}{x^2} = 0 \Rightarrow x = 1 \quad (\text{vì } x > 0).
\]

Tính các giới hạn:
\[
\lim\limits_{x \to 0^+} y = \lim\limits_{x \to 0^+} \left( x - 2 + \frac{1}{x} \right) = +\infty;
\]
\[
\lim\limits_{x \to +\infty} y = \lim\limits_{x \to +\infty} \left( x - 2 + \frac{1}{x} \right) = +\infty.
\]

Lập bảng biến thiên của hàm số trên khoảng \( (0; +\infty) \):

![Bảng biến thiên 1](images/Bang_bien_thien_1.png)

Từ bảng biến thiên, ta được:  
\( \min y = y(1) = 0 \); hàm số không có giá trị lớn nhất trên khoảng \( (0; +\infty) \).

### Bài tập tương tự 
1.Bài toán thực tế: từ một tấm bìa carton hình vuông có độ dài cạnh bằng \( 60 \) cm, người ta cắt bốn hình vuông bằng nhau ở bốn góc rồi gập thành một chiếc hộp có dạng hình hộp chữ nhật không có nắp.(Hình 1.14)
Tính cạnh của các hình vuông bị cắt sao cho thể tích của chiếc hộp là lớn nhất.

![Hình 1.14](images/Hinh_1_14.png)

**Giải**  
Gọi \( x \) (cm) là độ dài cạnh của các hình vuông nhỏ được cắt ở bốn góc của tấm bìa. Điều kiện: \( 0 < x < 30 \).  
Khi cắt bỏ bốn hình vuông nhỏ có cạnh \( x \) (cm) ở bốn góc và gập lên thì ta được một chiếc hộp chữ nhật không có nắp, có đáy là hình vuông với độ dài cạnh bằng \( (60 - 2x) \) (cm) và chiều cao bằng \( x \) (cm). Thể tích của chiếc hộp này là:  

\[
V(x) = (60 - 2x)^2 \cdot x = 4x^3 - 240x^2 + 3600x \quad (\text{cm}^3).
\]

Ta có:  

\[
V'(x) = 12x^2 - 480x + 3600; \quad V'(x) = 0 \Leftrightarrow x^2 - 40x + 300 = 0 \Leftrightarrow x = 10 \quad (\text{thỏa mãn điều kiện}) \quad \text{hoặc} \quad x = 30 \quad (\text{loại}).
\]

Lập bảng biến thiên:  

![Bảng biến thiên thể tích](images/Bang_bien_thien_the_tich.png)

Vậy để thể tích của chiếc hộp là lớn nhất thì độ dài cạnh của các hình vuông nhỏ phải cắt là 10 cm.
---


#PHẦN LUYỆN TẬP
1.1 Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau:
a) \( y = \sqrt{2x - x^2} \);
b) \( y = -x + \frac{1}{x-1} \) trên khoảng \( (1; +\infty) \).

1.2. Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau:
a) \( y = -x^2 + 4x + 3 \);  
b) \( y = x^3 - 2x^2 + 1 \) trên \( [0; +\infty) \);  
c) \( y = \frac{x^2 - 2x + 3}{x - 1} \) trên \( (1; +\infty) \);  
d) \( y = \sqrt{4x - 2x^2} \).  

1.3. Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau:
a) \( y = x^4 - 2x^2 + 3 \);  
b) \( y = xe^{-x} \);  
c) \( y = x \ln x \);  
d) \( y = \sqrt{x - 1} + \sqrt{3 - x} \).  
