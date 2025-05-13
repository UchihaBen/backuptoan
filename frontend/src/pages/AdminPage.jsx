import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanel from "../components/AdminPanel";

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check admin permissions when component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    if (!token) {
      // If not logged in, redirect to login page
      navigate("/login");
      return;
    }
    
    // Check if user has admin role
    if (user && user.role === "admin") {
      setIsAdmin(true);
    } else {
      // If not admin, redirect to home page
      navigate("/home");
    }
    
    setLoading(false);
  }, [navigate]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
    </div>
  );
}

export default AdminPage; 