// ForgotPassword.jsx - Forgot password page
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from '../config';

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
      setError("Please enter your email");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return false;
    }
    
    return true;
  };

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      setError("Please enter new password and confirmation");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
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
      const response = await axios.post(`${config.apiEndpoints.auth}/forgot-password`, {
        email
      });
      
      setSuccess("Password reset request has been sent. Please check your email.");
      
      // Trong môi trường dev, có thể hiển thị token để test
      if (response.data.token) {
        setResetToken(response.data.token);
        setIsReset(true);
      }
      
    } catch (error) {
      const message = error.response?.data?.error || "Unable to send request, please try again later";
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
      const response = await axios.post(`${config.apiEndpoints.auth}/reset-password`, {
        token: resetToken,
        password: newPassword
      });
      
      setSuccess("Password has been reset successfully! You will be redirected to the login page.");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      const message = error.response?.data?.error || "Unable to reset password, please try again";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isReset ? "Reset Password" : "Forgot Password"}
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
                placeholder="Enter your email"
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
              {isLoading ? "Processing..." : "Send Request"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
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
              {isLoading ? "Processing..." : "Reset Password"}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-500 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;