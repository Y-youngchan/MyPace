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
import ProfilePage from "./features/auth/ProfilePage";
import ProfileSetupPage from "./features/auth/ProfileSetupPage";
import ProfileCompletionRoute from "./features/auth/ProfileCompletionRoute";
import DesktopLayout from "./layouts/DesktopLayout";
import BudgetsPage from "./pages/BudgetsPage";
import CalendarPage from "./pages/CalendarPage";
import CategoriesPage from "./pages/CategoriesPage";
import IncomePage from "./pages/IncomePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import TransactionsPage from "./pages/TransactionsPage";

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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
