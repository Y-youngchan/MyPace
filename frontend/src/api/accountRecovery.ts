import { apiRequest } from "./client";

export type SignupProfilePayload = {
  user_id: string;
  email: string;
  display_name: string;
  full_name: string;
  nickname: string;
  phone_number: string;
  user_type: "worker" | "student";
};

export type FindEmailPayload = {
  full_name: string;
  phone_number: string;
};

export type VerifyPasswordResetPayload = FindEmailPayload & {
  email: string;
};

export function createSignupProfile(payload: SignupProfilePayload) {
  return apiRequest("/account-recovery/signup-profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function findEmail(payload: FindEmailPayload) {
  return apiRequest<{ emails: string[] }>("/account-recovery/find-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyPasswordReset(payload: VerifyPasswordResetPayload) {
  return apiRequest<{ can_reset: boolean }>("/account-recovery/verify-password-reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
