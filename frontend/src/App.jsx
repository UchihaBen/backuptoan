import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./pages/Home";
// import QuizPage from "./pages/QuizPage";
// import EssayPage from "./pages/EssayPage";
// import PracticalPage from "./pages/PracticalPage";

import { QuizPage } from "./pages/QuizPage";
import { EssayPage } from "./pages/EssayPage";
import { PracticalPage } from "./pages/PracticalPage";
import { QuizHistoryPage } from "./pages/QuizHistoryPage";
import { QuizAttemptDetailPage } from "./pages/QuizAttemptDetailPage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import QuestionManagementPage from "./pages/QuestionManagementPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import GradeMathPaperPage from "./pages/GradeMathPaperPage";
import TopicsPage from "./pages/TopicsPage";
import QuizSetupPage from "./pages/QuizSetupPage";
import GenerateSlidesPage from "./pages/GenerateSlidesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/quiz-setup" element={<QuizSetupPage />} />
      <Route path="/quiz-history" element={<QuizHistoryPage />} />
      <Route path="/quiz-attempt-detail" element={<QuizAttemptDetailPage />} />
      <Route path="/essay" element={<EssayPage />} />
      <Route path="/practical" element={<PracticalPage />} />
      <Route path="/topics" element={<TopicsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/questions" element={<QuestionManagementPage />} />
      <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
      <Route path="/admin/GradeMathPaperPage" element={<GradeMathPaperPage />} />
      <Route path="/admin/generate-slides" element={<GenerateSlidesPage />} />
    </Routes>
  );
}

export default App;
