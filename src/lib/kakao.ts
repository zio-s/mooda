const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const KAKAO_LOCAL_API_BASE = 'https://dapi.kakao.com/v2/local';

export interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  category_name: string;
  x: string;
  y: string;
}

export interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export async function searchCafes(
  query: string,
  page = 1
): Promise<KakaoSearchResponse> {
  const params = new URLSearchParams({
    query,
    category_group_code: 'CE7',
    page: page.toString(),
    size: '15',
  });

  const res = await fetch(
    `${KAKAO_LOCAL_API_BASE}/search/keyword.json?${params}`,
    {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    }
  );

  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`);
  return res.json();
}

export async function searchCafesByCategory(
  lat: number,
  lng: number,
  radius = 2000,
  page = 1
): Promise<KakaoSearchResponse> {
  const params = new URLSearchParams({
    category_group_code: 'CE7',
    x: lng.toString(),
    y: lat.toString(),
    radius: radius.toString(),
    page: page.toString(),
    size: '15',
    sort: 'distance',
  });

  const res = await fetch(
    `${KAKAO_LOCAL_API_BASE}/search/category.json?${params}`,
    {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    }
  );

  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`);
  return res.json();
}
