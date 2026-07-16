# 멘토링 매칭 & 질문 플랫폼

기획 문서는 [`docs/SPEC.md`](docs/SPEC.md) 참고. Next.js (App Router) + Supabase로 구현합니다.

## 로컬 개발 환경 설정

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. Project Settings → API에서 `Project URL`과 `anon public` 키를 확인합니다.
3. `supabase/migrations/` 안의 파일을 **번호 순서대로**(0001 → 0006) SQL Editor에 붙여넣고 실행합니다. 뒤 번호일수록 앞 마이그레이션의 테이블/정책에 의존하므로 순서를 지켜야 합니다.

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

**Phase 3**
- 프로젝트 룸(`/projects/[id]`) — 일정 등록, 참석 확인, 강의자료 업로드(Supabase Storage, 프로젝트 멤버로 접근 제한), 프로젝트 취소
- 취소 정책: 다음 예정 회차까지 남은 시간 기준으로 위약금 자동 계산 (3일 이상 전 0% / 24~72시간 전 50% / 24시간 이내 100%) — 오프라인 강의의 취소 규정은 아직 사업 측 확인 전이라 온라인 기준을 동일 적용 중
- 확정 시 기관 대상 `Invoice`가 자동 생성(강사료 + 수수료 20%), 소규모(1~2명)는 담당자가 카드/계좌이체 선택, 10명 이상은 프로젝트 계약으로 고정
- "완료 처리" 시 참석 기록 기반으로 `mentor_settlements` 산정 — 선결제는 즉시 정산가능, 후결제는 Invoice 결제 완료 후 정산가능으로 전환
- 정산 금액은 멘토 본인 + 관리자만 조회 가능, 담당자는 Invoice(청구 금액)만 확인 가능 (기획서 §6.5 원칙 적용)
- 실제 결제(PG)는 아직 연동 전 — 관리자가 수동으로 "결제완료 처리"하는 스텁 상태 (Toss Payments/아임포트 등 벤더 계약 필요)

**Phase 4**
- 담당자가 "Q&A 구독 신청"하면 `qna_subscription` 타입 Project가 생성되고, 멘토는 `/mentor/qna-projects`에서 프로젝트별로 참여 여부를 직접 체크해야 그 학교의 질문을 받음 (기획서 §6.4)
- 학생 질문 자격: 학교 구독 중이면 무제한, 아니면 무료 3건 → 소진 시 5건/1만원 크레딧 (크레딧 결제도 PG 미연동이라 클릭 시 즉시 지급되는 스텁)
- 질문 4방식: 멘토 직접 지정(1:1) / 산업 / 직무 / 기업 — 후 3개는 Q&A 프로젝트에 참여한 멘토 중 조건에 맞는 전원에게 브로드캐스트
- 질문 작성 전 "비슷한 질문 먼저 찾아보기"로 같은 학교 내 답변완료 질문을 검색 (단순 ILIKE 매칭, 임베딩 기반 고도화는 2차 확장)
- 브로드캐스트 질문은 학생이 답변을 채택해야 하며, 채택된 멘토에게만 보상 지급 (`answer_rewards`, 보상액 5,000원은 사업 확정 전 임시값)
- 지연 감지: `/api/cron/check-delays` Route Handler + `vercel.json` cron(매일 09:00 UTC) — 1:1 질문 24시간 초과, 브로드캐스트 질문 3회 이상 무응답 멘토를 `operations_alerts`에 기록. **Vercel 프로젝트 환경변수에 `CRON_SECRET`을 설정해야 동작**하며, 화면에 노출하는 관제 대시보드 자체는 Phase 5
- 담당자는 참여 멘토 수·질문 건수만 확인(§6.5), 정산/보상 금액은 여전히 멘토+관리자만

> ⚠️ Phase 2~3에서 만든 서버 액션(매칭 확정, 프로젝트 생성, 정산 산정 등) 중 상당수가 실제로는 RLS 정책 누락으로 실패하는 버그가 있었습니다. Phase 4에서 발견 즉시 `0004_qna_policies.sql`에서 함께 수정했습니다 — 위 "번호 순서대로 실행" 안내가 특히 중요한 이유입니다.

관리자 계정은 회원가입 화면에서 만들 수 없습니다. Supabase 대시보드에서 직접 유저를 만들고
`profiles.role`을 `admin`으로 수정해서 생성하세요.

## 배포 (Vercel)

1. 이 레포를 Vercel에 연결합니다.
2. Vercel 프로젝트의 Environment Variables에 `.env.local`과 동일한 키(`CRON_SECRET` 포함)를 등록합니다.
3. 배포 후 Supabase Auth의 Redirect URL 설정에 배포 도메인을 추가합니다.
4. `vercel.json`에 정의된 cron(`/api/cron/check-delays`, 매일 1회)이 자동으로 등록됩니다. Hobby 플랜은 크론 실행 빈도가 하루 1회로 제한되어 있어 그 이상 촘촘한 지연 감지가 필요하면 Pro 플랜이나 Supabase `pg_cron`으로 전환을 고려하세요.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```
