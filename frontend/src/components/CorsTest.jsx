import React, { useState } from 'react';
import { api, ragApi } from '../lib/api';

function CorsTest() {
  const [flaskResult, setFlaskResult] = useState(null);
  const [fastApiResult, setFastApiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFlaskCors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test Flask backend
      const response = await fetch('https://giasutoan-flask.onrender.com/cors-test', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      setFlaskResult(data);
      console.log("Flask CORS test result:", data);
    } catch (err) {
      console.error("Flask CORS test error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testFastApiCors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test FastAPI backend
      const response = await fetch('https://giasutoan-fastapi.onrender.com/cors-test', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      setFastApiResult(data);
      console.log("FastAPI CORS test result:", data);
    } catch (err) {
      console.error("FastAPI CORS test error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">CORS Test Tool</h2>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          onClick={testFlaskCors}
          disabled={loading}
        >
          Test Flask CORS
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={testFastApiCors}
          disabled={loading}
        >
          Test FastAPI CORS
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {flaskResult && (
        <div className="mb-4">
          <h3 className="font-bold">Flask Result:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(flaskResult, null, 2)}
          </pre>
        </div>
      )}
      
      {fastApiResult && (
        <div>
          <h3 className="font-bold">FastAPI Result:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(fastApiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default CorsTest; 