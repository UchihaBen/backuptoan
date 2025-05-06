// PracticalPage.jsx - Trang bài tập thực hành
import { useState } from "react";

function PracticalPage() {
  const [code, setCode] = useState("console.log('Hello, world!');");
  
  const handleRun = () => {
    alert(`Chạy mã: \n${code}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Viết đoạn mã in ra "Hello, world!".</h2>
      <textarea
        className="w-full p-2 border mt-2"
        rows="5"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      ></textarea>
      <button className="mt-4 p-2 bg-blue-500 text-white rounded" onClick={handleRun}>Chạy mã</button>
    </div>
  );
}

export { PracticalPage };