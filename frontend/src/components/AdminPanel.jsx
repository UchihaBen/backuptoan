import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Bảng điều khiển Admin</h1>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center">
        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mr-3">
          {user.username ? user.username.charAt(0).toUpperCase() : "A"}
        </div>
        <div>
          <p className="font-medium">{user.username || "Admin"}</p>
          <p className="text-sm text-gray-600">{user.email || "admin@example.com"}</p>
          <p className="text-xs text-blue-600 font-medium">Quản trị viên</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => navigate("/admin/users")}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center"
        >
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Quản lý người dùng</h3>
            <p className="text-sm text-gray-600">Xem, thêm, xóa và phân quyền người dùng</p>
          </div>
        </button>
        
        <button 
          onClick={() => navigate("/admin/questions")}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center"
        >
          <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Quản lý câu hỏi</h3>
            <p className="text-sm text-gray-600">Tạo, chỉnh sửa, xóa bộ câu hỏi theo chủ đề</p>
          </div>
        </button>
        
        <button 
          onClick={() => navigate("/home")}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center"
        >
          <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Quay lại trang chính</h3>
            <p className="text-sm text-gray-600">Trở về trang chủ ứng dụng</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default AdminPanel; 