/**
 * 스크립트용 환경변수 로더
 *
 * Next.js 는 런타임에 .env / .env.local / .env.production 등을 자동 로드하지만
 * 순수 Node 스크립트 (tsx 실행) 는 수동 로드가 필요하다.
 *
 * 로드 순서 (뒤가 우선):
 *   1. .env        공용 (보통 DATABASE_URL 만)
 *   2. .env.local  개발자 로컬 (API 키 등 민감정보)
 *
 * 사용법:
 *   import './lib/env';  // 스크립트 최상단
 *   // 이후 process.env.* 접근 가능
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 프로젝트 루트 기준으로 로드 (스크립트를 어디서 실행하든 고정)
const CWD = process.cwd();

config({ path: resolve(CWD, '.env') });
const localPath = resolve(CWD, '.env.local');
if (existsSync(localPath)) {
  config({ path: localPath, override: true });
}
