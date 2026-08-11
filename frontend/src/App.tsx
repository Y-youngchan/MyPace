import "./styles/global.css";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import SignupPage from "./features/auth/SignupPage";
import FindEmailPage from "./features/auth/FindEmailPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import UpdatePasswordPage from "./features/auth/UpdatePasswordPage";
import AuthCallbackPage from "./features/auth/AuthCallbackPage";
import ProfileSetupPage from "./features/auth/ProfileSetupPage";
import ProfileCompletionRoute from "./features/auth/ProfileCompletionRoute";
import DesktopLayout from "./layouts/DesktopLayout";
import BudgetsPage from "./pages/BudgetsPage";
import CalendarPage from "./pages/CalendarPage";
import IncomePage from "./pages/IncomePage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-email" element={<FindEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DesktopLayout />}>
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route element={<ProfileCompletionRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/transactions" element={<PlaceholderPage title="거래내역" description="합성 거래 데이터와 직접 입력 거래를 확인하는 화면이에요." />} />
            <Route path="/analytics" element={<PlaceholderPage title="분석" description="소비 변화와 카테고리별 흐름을 보는 화면이에요." />} />
            <Route path="/reports" element={<PlaceholderPage title="리포트" description="월간 소비 리포트와 PDF 다운로드를 준비하는 화면이에요." />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
