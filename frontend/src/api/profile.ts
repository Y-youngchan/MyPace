import { apiRequest } from "./client";

export type ProfilePayload = {
  display_name: string;
  full_name: string;
  nickname: string;
  phone_number: string;
  user_type: "worker" | "student";
};

export type ProfileResponse = ProfilePayload & {
  user_id: string;
  nickname_tag: string;
  email: string | null;
  primary_auth_provider: "email" | "google" | "kakao";
  auth_providers: Array<"email" | "google" | "kakao">;
};

export function getProfile() {
  return apiRequest<ProfileResponse>("/profile");
}

export function saveProfile(payload: ProfilePayload) {
  return apiRequest<ProfileResponse>("/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
