type MoneyTextProps = {
  amount: number;
};

export default function MoneyText({ amount }: MoneyTextProps) {
  return <>{amount.toLocaleString("ko-KR")}원</>;
}
