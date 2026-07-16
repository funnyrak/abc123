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

## 현재까지 구현된 것 (Phase 1)

- 역할별(멘토/담당자/학생/관리자) 회원가입·로그인 (Supabase Auth + `profiles` 트리거)
- `proxy.ts`(Next.js 16부터 `middleware.ts`를 대체하는 파일명)로 로그인 여부에 따른 라우팅 보호
- 역할별 대시보드 뼈대 — 각 카드는 어느 Phase에서 실제로 구현되는지 표시
- 전체 데이터 모델(`supabase/migrations/0001_init.sql`) — 매칭, 프로젝트, Q&A, 정산, 결제, 카카오 알림 테이블 포함

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
