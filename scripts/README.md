# scripts/

Node 스크립트 모음. `npx tsx scripts/<name>.ts` 로 실행.
`.env` + `.env.local` 자동 로드 (`scripts/lib/env.ts` 공용).

---

## 📁 역할별 분류

### 🌱 Seed — 신규 지역/카페 추가
| 파일 | 설명 |
|---|---|
| `seed-cafes.ts` | 카카오 로컬 API 로 카페 메타(이름·주소·좌표) 수집. `TARGET_AREAS` 에 지역 추가 후 실행. **사진·리뷰는 수집하지 않음** — on-demand 가 처리 |
| `analyze-moods.ts` | 네이버 블로그 키워드 분석 → 카페 무드 태그 재계산. seed 직후 반드시 실행 (seed 는 랜덤 무드를 임시 부여) |

### 🔄 주기적 동기화
| 파일 | 설명 |
|---|---|
| `sync-blogs.ts` | 인기 카페 블로그 새벽 3시 cron |

### 🩺 진단
| 파일 | 설명 |
|---|---|
| `check-photos.ts` | DB 사진 품질 진단 — 커버율·해상도·isMain 정합성·HEAD 성공률. 월 1회 권장 |
| `check-photo-duplicates.ts` | `(cafeId, url)` 중복 검사. 스키마 변경 전 검증 |

### 🏗 빌드
| 파일 | 설명 |
|---|---|
| `generate-pwa-icons.mjs` | PWA 아이콘 자산 |

### 🔧 공용
| 파일 | 설명 |
|---|---|
| `lib/env.ts` | `.env` + `.env.local` 자동 로더 (Next.js 는 자동이지만 Node 스크립트는 수동 필요) |

---

## ⚙️ 사진·리뷰·블로그는 on-demand

카페의 사진·리뷰·블로그는 사용자가 지도·검색·상세에서 방문할 때 자동 수집된다. 스크립트 개입 불필요.

| API route | 역할 |
|---|---|
| `POST /api/cafes/[id]/enrich-images` | 네이버 + Google 사진 on-demand 수집 |
| `GET /api/cafes/[id]/google-reviews` | Google 리뷰/평점 실시간 + 캐시 |
| `GET /api/cafes/[id]/blogs` | 네이버 블로그 실시간 + 캐시 |
| `GET /api/cafes/search` 후속 | 목록 응답 후 썸네일 없는 카페 백그라운드 enrich (≤5개/회) |

관련 lib: `src/lib/image/size.ts` · `src/lib/image/naver-proxy.ts`

---

## 🛟 삭제된 벌크 스크립트 복원

on-demand 이행(2026-04) 으로 다음 벌크 스크립트는 삭제됨:
- `enrich-cafes.ts` — 네이버 이미지/블로그 일괄 수집
- `enrich-google-reviews.ts` — Google placeId 일괄 매칭 + 리뷰/사진
- `fix-naver-thumbnail-urls.ts` — 프록시 URL → 원본 URL 일괄 치환 (T-SCRIPT-04 에서 2,923건 실행 완료)
- `cleanup-failed-thumbnails.ts` — blocklist 기반 치환 실패분 DELETE
- `check-naver-origins.ts` — 프록시→원본 변환 가능성 증명 (one-shot)

필요 시 git 이력에서 복원:
```bash
git log --all --oneline -- scripts/enrich-cafes.ts
git show <hash>:scripts/enrich-cafes.ts > scripts/enrich-cafes.ts
```

---

## 📊 리포트 디렉터리

`scripts/reports/` 는 `.gitignore` 대상. 진단 스크립트가 JSON 리포트를 저장하는 위치.
