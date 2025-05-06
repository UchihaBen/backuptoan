import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanel from "../components/AdminPanel";

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Kiểm tra quyền admin khi component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Nếu chưa đăng nhập, chuyển về trang login
      navigate("/login");
      return;
    }
    
    // Kiểm tra người dùng có quyền admin hay không
    if (user && user.role === "admin") {
      setIsAdmin(true);
    } else {
      // Nếu không phải admin, chuyển về trang home
      navigate("/home");
    }
    
    setLoading(false);
  }, [navigate]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
    </div>
  );
}

export default AdminPage; 