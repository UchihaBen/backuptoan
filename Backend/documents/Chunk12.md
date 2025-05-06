#CHƯƠNG II

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

#Bài 3: ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ HÀM SỐ  

#PHẦN LÝ THUYẾT

# 1. ĐƯỜNG TIỆM CẬN ĐỨNG

## HĐ2: Nhận biết đường tiệm cận đứng

Cho hàm số \( y = f(x) = \frac{x}{x - 1} \) có đồ thị (C). Với \( x > 1 \), xét điểm \( M(x, f(x)) \) thuộc (C). Gọi \( H \) là hình chiếu vuông góc của \( M \) trên đường thẳng \( x = 1 \).  

![Hình 1.22](images/Hinh_1_22.png)  

a) Tính khoảng cách \( MH \).  
b) Khi \( M \) thay đổi trên (C) sao cho khoảng cách \( MH \) dần đến 0, có nhận xét gì về tung độ của điểm \( M \)?  

🔶 **Định nghĩa:**  
Đường thẳng \( x = x_0 \) gọi là **đường tiệm cận đứng** (gọi tắt là **tiệm cận đứng**) của đồ thị hàm số \( y = f(x) \) nếu một trong các điều kiện sau được thỏa mãn:  
\[
\lim_{x \to x_0^-} f(x) = +\infty, \quad \lim_{x \to x_0^-} f(x) = -\infty.
\]  
\[
\lim_{x \to x_0^+} f(x) = +\infty, \quad \lim_{x \to x_0^+} f(x) = -\infty.
\]  


![Hình 1.23](images/Hinh_1.23.png)

### Ví dụ 3. Tìm tiệm cận đứng của đồ thị hàm số \( y = f(x) = \frac{3 - x}{x + 2} \)

**Giải**  
Ta có:  
\[
\lim_{x \to -2^-} f(x) = \lim_{x \to -2^-} \frac{3 - x}{x + 2} = +\infty.
\]
Tương tự,  
\[
\lim_{x \to -2^+} f(x) = -\infty.
\]
Vậy đồ thị hàm số \( f(x) \) có tiệm cận đứng là đường thẳng \( x = -2 \).


### Bài tập tương tự 
### Ví dụ 4. Tìm tiệm cận đứng của đồ thị hàm số \( y = f(x) = \frac{x^2 + 2}{x} \)

**Giải**  
Ta có:  
\[
\lim_{x \to 0^-} f(x) = \lim_{x \to 0^-} \frac{x^2 + 2}{x} = -\infty.
\]  
Tương tự,  
\[
\lim_{x \to 0^+} f(x) = +\infty.
\]  
Vậy đồ thị hàm số \( f(x) \) có tiệm cận đứng là đường thẳng \( x = 0 \).


#PHẦN LUYỆN TẬP 
1. Tìm các tiệm cận ngang và tiệm cận đứng của đồ thị hàm số \( y = f(x) = \frac{2x + 1}{x - 4} \).

2. Để loại bỏ 1% một loại tảo độc khỏi một hồ nước, người ta ước tính chi phí bỏ ra là  
\[
C(p) = \frac{45p}{100 - p} \quad \text{(triệu đồng)}, \quad 0 \leq p < 100.
\]
Tìm tiệm cận đứng của đồ thị hàm số \( C(p) \) và nêu ý nghĩa thực tiễn của đường tiệm cận này.







