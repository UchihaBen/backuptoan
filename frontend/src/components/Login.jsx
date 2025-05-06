import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password
      });
      
      // Lưu token và thông tin người dùng vào localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Redirect to home page
      navigate("/home");
    } catch (error) {
      const message = error.response?.data?.error || "Đăng nhập thất bại, vui lòng thử lại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Tên đăng nhập
            </label>
            <input 
              id="username"
              type="text" 
              placeholder="Tên đăng nhập" 
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="Mật khẩu" 
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            className={`w-full p-3 rounded-lg text-white font-bold ${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/register" className="text-blue-500 hover:underline">Đăng ký tài khoản mới</a>
          <span className="mx-2 text-gray-500">|</span>
          <a href="/forgot-password" className="text-blue-500 hover:underline">Quên mật khẩu?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
