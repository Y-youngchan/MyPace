const DEV_DASHBOARD_ACCESS_KEY = "mypace_dev_dashboard_access";

export function enableDevDashboardAccess() {
  if (!import.meta.env.DEV) {
    return;
  }
  window.localStorage.setItem(DEV_DASHBOARD_ACCESS_KEY, "true");
}

export function isDevDashboardAccessEnabled() {
  return import.meta.env.DEV && window.localStorage.getItem(DEV_DASHBOARD_ACCESS_KEY) === "true";
}

export function disableDevDashboardAccess() {
  window.localStorage.removeItem(DEV_DASHBOARD_ACCESS_KEY);
}
