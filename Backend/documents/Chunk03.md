#CHƯƠNG I

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

# Bài 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ

#PHẦN LÝ THUYẾT

## 1. TÍNH ĐƠN ĐIỆU CỦA HÀM SỐ

### a) Khái niệm tính đơn điệu của hàm số

#### HĐ2: Nhận biết mối quan hệ giữa tính đơn điệu và dấu của đạo hàm

Xét hàm số \( y = f(x) \) có đồ thị như Hình 1.6.

\[
f'(x) =
\begin{cases}
x \text{ nếu } x < -1 \\
-1 \text{ nếu } -1 \leq x \leq 1 \\
x \text{ nếu } x > 1
\end{cases}
\]

a) Xét dấu của đạo hàm của hàm số trên các khoảng \( (-\infty, -1) \), \( (-1, 1) \), \( (1, +\infty) \), nhận xét về mối quan hệ giữa tính đồng biến, nghịch biến và dấu đạo hàm của hàm số trên mỗi khoảng này.

b) Có nhận xét gì về đạo hàm \( y' \) và hàm số \( y \) trên khoảng \( (-1, 1) \)?

![Hình 1.6](images/Hinh_1_6.png)

### 🔎 ĐỊNH LÝ

Cho hàm số \( y = f(x) \) có đạo hàm trên khoảng \( K \).  
a) Nếu \( f'(x) > 0 \) với mọi \( x \in K \) thì hàm số \( f(x) \) **đồng biến** trên khoảng \( K \).  
b) Nếu \( f'(x) < 0 \) với mọi \( x \in K \) thì hàm số \( f(x) \) **nghịch biến** trên khoảng \( K \).

### 🔎 Chú ý

- Định lý trên vẫn đúng trong trường hợp \( f'(x) \) bằng 0 tại một số hữu hạn điểm trong khoảng \( K \).
- Người ta chỉ muốn được rằng, nếu \( f'(x) = 0 \) với mọi \( x \in K \) thì hàm số \( f(x) \) **không đổi** trên khoảng \( K \).

### Ví dụ 2

**Tìm các khoảng đồng biến, khoảng nghịch biến của hàm số** \( y = x^2 - 4x + 2 \).

**Giải**  
Tập xác định của hàm số là \( \mathbb{R} \).  

Ta tính đạo hàm của hàm số:  
\[
y' = 2x - 4
\]

Tìm điểm tới hạn bằng cách giải phương trình \( y' = 0 \):  
\[
2x - 4 = 0 \Rightarrow x = 2.
\]

- Khi \( x < 2 \), ta chọn \( x = 0 \), suy ra \( y'(0) = 2(0) - 4 = -4 < 0 \) \( \Rightarrow \) hàm số nghịch biến trên \( (-\infty, 2) \).
- Khi \( x > 2 \), ta chọn \( x = 3 \), suy ra \( y'(3) = 2(3) - 4 = 2 > 0 \) \( \Rightarrow \) hàm số đồng biến trên \( (2, +\infty) \).

Vậy:  
- Hàm số **nghịch biến** trên khoảng \( (-\infty, 2) \).  
- Hàm số **đồng biến** trên khoảng \( (2, +\infty) \).  

## Bài tập tương tự 
**Tìm các khoảng đồng biến, khoảng nghịch biến của hàm số** \( y = 3x^2 - 6x + 4 \).

---

**Giải**  
Tập xác định của hàm số là \( \mathbb{R} \).  

Ta tính đạo hàm của hàm số:  
\[
y' = 6x - 6
\]

Tìm điểm tới hạn bằng cách giải phương trình \( y' = 0 \):  
\[
6x - 6 = 0 \Rightarrow x = 1.
\]

- Khi \( x < 1 \), ta chọn \( x = 0 \), suy ra \( y'(0) = 6(0) - 6 = -6 < 0 \) \( \Rightarrow \) hàm số nghịch biến trên \( (-\infty, 1) \).
- Khi \( x > 1 \), ta chọn \( x = 2 \), suy ra \( y'(2) = 6(2) - 6 = 6 > 0 \) \( \Rightarrow \) hàm số đồng biến trên \( (1, +\infty) \).

Vậy:  
- Hàm số **nghịch biến** trên khoảng \( (-\infty, 1) \).  
- Hàm số **đồng biến** trên khoảng \( (1, +\infty) \).  

#PHẦN LUYỆN TẬP
1.1 Tìm các khoảng đồng biến, khoảng nghịch biến của hàm số \( y = -4x^2 + 3 \).

---

1.2 Xét sự đồng biến, nghịch biến của các hàm số sau:
a) \( y = \frac{1}{3}x^3 - 2x^2 + 3x + 1 \). 
b) \( y = -x^4 + 2x^2 - 5x + 3 \).

---

1.3 Tìm các khoảng đơn điệu của các hàm số sau:
a) \( y = \frac{2x - 1}{x + 2} \).  LUYỆN
b) \( y = \frac{x^2 + x - 4}{x - 3} \).

---

1.4 Xét chiều biến thiên của các hàm số sau:

a) \( y = \sqrt{4 - x^2} \). 
b) \( y = \frac{x}{x + 1} \).

---

