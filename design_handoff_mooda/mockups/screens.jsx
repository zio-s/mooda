/* Mooda 리디자인 모바일 화면 — amber 톤 유지, 네이버맵 감성 참고 */
/* global: IOSDevice, IOSStatusBar */

const M = {
  brand: '#b45309',
  brandInk: '#78350f',
  brandTint: '#fef7ed',
  brandSoft: '#fde4b8',
  ink: { 900: '#1c1917', 700: '#44403c', 500: '#78716c', 400: '#a8a29e', 300: '#d6d3d1', 200: '#e7e5e4', 100: '#f5f5f4', 50: '#fafaf9' },
  bg: '#fcfbf8',
  naver: '#03c75a',
  blue: '#0284c7',
  yellow: '#fbbf24',
};

// ─── Shared: tiny icons (inline svg) ───────────────────────
const I = {
  search: (s=18,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  x: (s=18,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  mic: (s=16,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>,
  filter: (s=16,c=M.ink[700]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>,
  list: (s=16,c=M.ink[700]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  map: (s=16,c=M.ink[700]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>,
  star: (s=12,c=M.yellow,f=true) => <svg width={s} height={s} viewBox="0 0 24 24" fill={f?c:"none"} stroke={c} strokeWidth="2"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"/></svg>,
  pin: (s=12,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  nav: (s=16,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  heart: (s=18,c=M.ink[700],f=false) => <svg width={s} height={s} viewBox="0 0 24 24" fill={f?"#ef4444":"none"} stroke={f?"#ef4444":c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>,
  back: (s=22,c=M.ink[900]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  share: (s=18,c=M.ink[700]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/></svg>,
  plus: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  minus: (s=14,c=M.ink[900]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  phone: (s=14,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>,
  clock: (s=14,c=M.ink[500]) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  bus: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M5 11h14M8 19v2M16 19v2"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>,
  check: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  sparkle: (s=12,c=M.brand) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/></svg>,
};

// ─── Fake map background ─────────────────────────────
function MapBg({ height = 500, dim = false }) {
  // stylized naver-map-ish: roads, blocks, water
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: dim ? '#e8e6e0' : '#edeae1',
      overflow: 'hidden',
    }}>
      <svg width="100%" height={height} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        {/* land blocks */}
        <rect x="0" y="0" width="400" height="700" fill={dim ? "#e8e6e0" : "#edeae1"}/>
        {/* parks */}
        <path d="M40 120 L110 110 L130 200 L50 210 Z" fill="#d9e5c9"/>
        <path d="M260 440 L340 430 L360 520 L290 530 Z" fill="#d9e5c9"/>
        {/* river */}
        <path d="M-20 400 Q 80 420 180 380 T 420 410 L 420 460 Q 310 450 200 470 T -20 460 Z" fill="#c6dbe6"/>
        {/* road grid */}
        {[90, 180, 270, 360, 450, 540, 630].map(y => (
          <line key={'h'+y} x1="-20" y1={y} x2="420" y2={y} stroke="#fff" strokeWidth="3"/>
        ))}
        {[50, 130, 210, 290, 370].map(x => (
          <line key={'v'+x} x1={x} y1="-20" x2={x} y2="720" stroke="#fff" strokeWidth="3"/>
        ))}
        {/* main road */}
        <path d="M-20 280 L 420 260" stroke="#f4d68a" strokeWidth="10"/>
        <path d="M-20 280 L 420 260" stroke="#fff" strokeWidth="1.2" strokeDasharray="6 6"/>
        {/* subway station */}
        <circle cx="180" cy="330" r="8" fill="#fff" stroke={M.brand} strokeWidth="3"/>
        <text x="195" y="336" fontSize="11" fill={M.ink[700]} fontWeight="600">성수</text>
        {/* labels */}
        <text x="70" y="170" fontSize="10" fill="#7a9255" fontWeight="600">서울숲</text>
        <text x="310" y="485" fontSize="10" fill="#7a9255" fontWeight="600">뚝섬공원</text>
        <text x="180" y="440" fontSize="11" fill="#5c8aa8" fontWeight="600">한강</text>
        <text x="250" y="245" fontSize="9" fill={M.ink[500]}>성수이로</text>
      </svg>
    </div>
  );
}

// ─── Pin marker (Naver-style) ───────────────────
function Pin({ x, y, selected, label, price, onClick }) {
  const w = selected ? 'auto' : (label ? 'auto' : 24);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
      zIndex: selected ? 10 : 3,
    }} onClick={onClick}>
      {label ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: selected ? '6px 10px' : '4px 8px',
          background: selected ? M.brand : '#fff',
          color: selected ? '#fff' : M.ink[900],
          border: `1.5px solid ${selected ? M.brand : M.ink[300]}`,
          borderRadius: 999,
          fontSize: selected ? 12 : 11.5, fontWeight: 600,
          boxShadow: selected ? '0 4px 12px rgba(180,83,9,0.35)' : '0 2px 6px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
          position: 'relative',
        }}>
          {selected && I.star(10, '#fbbf24', true)}
          {label}
          {/* pointer tail */}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 8, height: 8,
            background: selected ? M.brand : '#fff',
            borderRight: `1.5px solid ${selected ? M.brand : M.ink[300]}`,
            borderBottom: `1.5px solid ${selected ? M.brand : M.ink[300]}`,
          }}/>
        </div>
      ) : (
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: M.brand, border: '2.5px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}/>
      )}
    </div>
  );
}

// ─── Cluster marker ─────────────────
function Cluster({ x, y, n }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(180,83,9,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: M.brand, color: '#fff',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(180,83,9,0.4)',
        }}>{n}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 1: 지도 메인 (Naver-style: 검색 오버레이 + 칩 + 바텀시트 peek)
// ═══════════════════════════════════════════════════════════
function MapScreen() {
  return (
    <IOSDevice width={390} height={844}>
      <div style={{ height: '100%', width: '100%', position: 'relative', background: '#edeae1', overflow: 'hidden' }}>
        {/* Map */}
        <MapBg height={844}/>

        {/* ── Top: floating search bar (overlays map — Naver style) ── */}
        <div style={{
          position: 'absolute', top: 56, left: 12, right: 12, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Search pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 48, padding: '0 14px 0 16px',
            background: '#fff', borderRadius: 24,
            boxShadow: '0 2px 14px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)',
          }}>
            {I.search(18, M.ink[500])}
            <div style={{ flex: 1, fontSize: 15, color: M.ink[400] }}>성수동 조용한 카페</div>
            {I.mic(18, M.ink[400])}
            <div style={{ width: 1, height: 20, background: M.ink[200] }}/>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: M.brandTint,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, color: M.brandInk,
            }}>지</div>
          </div>

          {/* Filter chips scroll */}
          <div style={{
            display: 'flex', gap: 6, overflow: 'hidden',
            padding: '2px 2px',
          }}>
            {[
              { label: '필터', icon: I.filter(13, '#fff'), active: true, bg: M.brand },
              { label: '☕ 조용한', active: false },
              { label: '💻 노트북', active: false },
              { label: '🪟 통창', active: false },
              { label: '🍰 디저트', active: false },
            ].map((c, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 32, padding: c.active ? '0 12px' : '0 11px',
                background: c.bg || '#fff',
                color: c.active ? '#fff' : M.ink[900],
                border: c.active ? 'none' : `0.5px solid ${M.ink[300]}`,
                borderRadius: 16,
                fontSize: 12.5, fontWeight: 600,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {c.icon}
                {c.label}
                {i === 0 && <span style={{
                  background: '#fff', color: M.brand, borderRadius: 8,
                  minWidth: 14, height: 14, fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', marginLeft: 2,
                }}>2</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Map pins ── */}
        <Pin x={110} y={280} label="슬로우커피"/>
        <Pin x={220} y={340} label="로우키" selected/>
        <Pin x={310} y={290} label="글로우"/>
        <Pin x={80} y={440}/>
        <Pin x={180} y={480}/>
        <Cluster x={300} y={500} n={7}/>

        {/* ── Right side: zoom + locate stack ── */}
        <div style={{
          position: 'absolute', right: 12, top: 180, zIndex: 15,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.plus(16, M.ink[900])}</div>
            <div style={{ height: 1, background: M.ink[200] }}/>
            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.minus(16, M.ink[900])}</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5"/>
            </svg>
          </div>
        </div>

        {/* ── "이 지역 재검색" floating chip ── */}
        <div style={{
          position: 'absolute', top: 180, left: '50%', transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          background: M.ink[900], color: '#fff',
          borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9M3 4v5h5"/></svg>
          이 지역 재검색
        </div>

        {/* ── Bottom sheet peek (selected cafe) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25,
          background: '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: '0 -6px 24px rgba(0,0,0,0.12)',
          paddingBottom: 40,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: M.ink[300] }}/>
          </div>

          <div style={{ padding: '8px 18px 18px', display: 'flex', gap: 12 }}>
            {/* Photo */}
            <div style={{
              width: 92, height: 92, borderRadius: 14,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${M.brandSoft}, ${M.brandTint})`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(180,83,9,0.08) 10px, rgba(180,83,9,0.08) 11px)',
              }}/>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>☕</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: M.ink[900], letterSpacing: '-0.01em' }}>로우키 커피</div>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 6px', borderRadius: 4,
                      background: '#ecfdf5', color: '#15803d',
                    }}>영업중</div>
                  </div>
                  <div style={{ fontSize: 12, color: M.ink[500], marginBottom: 4 }}>카페 · 성수동1가 · 350m</div>
                </div>
                <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {I.heart(18, M.ink[400])}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                {I.star(13)} <span style={{ fontSize: 13, fontWeight: 700 }}>4.7</span>
                <span style={{ fontSize: 12, color: M.ink[500] }}>(182)</span>
                <span style={{ color: M.ink[300], margin: '0 2px' }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: M.ink[700] }}>
                  {I.bus(12, M.blue)} 15분
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['조용한', '통창/뷰', '노트북'].map(t => (
                  <span key={t} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 10,
                    background: M.brandTint, color: M.brandInk, fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '0 18px', display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, height: 44, borderRadius: 12,
              background: M.brand, color: '#fff',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>상세보기</button>
            <button style={{
              width: 44, height: 44, borderRadius: 12,
              background: M.ink[100], color: M.ink[700],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{I.nav(16, M.ink[700])}</button>
            <button style={{
              width: 44, height: 44, borderRadius: 12,
              background: M.ink[100], color: M.ink[700],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{I.share(16, M.ink[700])}</button>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 2: 검색 — full-screen focused input
// ═══════════════════════════════════════════════════════════
function SearchScreen() {
  return (
    <IOSDevice width={390} height={844}>
      <div style={{ height: '100%', background: '#fff', paddingTop: 54 }}>
        {/* Header: back + input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px 12px',
          borderBottom: `1px solid ${M.ink[200]}`,
        }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {I.back()}
          </div>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            height: 40, padding: '0 14px',
            background: M.ink[100], borderRadius: 20,
            border: `1.5px solid ${M.brand}`,
          }}>
            {I.search(16, M.ink[700])}
            <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: M.ink[900] }}>
              성수<span style={{
                display: 'inline-block', width: 1.5, height: 16, background: M.brand,
                verticalAlign: 'middle', marginLeft: 1,
              }}/>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: M.ink[300], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {I.x(10, '#fff')}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: '4px 0' }}>
          {/* Recent section */}
          <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: M.ink[500], letterSpacing: '0.02em' }}>최근 검색</div>
            <div style={{ fontSize: 12, color: M.ink[400] }}>전체 삭제</div>
          </div>
          {[
            { name: '성수 감성카페', meta: '12/15' },
            { name: '홍대 노트북 카페', meta: '12/13' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: M.ink[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {I.clock(14, M.ink[500])}
              </div>
              <div style={{ flex: 1, fontSize: 14.5, color: M.ink[900] }}>{r.name}</div>
              <div style={{ fontSize: 11, color: M.ink[400] }}>{r.meta}</div>
              <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {I.x(12, M.ink[400])}
              </div>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 8, background: M.ink[50] }}/>

          {/* Live results */}
          <div style={{ padding: '14px 16px 6px', fontSize: 12, fontWeight: 600, color: M.ink[500] }}>
            <span style={{ color: M.brand }}>성수</span> 검색 결과
          </div>

          {[
            { name: '성수카페 로우키', addr: '서울 성동구 성수동1가 685-24', reg: true, highlight: true },
            { name: '성수동 작은커피', addr: '서울 성동구 성수이로 46', reg: true },
            { name: '슬로우커피 성수점', addr: '서울 성동구 성수일로 118', reg: false, cat: '카페' },
            { name: '성수 블렌드하우스', addr: '서울 성동구 연무장길 17', reg: false, cat: '카페' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < 3 ? `1px solid ${M.ink[100]}` : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: r.reg ? M.brandTint : M.ink[100],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {r.reg ? I.sparkle(16, M.brand) : I.pin(14, M.ink[500])}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: M.ink[900], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ background: r.highlight ? 'rgba(180,83,9,0.14)' : 'transparent', padding: r.highlight ? '1px 2px' : 0, borderRadius: 2 }}>성수</span>{r.name.replace('성수', '')}
                  </div>
                  {r.reg && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 4,
                      background: M.brand, color: '#fff',
                    }}>MOODA</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: M.ink[500], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.addr}
                </div>
              </div>
            </div>
          ))}

          {/* Bottom info */}
          <div style={{
            padding: 16, fontSize: 11.5, color: M.ink[400], textAlign: 'center',
            lineHeight: 1.6,
          }}>
            Kakao Local 검색 기반 · 등록되지 않은 카페는<br/>
            선택 시 Mooda에 자동 등록됩니다
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 3: 분위기 필터 — full bottom sheet, category tabs
// ═══════════════════════════════════════════════════════════
function FilterScreen() {
  const CATS = [
    { key: 'atm', label: '분위기', active: true },
    { key: 'sce', label: '씬' },
    { key: 'pur', label: '목적' },
    { key: 'int', label: '인테리어' },
    { key: 'mnu', label: '메뉴' },
    { key: 'fac', label: '편의시설' },
  ];
  const MOODS = [
    { e: '🤫', l: '조용한', sel: true },
    { e: '⚡', l: '활기찬' },
    { e: '💕', l: '로맨틱' },
    { e: '🕯️', l: '아늑한', sel: true },
    { e: '🏙️', l: '모던/세련' },
    { e: '🌿', l: '자연친화' },
    { e: '✨', l: '럭셔리' },
    { e: '⬜', l: '미니멀' },
    { e: '🌨️', l: '북유럽감성' },
    { e: '🏭', l: '인더스트리얼' },
    { e: '🏯', l: '한옥/전통' },
    { e: '🖼️', l: '아트갤러리' },
  ];
  return (
    <IOSDevice width={390} height={844}>
      <div style={{ height: '100%', background: 'rgba(0,0,0,0.45)', position: 'relative' }}>
        {/* dim'ed map behind */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <MapBg height={844} dim/>
        </div>

        {/* Sheet */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingBottom: 40,
          maxHeight: '88%',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -6px 30px rgba(0,0,0,0.2)',
        }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: M.ink[300] }}/>
          </div>

          {/* Header */}
          <div style={{
            padding: '10px 20px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>분위기 필터</div>
              <div style={{ fontSize: 12.5, color: M.ink[500], marginTop: 2 }}>
                선택 <span style={{ color: M.brand, fontWeight: 600 }}>2개</span> · 매칭 카페 <span style={{ color: M.brand, fontWeight: 600 }}>24</span>곳
              </div>
            </div>
            <div style={{
              fontSize: 13, color: M.ink[700], fontWeight: 500,
              padding: '6px 10px', borderRadius: 8, background: M.ink[100],
            }}>전체 해제</div>
          </div>

          {/* Category tabs (sticky) */}
          <div style={{
            display: 'flex', gap: 4, padding: '0 8px',
            borderBottom: `1px solid ${M.ink[200]}`,
            overflow: 'hidden',
          }}>
            {CATS.map(c => (
              <div key={c.key} style={{
                padding: '10px 12px',
                fontSize: 14, fontWeight: c.active ? 700 : 500,
                color: c.active ? M.ink[900] : M.ink[500],
                borderBottom: c.active ? `2px solid ${M.brand}` : '2px solid transparent',
                position: 'relative', top: 1,
                whiteSpace: 'nowrap',
              }}>{c.label}</div>
            ))}
          </div>

          {/* Moods grid */}
          <div style={{ padding: '18px 20px', overflow: 'auto', flex: 1 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
            }}>
              {MOODS.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 52, padding: '0 14px',
                  border: `1.5px solid ${m.sel ? M.brand : M.ink[200]}`,
                  borderRadius: 14,
                  background: m.sel ? M.brandTint : '#fff',
                }}>
                  <div style={{ fontSize: 20 }}>{m.e}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: m.sel ? 600 : 500, color: m.sel ? M.brandInk : M.ink[900] }}>{m.l}</div>
                  {m.sel && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: M.brand,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{I.check(12)}</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 18, padding: 12,
              background: M.ink[50], borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 12.5, color: M.ink[700], lineHeight: 1.5,
            }}>
              <div style={{ fontSize: 20 }}>💡</div>
              <div>여러 카테고리에서 선택 가능해요. 선택한 태그 중 <strong>하나라도 매칭</strong>되는 카페가 보입니다.</div>
            </div>
          </div>

          {/* Sticky CTA */}
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${M.ink[200]}`,
            background: '#fff',
          }}>
            <button style={{
              width: '100%', height: 52, borderRadius: 14,
              background: M.brand, color: '#fff',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(180,83,9,0.25)',
            }}>
              24곳 카페 보기
            </button>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 4: 카페 상세 — hero, vote, tabs
// ═══════════════════════════════════════════════════════════
function DetailScreen() {
  return (
    <IOSDevice width={390} height={844}>
      <div style={{ height: '100%', background: '#fff', overflow: 'auto' }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: 320 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${M.brandSoft} 0%, ${M.brandTint} 100%)`,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(135deg, transparent, transparent 18px, rgba(180,83,9,0.06) 18px, rgba(180,83,9,0.06) 19px)',
            }}/>
          </div>

          {/* Photo count pill */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            borderRadius: 16, fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4,
            backdropFilter: 'blur(6px)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 6l1.5-3h5L16 6"/></svg>
            1 / 12
          </div>

          {/* Top nav overlay */}
          <div style={{
            position: 'absolute', top: 54, left: 0, right: 0,
            padding: '8px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>{I.back()}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>{I.share(18)}</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>{I.heart(18, M.ink[700], false)}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 0', position: 'relative' }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4,
              background: '#ecfdf5', color: '#15803d',
            }}>영업중 · 22:00까지</span>
            <span style={{
              fontSize: 10.5, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4,
              background: M.brandTint, color: M.brandInk,
            }}>MOODA 인증</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: M.ink[900], letterSpacing: '-0.02em', marginBottom: 4 }}>로우키 커피</div>
          <div style={{ fontSize: 13.5, color: M.ink[500], marginBottom: 10 }}>카페 · 성수동1가</div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {I.star(14)}
              <span style={{ fontSize: 15, fontWeight: 700 }}>4.7</span>
              <span style={{ fontSize: 12, color: M.ink[500] }}>(182)</span>
            </div>
            <div style={{ width: 1, height: 12, background: M.ink[200] }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: M.ink[700] }}>
              {I.bus(12, M.blue)} 15분 (뚝섬역)
            </div>
          </div>

          {/* Primary actions — 4-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { i: I.nav(16, M.brand), l: '길찾기' },
              { i: I.phone(16, M.brand), l: '전화' },
              { i: I.heart(16, M.brand), l: '저장' },
              { i: I.share(16, M.brand), l: '공유' },
            ].map((a, k) => (
              <div key={k} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 0', borderRadius: 12,
                background: M.brandTint,
              }}>
                {a.i}
                <div style={{ fontSize: 11.5, fontWeight: 600, color: M.brandInk }}>{a.l}</div>
              </div>
            ))}
          </div>

          {/* Mood vote card */}
          <div style={{
            padding: 16, borderRadius: 16,
            background: M.ink[50],
            border: `1px solid ${M.ink[200]}`,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: M.ink[900] }}>이 카페의 분위기</div>
              <div style={{ fontSize: 11.5, color: M.ink[500] }}>총 <strong>247표</strong></div>
            </div>
            <div style={{ fontSize: 12, color: M.ink[500], marginBottom: 12 }}>태그를 눌러 투표해보세요</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { l: '조용한', n: 89, voted: true },
                { l: '통창/뷰', n: 67, voted: true },
                { l: '노트북', n: 45 },
                { l: '아늑한', n: 28 },
                { l: '스페셜티', n: 12 },
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 999,
                  border: `1.5px solid ${t.voted ? M.brand : M.ink[200]}`,
                  background: t.voted ? M.brand : '#fff',
                  color: t.voted ? '#fff' : M.ink[900],
                  fontSize: 12.5, fontWeight: 600,
                }}>
                  {t.l}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '1px 5px', borderRadius: 8,
                    background: t.voted ? 'rgba(255,255,255,0.22)' : M.ink[100],
                    color: t.voted ? '#fff' : M.ink[500],
                    minWidth: 18, textAlign: 'center',
                  }}>{t.n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs (sticky feel) */}
          <div style={{
            display: 'flex', gap: 4,
            borderBottom: `1px solid ${M.ink[200]}`,
            marginBottom: 14,
          }}>
            {['정보', '리뷰 24', '블로그 18', 'Google 52', '사진 12'].map((t, i) => (
              <div key={t} style={{
                padding: '10px 12px',
                fontSize: 13.5, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? M.ink[900] : M.ink[500],
                borderBottom: i === 0 ? `2px solid ${M.brand}` : '2px solid transparent',
                position: 'relative', top: 1,
              }}>{t}</div>
            ))}
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 20 }}>
            {[
              { i: I.pin(16, M.ink[400]), l: '서울 성동구 성수이로 46', sub: '성수동1가 685-24' },
              { i: I.phone(16, M.ink[400]), l: '02-1234-5678', link: true },
              { i: I.clock(16, M.ink[400]), l: '매일 09:00 - 22:00', sub: '라스트오더 21:30' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0' }}>
                <div style={{ marginTop: 2 }}>{r.i}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: r.link ? M.blue : M.ink[900], fontWeight: r.link ? 500 : 400 }}>{r.l}</div>
                  {r.sub && <div style={{ fontSize: 12, color: M.ink[500], marginTop: 2 }}>{r.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 5: 목록 뷰 (지도 대체 — 네이버 스타일 탭 전환)
// ═══════════════════════════════════════════════════════════
function ListScreen() {
  const cafes = [
    { name: '로우키 커피', addr: '성수동1가 · 350m', rating: 4.7, rc: 182, tags: ['조용한','통창','노트북'], open: true, price: '₩', transit: '15분' },
    { name: '슬로우커피 성수점', addr: '성수일로 · 420m', rating: 4.5, rc: 96, tags: ['스페셜티','아늑한'], open: true, transit: '18분' },
    { name: '어니언 성수', addr: '성수동2가 · 680m', rating: 4.8, rc: 421, tags: ['빈티지','디저트','통창'], open: false, price: '₩₩', transit: '22분' },
    { name: '블렌드하우스', addr: '연무장길 · 750m', rating: 4.3, rc: 54, tags: ['모던','미니멀'], open: true, transit: '20분' },
  ];
  return (
    <IOSDevice width={390} height={844}>
      <div style={{ height: '100%', background: M.bg, paddingTop: 54, display: 'flex', flexDirection: 'column' }}>
        {/* Top search */}
        <div style={{ padding: '6px 12px 10px', background: '#fff', borderBottom: `1px solid ${M.ink[100]}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 44, padding: '0 14px',
            background: M.ink[100], borderRadius: 22,
          }}>
            {I.search(17)}
            <div style={{ flex: 1, fontSize: 14.5 }}>성수동 조용한 카페</div>
          </div>

          {/* Applied filters */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingBottom: 2, overflow: 'hidden' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 12,
              background: M.brand, color: '#fff',
              fontSize: 12, fontWeight: 600,
            }}>{I.filter(11, '#fff')} 필터 2</div>
            {['조용한 ×', '아늑한 ×'].map(t => (
              <div key={t} style={{
                padding: '5px 10px', borderRadius: 12,
                border: `1px solid ${M.brand}`, background: M.brandTint, color: M.brandInk,
                fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Tab switch: 지도 / 목록 (segmented) */}
        <div style={{
          display: 'flex', gap: 0, padding: '10px 12px 6px',
          background: '#fff',
        }}>
          <div style={{
            flex: 1, display: 'flex', background: M.ink[100], borderRadius: 10, padding: 3,
          }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 13, fontWeight: 500, color: M.ink[500] }}>
              지도
            </div>
            <div style={{
              flex: 1, textAlign: 'center', padding: '7px 0',
              background: '#fff', borderRadius: 8,
              fontSize: 13, fontWeight: 700, color: M.ink[900],
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              목록 <span style={{ color: M.ink[400], fontWeight: 500 }}>24</span>
            </div>
          </div>
          <div style={{
            marginLeft: 8, padding: '8px 12px', fontSize: 12.5, color: M.ink[700],
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            거리순 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={M.ink[500]} strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
          {cafes.map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              padding: '16px 16px',
              borderBottom: `1px solid ${M.ink[100]}`,
            }}>
              <div style={{
                width: 84, height: 84, borderRadius: 12,
                background: `linear-gradient(135deg, ${M.brandSoft}, ${M.brandTint})`,
                flexShrink: 0, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>☕</div>
                <div style={{
                  position: 'absolute', top: 4, left: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: M.ink[700],
                }}>{i+1}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: M.ink[900], letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {I.heart(16, M.ink[400])}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.ink[500], marginTop: 2 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 5px', borderRadius: 3,
                    background: c.open ? '#ecfdf5' : M.ink[100],
                    color: c.open ? '#15803d' : M.ink[500],
                  }}>{c.open ? '영업중' : '영업종료'}</span>
                  <span>{c.addr}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {I.star(11)}
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.rating}</span>
                    <span style={{ fontSize: 11, color: M.ink[500] }}>({c.rc})</span>
                  </div>
                  <span style={{ color: M.ink[300] }}>·</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: M.ink[700] }}>
                    {I.bus(11, M.blue)} {c.transit}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {c.tags.slice(0,3).map(t => (
                    <span key={t} style={{
                      fontSize: 10.5, padding: '2px 7px', borderRadius: 8,
                      background: M.brandTint, color: M.brandInk, fontWeight: 500,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { MapScreen, SearchScreen, FilterScreen, DetailScreen, ListScreen });
