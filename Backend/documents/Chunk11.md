#CHƯƠNG II

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

#Bài 3: ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ HÀM SỐ  

#PHẦN LÝ THUYẾT

# 1. ĐƯỜNG TIỆM CẬN NGANG

## HĐ1: Nhận biết đường tiệm cận ngang

🔶**Định nghĩa:**  
Đường thẳng \( y = y_0 \) gọi là **đường tiệm cận ngang** (gọi tắt là **tiệm cận ngang**) của đồ thị hàm số \( y = f(x) \) nếu:  
\[
\lim_{x \to +\infty} f(x) = y_0 \quad \text{hoặc} \quad \lim_{x \to -\infty} f(x) = y_0.
\]  

Hai trường hợp đường tiệm cận ngang thể hiện qua hình:  

![Hình 1.20](images/Hinh_1_20.png)  


### **Ví dụ 1.** Tìm tiệm cận ngang của đồ thị hàm số \( y = f(x) = \frac{3x - 2}{x + 1} \)  

**Giải**  

Ta có:  
\[
\lim_{x \to +\infty} f(x) = \lim_{x \to +\infty} \frac{3x - 2}{x + 1} = \lim_{x \to +\infty} \frac{3 - \frac{2}{x}}{1 + \frac{1}{x}} = 3.
\]  
Tương tự,  
\[
\lim_{x \to -\infty} f(x) = 3.
\]  
Vậy đồ thị hàm số \( f(x) \) có tiệm cận ngang là đường thẳng \( y = 3 \).  

---
### Bài tập tương tự 
### 1. Tìm các tiệm cận ngang của đồ thị hàm số \( y = f(x) = \frac{\sqrt{x^2 + 1}}{x} \)  

**Giải**  

Ta có:  
\[
\lim_{x \to +\infty} f(x) = \lim_{x \to +\infty} \frac{\sqrt{x^2 + 1}}{x} = \lim_{x \to +\infty} \sqrt{1 + \frac{1}{x^2}} = 1.
\]  
\[
\lim_{x \to -\infty} f(x) = \lim_{x \to -\infty} \frac{\sqrt{x^2 + 1}}{x} = \lim_{x \to -\infty} \sqrt{1 + \frac{1}{x^2}} = -1.
\]  

Vậy đồ thị hàm số \( f(x) \) có hai tiệm cận ngang là \( y = 1 \) và \( y = -1 \).  
Nhận xét: Đồ thị hàm số \( f(x) \) như ![Hình 1.21](images/Hinh_1_21.png).  


#PHẦN LUYỆN TẬP 
1.Tìm tiệm cận ngang của đồ thị hàm số \( y = f(x) = \frac{2x - 1}{x - 1} \).  

2.Vận dụng: Giả sử khối lượng còn lại của một chất phóng xạ (gam) sau t ngày phân rã được cho bởi hàm số:  
\[
m(t) = 15e^{-0,012t}
\]  
Khối lượng \(m(t)\) thay đổi ra sao khi \(t \to +\infty\)? Điều này thể hiện trên ![Hình 1.18](images/Hinh_1_18.png) như thế nào? 

3.Cho hàm số \( y = f(x) = \frac{2x+1}{x} \) có đồ thị (C). Với \( x > 0 \), xét điểm \( M(x, f(x)) \) thuộc (C). Gọi \( H \) là hình chiếu vuông góc của \( M \) trên đường thẳng \( y = 2 \)  
![Hình 1.19](images/Hinh_1_19.png)  
a) Tính khoảng cách \( MH \).  
b) Có nhận xét gì về khoảng cách \( MH \) khi \( x \to +\infty \)?  


