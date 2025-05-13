import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api"; // Thay đổi import ở đây

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
      setError("Please enter username and password");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      // Sử dụng api instance thay vì axios trực tiếp
      const response = await api.post("/api/auth/login", {
        username,
        password
      });
      
      // Lưu token và thông tin người dùng vào localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Redirect to home page
      navigate("/home");
    } catch (error) {
      const message = error.response?.data?.error || "Login failed, please try again";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input 
              id="username"
              type="text" 
              placeholder="Enter username" 
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="Enter password" 
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
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/register" className="text-blue-500 hover:underline">Register new account</a>
          <span className="mx-2 text-gray-500">|</span>
          <a href="/forgot-password" className="text-blue-500 hover:underline">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;