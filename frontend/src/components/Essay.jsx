// EssayPage.jsx - Trang làm bài tự luận
import { useState } from "react";

function EssayPage() {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    alert(`Bài làm đã nộp: \n${answer}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Viết một đoạn văn ngắn về lợi ích của toán học.</h2>
      <textarea
        className="w-full p-2 border mt-2"
        rows="5"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      ></textarea>
      <button className="mt-4 p-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>Nộp bài</button>
    </div>
  );
}

export { EssayPage };