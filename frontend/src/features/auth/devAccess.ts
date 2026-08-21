const DEV_DASHBOARD_ACCESS_KEY = "mypace_dev_dashboard_access";

export function canUseDevDashboardAccess() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_DASHBOARD === "true";
}

export function enableDevDashboardAccess() {
  if (!canUseDevDashboardAccess()) {
    return;
  }
  window.localStorage.setItem(DEV_DASHBOARD_ACCESS_KEY, "true");
}

export function isDevDashboardAccessEnabled() {
  return canUseDevDashboardAccess() && window.localStorage.getItem(DEV_DASHBOARD_ACCESS_KEY) === "true";
}

export function disableDevDashboardAccess() {
  window.localStorage.removeItem(DEV_DASHBOARD_ACCESS_KEY);
}
