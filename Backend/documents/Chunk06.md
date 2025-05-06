#CHƯƠNG I

#ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ

# Bài 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ

#PHẦN LÝ THUYẾT

## 2. CỰC TRỊ CỦA HÀM SỐ

### b) Cách tìm cực trị của hàm số

#### HĐ5: Nhận biết cách tìm cực trị của hàm số

Cho hàm số \( y = \frac{1}{3}x^3 - 3x^2 + 8x + 1 \).

a) Tính đạo hàm \( f'(x) \) và tìm các điểm mà tại đó đạo hàm \( f'(x) = 0 \).  
b) Lập bảng biến thiên của hàm số.  
c) Từ bảng biến thiên suy ra các cực trị của hàm số.


## 🔎 ĐỊNH LÝ

Giả sử hàm số \( y = f(x) \) liên tục trên khoảng \( (a; b) \) chứa điểm \( x_0 \), và có đạo hàm trên các khoảng \( (a; x_0) \) và \( (x_0; b) \).

a) Nếu \( f'(x) \) **đổi dấu từ dương sang âm** tại \( x_0 \), thì \( f(x) \) đạt **cực đại** tại \( x_0 \).  
b) Nếu \( f'(x) \) **đổi dấu từ âm sang dương** tại \( x_0 \), thì \( f(x) \) đạt **cực tiểu** tại \( x_0 \).

📌 _Định lý này giúp xác định các điểm cực trị của hàm số dựa vào dấu của đạo hàm._

### ❓ Giải thích vì sao nếu \( f'(x) \) không đổi dấu khi \( x \) qua \( x_0 \), thì \( x_0 \) không phải là điểm cực trị của hàm số \( f(x) \)?

Định lý trên được viết gọn lại trong hai bảng biến thiên sau:

![Bảng biến thiên - Cực tiểu và cực đại](images/minhhoa_trang11_05.png)


### 🔎 Chú ý

Từ định lý trên ta có các bước tìm cực trị của hàm số \( y = f(x) \) như sau:

1. Tìm tập xác định của hàm số.
2. Tính đạo hàm \( f'(x) \). Tìm các điểm mà tại đó đạo hàm \( f'(x) = 0 \) hoặc đạo hàm không tồn tại.
3. Lập bảng biến thiên của hàm số.
4. Từ bảng biến thiên suy ra các cực trị của hàm số.

## 🔎 Ví dụ 6: Tìm cực trị của hàm số \( y = x^3 - 6x^2 + 9x + 30 \).

### **Giải**

Tập xác định của hàm số: \( \mathbb{R} \).

\[
y' = 3x^2 - 12x + 9
\]

Giải phương trình \( y' = 0 \):

\[
3(x^2 - 4x + 3) = 0 \Rightarrow x = 1 \text{ hoặc } x = 3.
\]

Lập bảng biến thiên của hàm số:

![Bảng biến thiên - Ví dụ 6](images/minhhoa_trang11_06.png)

Từ bảng biến thiên, ta có:

- Hàm số đạt **cực đại** tại \( x = 1 \) với \( y\_{CĐ} = y(1) = 34 \).
- Hàm số đạt **cực tiểu** tại \( x = 3 \) với \( y\_{CT} = y(3) = 30 \).

### 🔎 Chú ý

Nếu \( f'(x) = 0 \), nhưng \( f'(x) \) không đổi dấu khi \( x \) qua điểm đó, thì **không phải là điểm cực trị** của hàm số.  
📌 _Chẳng hạn, hàm số \( y = x^3 \) có \( f'(0) = 3x^2 \), nhưng \( f'(x) \) không đổi dấu tại \( x = 0 \), do đó \( x = 0 \) không phải là điểm cực trị của hàm số._

![Hình 1.10](images/Hinh_1_10.png)

## 🔎 Ví dụ 8: Tìm cực trị của hàm số \( y = \frac{x}{x - 1} \).

### **Giải**

Tập xác định của hàm số: \( \mathbb{R} \setminus \{1\} \).

\[
y' = \frac{(x - 1) - x}{(x - 1)^2} = \frac{-1}{(x - 1)^2} < 0, \quad \forall x \neq 1.
\]

Lập bảng biến thiên của hàm số:

![Bảng biến thiên - Ví dụ 8](images/minhhoa_trang12_08.png)

Từ bảng biến thiên suy ra **hàm số không có cực trị**.

## Bài tập tương tự 
Tìm cực trị của hàm số \( y = \frac{x^2 - 2x + 9}{x - 2} \).

**Giải**  

Tập xác định của hàm số là \( \mathbb{R} \setminus \{2\} \).

Ta có:  
\[
y' = \frac{(2x - 2)(x - 2) - (x^2 - 2x + 9)}{(x - 2)^2} = \frac{x^2 - 4x - 5}{(x - 2)^2}
\]
Giải \( y' = 0 \), ta được:  
\[
y' = 0 \Leftrightarrow x = -1 \text{ hoặc } x = 5.
\]

Lập bảng biến thiên của hàm số:

![Bảng biến thiên](images/minhhoa_trang12_07.png)

Từ bảng biến thiên, ta có:

- Hàm số đạt **cực đại** tại \( x = -1 \) với \( y\_{CĐ} = y(-1) = -4 \).
- Hàm số đạt **cực tiểu** tại \( x = 5 \) với \( y\_{CT} = y(5) = 8 \).

#PHẦN LUYỆN TẬP
1.1 Tìm cực trị của các hàm số sau:
a) \( y = -x^3 - 3x^2 + x \).  
b) \( y = \frac{-x^2 + 2x - 1}{x - 2} \).

---

1.2 **🔎 Vận dụng 2** Một vật được phóng thẳng đứng lên trên từ độ cao 2 m với vận tốc ban đầu là 24,5 m/s.  
📌 _Trong Vật lý, ta biết rằng khi bỏ qua sức cản không khí thì độ cao \( h \) (mét) của vật tại thời gian \( t \) (giây) được cho bởi công thức:_

\[
h(t) = 2 + 24,5t - 4,9t^2.
\]

Hỏi tại thời điểm nào thì vật đạt độ cao lớn nhất?

