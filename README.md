# 🛒 App Bán Hàng
### Đồ án môn học: Phát triển ứng dụng trên thiết bị di động


> **A mobile commerce application that connects buyers and sellers in one simple, modern, and scalable shopping platform.**

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Frontend-React%20Native%20%2B%20Expo-000020?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge&logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/Version-1.0.0-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-ISC-green?style=for-the-badge" />
</p>

---

## 📌 Overview

**App Bán Hàng** là dự án ứng dụng di động được xây dựng cho đề tài môn học **Phát triển ứng dụng trên thiết bị di động**. Ứng dụng hỗ trợ quy trình mua bán trực tuyến giữa **người mua** và **người bán**, bao gồm các chức năng cốt lõi như đăng ký, đăng nhập, xem sản phẩm, tìm kiếm, quản lý giỏ hàng, đặt hàng, theo dõi đơn hàng, đánh giá sản phẩm và quản lý hoạt động bán hàng.

Hệ thống được thiết kế theo hướng tách biệt giữa **mobile frontend**, **backend API** và **database**, giúp dễ bảo trì, mở rộng và kiểm thử trong quá trình phát triển.

---

## 🎯 Project Goals

Dự án hướng đến việc xây dựng một ứng dụng bán hàng trực tuyến đơn giản nhưng đầy đủ luồng nghiệp vụ chính:

- Tạo nền tảng kết nối giữa người mua và người bán.
- Hỗ trợ người mua tìm kiếm, xem chi tiết, thêm giỏ hàng và đặt hàng.
- Hỗ trợ người bán quản lý sản phẩm, đơn hàng, shop và doanh thu.
- Áp dụng xác thực bằng JWT để bảo vệ các API cần đăng nhập.
- Tổ chức code theo hướng rõ ràng, dễ mở rộng cho các tính năng nâng cao trong tương lai.

---

## ✨ Key Features

### 👤 User Authentication Flow

- Đăng ký tài khoản người mua.
- Đăng ký tài khoản người bán.
- Đăng nhập bằng email và mật khẩu.
- Xác thực người dùng bằng JWT token.
- Phân quyền truy cập theo vai trò:
  - `CUSTOMER`
  - `SELLER`
- Quản lý phiên đăng nhập trên mobile app.

---

### 🛍️ Buyer Flow

- Xem danh sách sản phẩm đang bán.
- Tìm kiếm sản phẩm theo từ khóa.
- Lọc sản phẩm theo danh mục.
- Xem chi tiết sản phẩm:
  - Tên sản phẩm
  - Giá bán
  - Hình ảnh
  - Mô tả
  - Tồn kho
  - Thông tin shop
  - Đánh giá sản phẩm
- Xem thông tin shop và danh sách sản phẩm của shop.
- Thêm sản phẩm vào giỏ hàng.
- Cập nhật số lượng sản phẩm trong giỏ.
- Xóa sản phẩm khỏi giỏ hàng.
- Đặt hàng từ giỏ hàng.
- Theo dõi lịch sử đơn hàng.
- Thanh toán đơn hàng ở mức cơ bản.
- Đánh giá sản phẩm sau khi mua.
- Nhận thông báo khi trạng thái đơn hàng được cập nhật.

---

### 🏪 Seller Flow

- Quản lý hồ sơ cá nhân.
- Quản lý thông tin shop:
  - Tên shop
  - Mô tả shop
  - Trạng thái shop
- Quản lý sản phẩm:
  - Thêm sản phẩm
  - Cập nhật sản phẩm
  - Cập nhật giá bán
  - Cập nhật tồn kho
  - Ẩn sản phẩm
  - Hiện lại sản phẩm
- Quản lý đơn hàng liên quan đến sản phẩm của shop.
- Xem chi tiết đơn hàng.
- Cập nhật trạng thái đơn hàng:
  - Chờ xác nhận
  - Đã xác nhận
  - Đang giao hàng
  - Đã giao thành công
  - Đã hủy
- Nhận thông báo khi sản phẩm có đánh giá mới.
- Xem dashboard thống kê bán hàng:
  - Tổng số sản phẩm
  - Tổng đơn hàng
  - Đơn chờ xử lý
  - Đơn đang giao
  - Đơn đã giao
  - Đơn đã hủy
  - Doanh thu
  - Biểu đồ doanh thu 7 ngày gần nhất
  - Top sản phẩm bán chạy

---

### 🔔 Notification Flow

- Người mua nhận thông báo khi seller cập nhật trạng thái đơn hàng.
- Người bán nhận thông báo khi user đánh giá sản phẩm.
- Hiển thị danh sách thông báo.
- Đếm số thông báo chưa đọc.
- Đánh dấu thông báo đã đọc.
- Hỗ trợ giao diện thông báo trực quan theo từng loại sự kiện.

---

### 👤 Profile Management

- Xem thông tin cá nhân.
- Cập nhật:
  - Họ tên
  - Số điện thoại
  - Địa chỉ
  - Ảnh đại diện
- Upload avatar bằng `multipart/form-data`.
- Tách logic xử lý upload ở backend bằng Multer.

---

## 🧱 Tech Stack & Architecture

### 📱 Mobile Frontend

| Category | Technology |
|---|---|
| Mobile Framework | React Native |
| Runtime / Tooling | Expo |
| Language | JavaScript |
| Navigation | React Navigation |
| State Management | React Context API |
| Storage | AsyncStorage |
| UI Components | React Native Core Components |
| Icons | Expo Vector Icons |
| Styling | StyleSheet API |
| API Communication | Fetch API wrapper |

---

### 🖥️ Backend

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database Driver | mysql2 |
| Authentication | JWT |
| Password Security | bcrypt |
| File Upload | Multer |
| Environment Config | dotenv |
| API Testing | Postman |

---

### 🗄️ Database

| Category | Technology |
|---|---|
| DBMS | MySQL |
| Data Model | Relational Database |
| Main Entities | Users, Products, Categories, Cart, Orders, Order Items, Seller Profiles, Notifications, Reviews |

---

## 🏗️ System Architecture

Dự án được tổ chức theo mô hình **Client - Server Architecture**:

```text
Mobile App (React Native + Expo)
        │
        │ HTTP Request / JSON
        ▼
Backend API (Node.js + Express.js)
        │
        │ SQL Query
        ▼
MySQL Database
