export const colors = {
  background: '#F7F3EE',
  surface: '#FFFFFF',
  surfaceSoft: '#FFF8F0',
  primary: '#8B5E3C',
  primaryDark: '#5B3722',
  primarySoft: '#F1E2D2',
  secondary: '#2F5D50',
  text: '#141414',
  textSoft: '#6B7280',
  border: '#E8DED2',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#10B981',
  muted: '#F3EEE7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: '#2A170B',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#2A170B',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};

export const categoryPalettes = [
  { bg: '#FDEBD3', fg: '#B45309', icon: 'shirt-outline' },
  { bg: '#E0F2FE', fg: '#0369A1', icon: 'phone-portrait-outline' },
  { bg: '#DCFCE7', fg: '#15803D', icon: 'leaf-outline' },
  { bg: '#FCE7F3', fg: '#BE185D', icon: 'heart-outline' },
  { bg: '#EDE9FE', fg: '#6D28D9', icon: 'sparkles-outline' },
  { bg: '#FFE4E6', fg: '#BE123C', icon: 'fast-food-outline' },
];

export const defaultBanners = [
  {
    id: 'summer-sale',
    eyebrow: 'Ưu đãi hôm nay',
    title: 'Sale tới 50%',
    subtitle: 'Mua nhanh sản phẩm hot trong ngày',
    accent: '#FF7A45',
    bg: '#FFF0E8',
    icon: 'flash-outline',
  },
  {
    id: 'seller-week',
    eyebrow: 'Gian hàng nổi bật',
    title: 'Shop mới lên sàn',
    subtitle: 'Khám phá sản phẩm được người bán cập nhật',
    accent: '#2F5D50',
    bg: '#E9F7F2',
    icon: 'storefront-outline',
  },
  {
    id: 'free-ship',
    eyebrow: 'Freeship',
    title: 'Đơn càng gọn, ship càng nhẹ',
    subtitle: 'Thêm vào giỏ và đặt hàng chỉ trong vài giây',
    accent: '#7C3AED',
    bg: '#F1EDFF',
    icon: 'rocket-outline',
  },
];
