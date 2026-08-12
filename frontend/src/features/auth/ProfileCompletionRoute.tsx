import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getProfile } from "../../api/profile";
import type { ProfileResponse } from "../../api/profile";
import { useAuth } from "./AuthProvider";
import { isDevDashboardAccessEnabled } from "./devAccess";

type ProfileCheckState = "checking" | "complete" | "needs-setup";

export default function ProfileCompletionRoute() {
  const { isPreviewMode, session, user } = useAuth();
  const [state, setState] = useState<ProfileCheckState>("checking");

  useEffect(() => {
    let mounted = true;

    if (isPreviewMode || isDevDashboardAccessEnabled() || session === null || isSocialAuthUser(user)) {
      setState("complete");
      return;
    }

    getProfile()
      .then((profile) => {
        if (!mounted) {
          return;
        }
        setState(isProfileComplete(profile) ? "complete" : "needs-setup");
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setState("needs-setup");
          return;
        }
        setState("needs-setup");
      });

    return () => {
      mounted = false;
    };
  }, [isPreviewMode, session, user]);

  if (state === "checking") {
    return <p>프로필 정보를 확인하고 있습니다.</p>;
  }

  if (state === "needs-setup") {
    return <Navigate to="/profile-setup" replace />;
  }

  return <Outlet />;
}

function isProfileComplete(profile: ProfileResponse) {
  return Boolean(profile.full_name.trim() && profile.nickname.trim() && profile.phone_number.trim());
}

function isSocialAuthUser(user: ReturnType<typeof useAuth>["user"]) {
  const provider = user?.app_metadata?.provider;
  return provider === "google" || provider === "kakao";
}
