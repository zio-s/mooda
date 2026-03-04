import { NextRequest, NextResponse } from 'next/server';
import type { TransitRoute, TransitSegment } from '@/types';

const ODSAY_API_KEY = process.env.ODSAY_API_KEY ?? '';
const ODSAY_BASE = 'https://api.odsay.com/v1/api/searchPubTransPathT';

// ─── 지하철 호선 컬러 맵 ────────────────────────────────────────────
const SUBWAY_COLORS: Record<number, { name: string; color: string }> = {
  1: { name: '1호선', color: '#0052A4' },
  2: { name: '2호선', color: '#00A84D' },
  3: { name: '3호선', color: '#EF7C1C' },
  4: { name: '4호선', color: '#00A5DE' },
  5: { name: '5호선', color: '#996CAC' },
  6: { name: '6호선', color: '#CD7C2F' },
  7: { name: '7호선', color: '#747F00' },
  8: { name: '8호선', color: '#E6186C' },
  9: { name: '9호선', color: '#BDB092' },
  100: { name: '분당선', color: '#F5A200' },
  101: { name: '공항철도', color: '#0090D2' },
  102: { name: '자기부상', color: '#FFB300' },
  104: { name: '경의중앙선', color: '#77C4A3' },
  107: { name: '에버라인', color: '#77C4A3' },
  108: { name: '경춘선', color: '#0C8E72' },
  109: { name: '신분당선', color: '#D4003B' },
  110: { name: '의정부경전철', color: '#FDA600' },
  112: { name: '경강선', color: '#003DA5' },
  113: { name: '우이신설선', color: '#B7C452' },
  114: { name: '서해선', color: '#8FC31F' },
  115: { name: '김포골드라인', color: '#A17E46' },
  116: { name: '수인분당선', color: '#F5A200' },
  117: { name: 'GTX-A', color: '#9A6292' },
  21: { name: '인천1호선', color: '#7CA8D5' },
  22: { name: '인천2호선', color: '#ED8B00' },
  31: { name: '대전1호선', color: '#007448' },
  41: { name: '대구1호선', color: '#D93F5C' },
  42: { name: '대구2호선', color: '#00AA80' },
  43: { name: '대구3호선', color: '#FFB100' },
  51: { name: '광주1호선', color: '#009088' },
  71: { name: '부산1호선', color: '#F06A00' },
  72: { name: '부산2호선', color: '#81BF48' },
  73: { name: '부산3호선', color: '#BB8C00' },
  74: { name: '부산4호선', color: '#217DCB' },
  78: { name: '동해선', color: '#0054A6' },
  79: { name: '부산김해경전철', color: '#8B50A4' },
};

// ─── 버스 타입 맵 ────────────────────────────────────────────────────
const BUS_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '일반', color: '#33CC99' },
  2: { label: '좌석', color: '#33CC99' },
  3: { label: '마을', color: '#53B332' },
  4: { label: '직행좌석', color: '#E60012' },
  5: { label: '공항', color: '#8B4513' },
  6: { label: '간선', color: '#3366CC' },
  7: { label: '외곽', color: '#53B332' },
  10: { label: '마을', color: '#53B332' },
  11: { label: '간선', color: '#3366CC' },
  12: { label: '지선', color: '#53B332' },
  13: { label: '순환', color: '#F2B70A' },
  14: { label: '광역', color: '#E60012' },
  15: { label: '급행', color: '#E60012' },
  26: { label: '급행간선', color: '#E60012' },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseOdsayResponse(data: any): TransitRoute | null {
  const paths = data?.result?.path;
  if (!paths || paths.length === 0) return null;

  // 첫 번째 추천 경로 사용
  const best = paths[0];
  const info = best.info;

  const segments: TransitSegment[] = [];

  for (const sub of best.subPath) {
    const tType = sub.trafficType as number;

    if (tType === 3) {
      // 도보
      if (sub.sectionTime > 0) {
        segments.push({
          type: 'walk',
          walkTime: sub.sectionTime,
        });
      }
    } else if (tType === 1) {
      // 지하철
      const lane = sub.lane?.[0];
      const code = lane?.subwayCode as number;
      const lineInfo = SUBWAY_COLORS[code];

      segments.push({
        type: 'subway',
        subwayLine: lineInfo?.name ?? lane?.name ?? `${code}호선`,
        subwayColor: lineInfo?.color ?? '#666666',
        startStation: sub.startName,
        endStation: sub.endName,
        stationCount: sub.stationCount,
        sectionTime: sub.sectionTime,
      });
    } else if (tType === 2) {
      // 버스
      const lane = sub.lane?.[0];
      const busType = BUS_TYPE_MAP[lane?.type as number];

      segments.push({
        type: 'bus',
        busNo: lane?.busNo ?? '',
        busType: busType?.label ?? '일반',
        busColor: busType?.color ?? '#33CC99',
        startStop: sub.startName,
        endStop: sub.endName,
        stopCount: sub.stationCount,
        sectionTime: sub.sectionTime,
      });
    }
  }

  return {
    totalTime: info.totalTime,
    transferCount: info.busTransitCount + info.subwayTransitCount,
    totalWalk: info.totalWalk,
    fare: info.payment,
    segments,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── GET /api/route/transit?sx=...&sy=...&ex=...&ey=... ─────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sx = searchParams.get('sx'); // 출발 경도
  const sy = searchParams.get('sy'); // 출발 위도
  const ex = searchParams.get('ex'); // 도착 경도
  const ey = searchParams.get('ey'); // 도착 위도

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json(
      { error: 'sx, sy, ex, ey 파라미터가 필요합니다' },
      { status: 400 },
    );
  }

  if (!ODSAY_API_KEY) {
    return NextResponse.json(
      { error: 'ODsay API 키가 설정되지 않았습니다' },
      { status: 500 },
    );
  }

  try {
    const url = `${ODSAY_BASE}?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${encodeURIComponent(ODSAY_API_KEY)}&output=json`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Referer: 'https://semincode.com' },
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.msg ?? '경로를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    const route = parseOdsayResponse(data);
    if (!route) {
      return NextResponse.json(
        { error: '대중교통 경로를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    return NextResponse.json(route);
  } catch (err) {
    console.error('[transit] ODsay API error:', err);
    return NextResponse.json(
      { error: '경로 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
