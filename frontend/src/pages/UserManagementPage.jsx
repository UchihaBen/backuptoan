import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from '../config';

function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  
  // Token from localStorage
  const token = localStorage.getItem("token");
  
  // Fetch user list when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.apiEndpoints.admin}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUsers(response.data.users);
    } catch (err) {
      console.error("Error fetching user list:", err);
      setError("Could not fetch user list");
    } finally {
      setLoading(false);
    }
  };
  
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      await axios.delete(`${config.apiEndpoints.admin}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Could not delete user");
    }
  };
  
  const toggleAdminRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    try {
      await axios.patch(`${config.apiEndpoints.admin}/users/${userId}/role`, 
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error("Error changing user role:", err);
      alert("Could not change user role");
    }
  };
  
  const toggleExpandUser = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button 
          onClick={() => navigate("/admin")}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && users.length === 0 && (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
      
      <div className="space-y-4">
        {users.map(user => (
          <div 
            key={user._id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div 
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpandUser(user._id)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold mr-3">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium">{user.username}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ml-2 transition-transform ${expandedUser === user._id ? 'transform rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedUser === user._id && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 gap-2 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">ID:</span>
                    <p className="text-sm">{user._id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created on:</span>
                    <p className="text-sm">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                      user.role === "admin" 
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                    onClick={() => toggleAdminRole(user._id, user.role)}
                  >
                    {user.role === "admin" ? "Remove admin rights" : "Grant admin rights"}
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                    onClick={() => deleteUser(user._id)}
                  >
                    Delete user
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagementPage; 