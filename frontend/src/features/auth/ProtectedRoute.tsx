import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { isDevDashboardAccessEnabled } from "./devAccess";

export default function ProtectedRoute() {
  const { isPreviewMode, loading, session } = useAuth();

  if (loading) {
    return <p>로그인 상태를 확인하고 있습니다.</p>;
  }

  if (session === null && !isPreviewMode && !isDevDashboardAccessEnabled()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
