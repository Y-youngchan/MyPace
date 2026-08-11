export function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("ko-KR");
}

export function parseMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits);
}
