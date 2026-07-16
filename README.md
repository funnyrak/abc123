# 멘토링 매칭 & 질문 플랫폼

기획 문서는 [`docs/SPEC.md`](docs/SPEC.md) 참고. Next.js (App Router) + Supabase로 구현합니다.

## 로컬 개발 환경 설정

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. Project Settings → API에서 `Project URL`과 `anon public` 키를 확인합니다.
3. `supabase/migrations/0001_init.sql`을 Supabase 대시보드의 SQL Editor에 붙여넣고 실행합니다. (전체 테이블, 인덱스, RLS 정책, 신규 가입 트리거가 한 번에 생성됩니다.)

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase URL과 anon key를 채워넣습니다.

### 3. 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

## 현재까지 구현된 것

**Phase 1**
- 역할별(멘토/담당자/학생/관리자) 회원가입·로그인 (Supabase Auth + `profiles` 트리거)
- `proxy.ts`(Next.js 16부터 `middleware.ts`를 대체하는 파일명)로 로그인 여부에 따른 라우팅 보호
- 역할별 대시보드 뼈대 — 각 카드는 어느 Phase에서 실제로 구현되는지 표시
- 전체 데이터 모델(`supabase/migrations/0001_init.sql`) — 매칭, 프로젝트, Q&A, 정산, 결제, 카카오 알림 테이블 포함

**Phase 2**
- 멘토 프로필 등록/수정 (소속·경력·학력·직무·산업·멘토링 영역)
- 담당자용 멘토 검색(산업/직무/기업/지역) 및 상세 프로필
- 섭외 요청 등록 → 조건에 맞는 모든 승인된 멘토에게 자동으로 `match_candidates` 생성
- 멘토의 일정 수락/거절, 담당자의 수락자 중 다중 선택 → 확정 시 `Project` + `ProjectMember` 자동 생성
- 매칭 멘토가 없을 때 `operations_alerts`에 경고 기록 (Phase 5 관제 대시보드에서 노출 예정)
- 카카오 알림톡은 아직 실제 발송 연동 전 — `kakao_notifications`에 `status: pending`으로 큐잉만 해둠 (카카오 비즈니스 채널·알림톡 대행사 계약 필요)

관리자 계정은 회원가입 화면에서 만들 수 없습니다. Supabase 대시보드에서 직접 유저를 만들고
`profiles.role`을 `admin`으로 수정해서 생성하세요.

## 배포 (Vercel)

1. 이 레포를 Vercel에 연결합니다.
2. Vercel 프로젝트의 Environment Variables에 `.env.local`과 동일한 키를 등록합니다.
3. 배포 후 Supabase Auth의 Redirect URL 설정에 배포 도메인을 추가합니다.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```
