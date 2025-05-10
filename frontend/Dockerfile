FROM node:22.14.0-alpine

WORKDIR /app

# Sao chép package files và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Sao chép toàn bộ mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Sử dụng nginx để phục vụ các file tĩnh
FROM nginx:alpine

# Sao chép output của quá trình build vào nginx
COPY --from=0 /app/dist /usr/share/nginx/html

# Sao chép cấu hình nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 