import "./styles/global.css";
import DashboardPage from "./features/dashboard/DashboardPage";
import DesktopLayout from "./layouts/DesktopLayout";

export default function App() {
  return (
    <DesktopLayout>
      <DashboardPage />
    </DesktopLayout>
  );
}
