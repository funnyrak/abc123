# 멘토링 매칭 & 질문 플랫폼

기획 문서는 [`docs/SPEC.md`](docs/SPEC.md) 참고. Next.js (App Router) + Supabase로 구현합니다.

## 로컬 개발 환경 설정

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. Project Settings → API에서 `Project URL`과 `anon public` 키를 확인합니다.
3. `supabase/migrations/` 안의 파일을 **번호 순서대로**(0001 → 0010) SQL Editor에 붙여넣고 실행합니다. 뒤 번호일수록 앞 마이그레이션의 테이블/정책에 의존하므로 순서를 지켜야 합니다. `0009_seed_mentors.sql`까지 실행하면 실제 멘토 풀 565명이 바로 채워집니다.
   - 이미 0001~0009까지 실행해서 운영 중인 프로젝트라면, **`0010_mentor_display_name.sql`만 추가로** 실행하면 됩니다 (기존 데이터는 그대로 두고 컬럼만 추가·백필하는 마이그레이션입니다).
4. **가입이 가능하려면 학교/기관이 최소 1개 있어야 합니다.** 관리자 계정 생성(아래) 후 `/admin/organizations`에서 먼저 추가하세요 — org_code 없이는 담당자·학생 가입이 막힙니다.

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

**Phase 5**
- 재직 인증: 멘토가 `/mentor/verification`에서 서류 업로드(전용 private 버킷) → 관리자가 `/admin/mentors`에서 승인/반려 → 승인 시 `mentor_profiles.status`도 함께 전환되어 검색에 노출, 결과는 카카오 알림톡 큐잉
- 학교/기관 관리: `/admin/organizations`에서 학교·기관과 가입용 코드를 발급하고 Q&A 구독을 토글 (이게 없으면 담당자·학생 가입 자체가 불가능했던 초기 설계 공백을 메움)
- 운영 관제 대시보드(`/admin/ops`): 섭외 접수 현황·성사율, 추천 멘토 없음 경고, 확정 스케줄·사전알림 발송 현황, 결제 현황, 질문 접수 현황, 질문 지체 경고 — Phase 2~4에서 쌓아온 데이터를 한 화면에 집계

**알려진 미구현/단순화 항목 (다음 이터레이션 후보)**
- 학생 참여 승인: 기획서(§7.4)는 "학교 코드 입력 → 담당자 승인 → 연결"이지만, 현재는 가입 시 코드만 맞으면 즉시 `org_id`가 연결되고 담당자 승인 단계는 생략되어 있습니다.
- 프로젝트 룸의 진행 기록(`progress_logs`)·보고서(`reports`)는 테이블/RLS만 있고 화면이 없습니다.
- 실제 QA는 진행하지 못했습니다 — 이 세션에는 연결된 Supabase 프로젝트가 없어 `npm run build`/`lint`와 라우팅 보호(리다이렉트) 확인까지만 했고, 회원가입부터 결제까지 실제 데이터로 끝까지 눌러보는 건 실제 Supabase 프로젝트를 연결한 뒤 사용자분이 확인해주셔야 합니다.

**멘토 풀 시딩 (Phase 6)**
- 실제 보유 중인 멘토 명단(565명, 실명+소속)을 `supabase/migrations/0009_seed_mentors.sql`로 시딩합니다.
- **실제 로그인 계정은 만들지 않았습니다.** 본인 동의 없이 실명 인물의 계정·비밀번호를 임의로 생성하는 건 위험하다고 판단해서, 대신 각 멘토를 `claim_status = 'unclaimed'` 상태(로그인 계정 없이 이름·소속만 있는 디렉터리 항목)로 등록했습니다. 담당자 검색·상세 화면에는 바로 노출되어 "가입 대기" 배지와 함께 보이지만, 실제 매칭 요청 대상에서는 제외됩니다 (로그인할 사람이 없어 응답이 영원히 안 오는 걸 방지).
- 각 멘토가 실제로 로그인해서 자기 프로필을 관리하려면, `/admin/mentors/unclaimed`에서 그 멘토의 개인 초대 링크(`.../signup?claim=<토큰>`)를 복사해 본인에게 전달하면 됩니다. 그 링크로 가입하면 새 계정이 기존 프로필에 자동으로 연결되고, 그때부터 정상적으로 섭외 요청에 응답할 수 있습니다.
- 회사명/직책은 원본 PDF 텍스트를 단순 규칙으로 잘라 넣은 것이라 완벽하지 않습니다. 산업/직무 필드는 비워뒀으니, 멘토 본인이 가입 후 프로필을 채우거나 관리자가 나중에 보완해야 합니다.
- ⚠️ 실명·소속 500명 이상의 개인정보를 라이브 공개 사이트에 노출하는 것이므로, 각 멘토를 최초 리크루팅할 때 이런 형태의 공개 게시에 대한 동의를 받아두셨는지 확인해주시기 바랍니다 (개인정보보호법 관련).

