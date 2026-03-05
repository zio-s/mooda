export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Mood {
  id: string;
  key: string;
  label: string;
  category: 'atmosphere' | 'purpose' | 'photo';
  emoji?: string;
}

export interface CafeMood {
  moodId: string;
  moodKey: string;
  moodLabel: string;
  moodCategory: string;
  voteCount: number;
}

export interface CafeHour {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
}

export interface CafePhoto {
  id: string;
  url: string;
  caption?: string | null;
  isMain: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  content?: string;
  createdAt: string;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  addressDetail?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  kakaoPlaceId?: string | null;
  kakaoUrl?: string | null;
  instagramUrl?: string | null;
  website?: string | null;
  description?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  avgRating: number;
  reviewCount: number;
  isOpen?: boolean;
  mainPhoto?: string | null;
  photos: CafePhoto[];
  moods: CafeMood[];
  hours: CafeHour[];
  distance?: number;
  isFavorited?: boolean;
  myVotes?: string[]; // 현재 유저가 투표한 moodId 목록
}

export interface NaverBlogPost {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

// ─── Google Places 리뷰 ─────────────────────────────────────────────
export interface GoogleReview {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
  time: number;
  language?: string;
}

export interface GooglePhoto {
  url: string;
  width: number;
  height: number;
  attributions: string[];
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  photos: GooglePhoto[];
  googleRating?: number;
  googleTotalRatings?: number;
}

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  moods?: string[];
  purposes?: string[];
  photoFeatures?: string[];
  openNow?: boolean;
  sort?: 'distance' | 'rating' | 'reviews';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  cafes: Cafe[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

// ─── 대중교통 경로 ──────────────────────────────────────────────────
export interface TransitRoute {
  totalTime: number;
  transferCount: number;
  totalWalk: number;
  fare: number;
  segments: TransitSegment[];
}

export interface TransitSegment {
  type: 'walk' | 'subway' | 'bus';
  walkTime?: number;
  subwayLine?: string;
  subwayColor?: string;
  startStation?: string;
  endStation?: string;
  stationCount?: number;
  sectionTime?: number;
  busNo?: string;
  busType?: string;
  busColor?: string;
  startStop?: string;
  endStop?: string;
  stopCount?: number;
}
