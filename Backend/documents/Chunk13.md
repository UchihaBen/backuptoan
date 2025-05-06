#CHƯƠNG II

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

#Bài 3: ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ HÀM SỐ  

#PHẦN LÝ THUYẾT

# 1. ĐƯỜNG TIỆM CẬN XIÊN

## HĐ2: Nhận biết đường tiệm cận xiên 

**Định nghĩa:** Đường thẳng \( y = ax + b \) (\( a \neq 0 \)) gọi là **đường tiệm cận xiên** (gọi tắt là **tiệm cận xiên**) của đồ thị hàm số \( y = f(x) \) nếu  
\[
\lim_{x \to +\infty} [f(x) - (ax + b)] = 0
\]
hoặc  
\[
\lim_{x \to -\infty} [f(x) - (ax + b)] = 0.
\]

![Hình 1.25](images/Hinh_1.25.png)

---

### Ví dụ 5.  
Cho hàm số \( y = f(x) = x + \frac{1}{x + 2} \). Tìm tiệm cận xiên của đồ thị hàm số \( f(x) \).  

**Giải**  
Ta có:  
\[
\lim_{x \to +\infty} [f(x) - x] = \lim_{x \to +\infty} \frac{1}{x + 2} = 0.
\]  
Tương tự,  
\[
\lim_{x \to -\infty} [f(x) - x] = 0.
\]  
Vậy đồ thị hàm số \( f(x) \) có tiệm cận xiên là đường thẳng \( y = x \).


# Chú ý
Ta biết rằng nếu đường thẳng \( y = ax + b \) (với \( a \neq 0 \)) là tiệm cận xiên của đồ thị hàm số \( y = f(x) \), thì:

\[
\lim_{x \to \pm\infty} [f(x) - (ax + b)] = 0
\]

Do đó:

\[
\lim_{x \to \pm\infty} \left( f(x) - (ax + b) \right) \cdot \frac{1}{x} = 0
\]

Suy ra:

\[
a = \lim_{x \to \pm\infty} \frac{f(x)}{x}, \quad b = \lim_{x \to \pm\infty} [f(x) - ax]
\]

Ngược lại, nếu \( a \) và \( b \) xác định như trên, thì đường thẳng \( y = ax + b \) là một tiệm cận xiên của đồ thị hàm số \( y = f(x) \). Đặc biệt, nếu \( a = 0 \) thì đồ thị hàm số có tiệm cận ngang.


### Bài tập tương tự 
1.Tìm tiệm cận xiên của đồ thị hàm số:

\[
y = f(x) = \frac{x^2 - x + 2}{x + 1}
\]

**Giải:**  
Ta có:

\[
a = \lim_{x \to \pm\infty} \frac{f(x)}{x} = \lim_{x \to \pm\infty} \frac{x^2 - x + 2}{x + 1} = 1
\]

\[
b = \lim_{x \to \pm\infty} (f(x) - x) = \lim_{x \to \pm\infty} \frac{-2x + 2}{x+1} = -2
\]

Vậy đồ thị hàm số có tiệm cận xiên là đường thẳng:

\[
y = x - 2
\]

**Nhận xét:**  
Trong thực hành, để tìm tiệm cận xiên của hàm phân thức trong bài tập trên, ta viết:

\[
y = f(x) = \frac{x^2 - x + 2}{x + 1} = x - 2 + \frac{4}{x + 1}
\]

Do đó:

\[
\lim_{x \to \pm\infty} [f(x) - (x - 2)] = \lim_{x \to \pm\infty} \frac{4}{x + 1} = 0
\]

Suy ra, đồ thị hàm số có tiệm cận xiên là đường thẳng \( y = x - 2 \).

#PHẦN LUYỆN TẬP 
1.Tìm các tiệm cận đứng và tiệm cận xiên của đồ thị hàm số:

\[
y = f(x) = \frac{x^2 - 4x + 2}{1 - x}
\]

![Hình chú ý](images/image1.png)


2.![Hình 1.24](images/Hinh_1.24.png)
Cho hàm số \( y = f(x) = x - 1 + \frac{2}{x+1} \) có đồ thị \( (C) \) và đường thẳng \( y = x - 1 \) như Hình 1.24.  

a) Với \( x \to -1 \), xét điểm \( M(x, f(x)) \) thuộc \( (C) \). Gọi \( H \) là hình chiếu vuông góc của \( M \) trên đường thẳng \( y = x - 1 \). Có nhận xét gì về khoảng cách \( MH \) khi \( x \to +\infty \)?  

b) Chứng tỏ rằng  
\[
\lim_{x \to +\infty} [f(x) - (x - 1)] = 0.
\]
Tính chất này thể hiện trên Hình 1.24 như thế nào?










