export function formatAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("already") ||
    lowerMessage.includes("registered") ||
    lowerMessage.includes("exists") ||
    lowerMessage.includes("duplicate")
  ) {
    return "이미 존재하는 이메일입니다.";
  }

  if (lowerMessage.includes("invalid login")) {
    return "이메일 또는 비밀번호를 확인해주세요.";
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many") || lowerMessage.includes("429")) {
    return "이메일 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }

  if (lowerMessage.includes("sending confirmation") || lowerMessage.includes("send confirmation")) {
    return "가입 확인 메일 발송에 실패했습니다. Supabase 이메일 설정을 확인해주세요.";
  }

  if (lowerMessage.includes("signups are disabled") || lowerMessage.includes("signup disabled")) {
    return "이메일 회원가입이 꺼져 있습니다. Supabase 이메일 로그인 설정을 확인해주세요.";
  }

  return `인증 처리 중 문제가 발생했습니다. Supabase 메시지: ${message}`;
}
