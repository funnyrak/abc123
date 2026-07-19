// Shared 산업(industry) / 직무(job function) taxonomy used by both mentor
// profile registration and mentor search/browse screens, so the two stay
// in sync. Adjust freely — nothing else depends on the exact wording.

export const INDUSTRY_OPTIONS = [
  'IT·소프트웨어',
  '반도체·전자',
  '통신',
  '게임',
  '금융·보험',
  '유통·커머스',
  '제조·생산',
  '건설·부동산',
  '바이오·제약·의료',
  '미디어·엔터테인먼트',
  '교육',
  '공공기관·공기업',
  '물류·운송',
  '에너지·화학',
  '컨설팅',
  '기타',
] as const

export const JOB_FUNCTION_OPTIONS = [
  '경영·기획',
  '인사·HR',
  '마케팅·홍보',
  '영업',
  '개발·IT',
  '디자인',
  '재무·회계',
  '생산·품질관리',
  '연구개발(R&D)',
  '고객지원·CS',
  '법무',
  '구매·자재',
  '교육·강의',
  '기타',
] as const

export type IndustryOption = (typeof INDUSTRY_OPTIONS)[number]
export type JobFunctionOption = (typeof JOB_FUNCTION_OPTIONS)[number]
