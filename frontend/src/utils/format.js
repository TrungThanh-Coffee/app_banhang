export function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export function getInitials(name) {
  if (!name) return 'U';
  return String(name).trim().slice(0, 1).toUpperCase();
}
