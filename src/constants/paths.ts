export const PATHS = {
  // 공개 페이지
  Home: '/',
  Map: '/map',
  CafeDetail: (id: string) => `/cafes/${id}`,

  // 인증
  Login: '/login',
  Signup: '/signup',

  // 로그인 필요
  Profile: '/profile',
  Favorites: '/profile/favorites',
  Collections: '/profile/collections',
  CollectionDetail: (id: string) => `/profile/collections/${id}`,

  // 관리자
  Admin: '/admin',
  AdminCafes: '/admin/cafes',
  AdminReports: '/admin/reports',
} as const;
