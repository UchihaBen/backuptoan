// ForgotPassword.jsx - Trang quên mật khẩu
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isReset, setIsReset] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return false;
    }
    
    return true;
  };

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu mới và xác nhận");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    
    return true;
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email
      });
      
      setSuccess("Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.");
      
      // Trong môi trường dev, có thể hiển thị token để test
      if (response.data.token) {
        setResetToken(response.data.token);
        setIsReset(true);
      }
      
    } catch (error) {
      const message = error.response?.data?.error || "Không thể gửi yêu cầu, vui lòng thử lại sau";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token: resetToken,
        password: newPassword
      });
      
      setSuccess("Mật khẩu đã được đặt lại thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập.");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      const message = error.response?.data?.error || "Không thể đặt lại mật khẩu, vui lòng thử lại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isReset ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {!isReset ? (
          <form onSubmit={handleSendResetEmail}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              className={`w-full p-3 rounded-lg text-white font-bold ${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              className={`w-full p-3 rounded-lg text-white font-bold ${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-500 hover:underline">
            Quay lại đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;