**공개 멘토 풀 (Phase 7)**
- `/mentors`(목록·검색) · `/mentors/[id]`(상세)는 **로그인 없이** 볼 수 있습니다. 방문자가 가입 전에 먼저 멘토 풀을 둘러볼 수 있도록 홈 화면에 "멘토 풀 둘러보기" 버튼을 추가했습니다. 실제 섭외 요청 등은 여전히 담당자 로그인이 필요합니다.
- `mentor_profiles.display_name` 컬럼을 새로 추가해 멘토 이름을 항상 이 컬럼에서 가져오도록 통일했습니다. 이전에는 가입 완료된 멘토의 이름을 `profiles.name`(로그인 계정 테이블) 조인으로 가져왔는데, 그 테이블은 익명 방문자에게 공개되지 않아 **공개 페이지에서 가입 완료 멘토의 이름이 안 보이는 문제**가 있었습니다. 지금은 멘토 전용 정보(`mentor_profiles`)에 이름을 같이 두어 익명 사용자도 정상적으로 볼 수 있습니다.

관리자 계정은 회원가입 화면에서 만들 수 없습니다. Supabase 대시보드에서 직접 유저를 만들고
`profiles.role`을 `admin`으로 수정해서 생성하세요.

## 배포 (Vercel + www.mentoring-usg.kr)

아래 항목은 이 세션에 연결된 Vercel/도메인 계정이 없어 직접 실행할 수 없었습니다 — 사용자분 계정으로 진행해주셔야 합니다.

1. **Vercel 프로젝트 생성**: [vercel.com](https://vercel.com)에서 이 GitHub 레포(`funnyrak/abc123`, 브랜치 `claude/mentoring-site-project-73c7ds` 또는 병합 후 `main`)를 Import합니다.
2. **환경 변수 등록**: Vercel 프로젝트 Settings → Environment Variables에 `.env.local`과 동일한 키를 모두 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (지연 감지 크론용, `openssl rand -base64 32`로 생성)
   - `NEXT_PUBLIC_SITE_URL=https://www.mentoring-usg.kr` (멘토 초대 링크 생성에 사용됨)
3. **도메인 연결**: Vercel 프로젝트 Settings → Domains에서 `www.mentoring-usg.kr`을 추가합니다. 도메인을 이미 보유하고 계시다면, 도메인 등록기관(가비아/후이즈 등)의 DNS 설정에 Vercel이 안내하는 CNAME 레코드를 추가하면 됩니다. 아직 도메인을 구매하지 않으셨다면 먼저 등록기관에서 구매가 필요합니다.
4. **Supabase Auth Redirect URL 추가**: Supabase 대시보드 → Authentication → URL Configuration에 `https://www.mentoring-usg.kr`을 Site URL/Redirect URL로 추가합니다 (이게 없으면 이메일 인증 링크 등이 localhost로 리다이렉트됩니다).
5. `vercel.json`에 정의된 cron(`/api/cron/check-delays`, 매일 1회)이 배포 시 자동으로 등록됩니다. Hobby 플랜은 크론 실행 빈도가 하루 1회로 제한되어 있어 그 이상 촘촘한 지연 감지가 필요하면 Pro 플랜이나 Supabase `pg_cron`으로 전환을 고려하세요.
6. 배포가 끝나면 `https://www.mentoring-usg.kr`에서 회원가입 → 로그인 → 멘토 검색까지 직접 확인해주세요. 이 세션에서는 실제 Supabase 프로젝트가 없어 화면 단위 QA를 대신해드릴 수 없었습니다.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```
