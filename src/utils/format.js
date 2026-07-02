export function formatPrice(amount) {
  const value = Number(amount) || 0;
  return `$${value.toFixed(2)}`;
}
