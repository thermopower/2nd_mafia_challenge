# 모듈화 설계 계획

## 개요
- **AssignmentGradingSchemas** (`src/features/assignments/backend/schema.ts`): 채점 요청·응답 및 제출 상세 스키마 정의로 BE/FE 검증을 일원화.
- **AssignmentGradingErrors** (`src/features/assignments/backend/error.ts`): 강사 권한, 동시 수정, 점수 범위 오류 등을 표현하는 에러 코드 확장.
- **AssignmentSubmissionGraderMigration** (`supabase/migrations/0005_add_assignment_submission_grader.sql`): `assignment_submissions`에 `graded_by` 컬럼과 인덱스를 추가해 강사 식별 이력을 저장.
- **AssignmentGradingService** (`src/features/assignments/backend/service.ts`): 제출 상세 조회 및 채점/재제출 비즈니스 로직 구현.
- **AssignmentGradingRoute** (`src/features/assignments/backend/route.ts`): 강사용 제출 상세 조회(GET)와 채점(PATCH) 엔드포인트 노출.
- **AssignmentGradingDTO** (`src/features/assignments/lib/dto.ts`): 새 스키마 타입을 클라이언트에서 재사용하도록 재노출.
- **useAssignmentSubmissionDetail** (`src/features/assignments/hooks/useAssignmentSubmissionDetail.ts`): 강사용 제출 상세 fetch용 React Query 훅.
- **useGradeAssignment** (`src/features/assignments/hooks/useGradeAssignment.ts`): 채점/재제출 mutation 훅과 캐시 무효화 처리.
- **AssignmentGradeForm** (`src/features/assignments/components/AssignmentGradeForm.tsx`): 강사용 채점 입력 폼 및 검증 UI.
- **AssignmentSubmissionGradePage** (`src/app/(protected)/dashboard/courses/[courseId]/assignments/[assignmentId]/submissions/[submissionId]/grade/page.tsx`): 제출 상세와 채점 폼을 배치한 강사용 화면.

## Diagram
```mermaid
graph TD
  Route[AssignmentGradingRoute (/assignments/:assignmentId/submissions/:submissionId)] --> Service[AssignmentGradingService]
  Service --> Schemas[AssignmentGradingSchemas]
  Service --> Errors[AssignmentGradingErrors]
  Service --> Migration[AssignmentSubmissionGraderMigration]
  Service -->|supabase client| DB[(Database)]
  Schemas --> DTO[AssignmentGradingDTO]
  Route -->|JSON| DTO
  DTO --> DetailHook[useAssignmentSubmissionDetail]
  DTO --> GradeHook[useGradeAssignment]
  DetailHook --> Page[AssignmentSubmissionGradePage]
  GradeHook --> Form[AssignmentGradeForm]
  Form --> GradeHook
  Page --> Form
  Page --> DetailHook
```

## Implementation Plan

### Backend / Business Logic
1. **AssignmentGradingSchemas** (`src/features/assignments/backend/schema.ts`)
   - `AssignmentSubmissionDetailSchema` 정의: 제출 텍스트/링크, 상태, late, score, feedback, gradedAt, updatedAt, gradedBy 포함.
   - `GradeAssignmentRequestSchema` 작성: `score`(0~100 정수, `requestResubmission=true`일 때 optional), `feedback`(최소 5자, 사전 정의 Markdown whitelist), `requestResubmission`(boolean), `expectedUpdatedAt`(ISO 문자열) 필수.
   - `GradeAssignmentResponseSchema`로 최신 상태·점수·피드백·타임스탬프·강사 ID를 반환.
   - **Unit Test**: `src/features/assignments/backend/__tests__/schema.grade.spec.ts`에서 정상/범위 초과/피드백 부족/허용되지 않은 Markdown 케이스 검증.

2. **AssignmentGradingErrors** (`src/features/assignments/backend/error.ts`)
   - `INSTRUCTOR_NOT_OWNER`, `SUBMISSION_NOT_FOUND`, `SUBMISSION_STATUS_LOCKED`, `CONFLICT_ON_UPDATE`, `INVALID_SCORE_RANGE`, `FEEDBACK_TOO_SHORT` 상수 추가.
   - `mapAssignmentError`에 Supabase 오류 코드 매핑 분기 확장 및 기본 메시지 갱신.
   - 도메인에서 직접 던지는 에러도 해당 상수로 통일해 프런트에서 일관 처리 가능하도록 튜닝.

3. **AssignmentSubmissionGraderMigration** (`supabase/migrations/0005_add_assignment_submission_grader.sql`)
   - `graded_by uuid REFERENCES public.profiles(user_id)` 컬럼과 `assignment_submissions_graded_by_idx` 인덱스 추가, 기본값 NULL.
   - 기존 데이터는 NULL 유지, `set_updated_at` 트리거 재사용으로 `updated_at` 관리.
   - Idempotent 패턴(`ALTER TABLE IF EXISTS ... ADD COLUMN IF NOT EXISTS`) 적용 및 RLS 비활성 상태 유지.

4. **AssignmentGradingService** (`src/features/assignments/backend/service.ts`)
   - `getSubmissionForInstructor(client, assignmentId, submissionId, instructorId)` 구현: `assignments` ↔ `courses` 소유권 검증 → 제출 조회 → 카멜 케이스 변환 후 스키마 검증.
   - `gradeAssignment(client, assignmentId, submissionId, instructorId, payload)` 구현:
     * 소유권, 제출 존재, 허용 상태(`submitted`/`resubmission_required`) 점검. 금지 상태면 `SUBMISSION_STATUS_LOCKED` 반환.
     * `expectedUpdatedAt`과 DB `updated_at` 비교 → 불일치 시 409(`CONFLICT_ON_UPDATE`).
     * 재제출 요청: `status=resubmission_required`, `score=null`, `graded_at=now()`, `graded_by=instructorId`, `feedback` 필수.
     * 점수 입력: `score` 정수/범위 재검사, `status=graded`, `graded_at=now()`, `graded_by=instructorId` 업데이트.
     * Supabase 오류는 `mapAssignmentError`로 매핑하고 `failure`/`success` 헬퍼로 응답.
   - **Unit Test**: `src/features/assignments/backend/__tests__/service.grade.spec.ts`에서 mock Supabase로 (정상 채점, 재제출 요청, 권한 없음, 점수 범위 초과, 동시 수정 충돌) 시나리오 검증.

5. **AssignmentGradingRoute** (`src/features/assignments/backend/route.ts`)
   - `GET /assignments/:assignmentId/submissions/:submissionId`: JWT 추출 → `getSubmissionForInstructor` 호출 → `respond`.
   - `PATCH /assignments/:assignmentId/submissions/:submissionId`: 바디 파싱 & Zod 검증 → `gradeAssignment` 호출 → 상태 코드/메시지 사양 대응.
   - 401/403/404/409/422/500 응답 분기 및 에러 코드 매핑 정리.

6. **AssignmentGradingDTO** (`src/features/assignments/lib/dto.ts`)
   - 새 스키마 타입(`AssignmentSubmissionDetail`, `GradeAssignmentRequest`, `GradeAssignmentResponse`)을 export 목록에 추가.
   - 프런트 훅/폼에서 import 하도록 주석 및 예시 보강.

7. **Test Infrastructure**
   - `vitest`, `@vitest/coverage-istanbul` 등을 devDependencies로 추가하고 `package.json`에 "test": "vitest" 스크립트 정의.
   - `tsconfig.json`에 `__tests__` 경로 포함, `eslint.config.mjs`에 테스트 파일 룰 예외 추가.

### Frontend / Hooks & Presentation
1. **useAssignmentSubmissionDetail** (`src/features/assignments/hooks/useAssignmentSubmissionDetail.ts`)
   - `useQuery`로 GET 엔드포인트 호출, `queryKey` `["assignment-submission", submissionId]` 구성.
   - Instructor 미소유(403) 케이스를 `meta.errorMessage`로 분기해 안내 문구 제공.
   - 데이터는 `AssignmentSubmissionDetail` 타입으로 반환, `enabled` 조건으로 ID 유효성 보장.

2. **useGradeAssignment** (`src/features/assignments/hooks/useGradeAssignment.ts`)
   - `useMutation`으로 PATCH 호출, 변수 `{ assignmentId, submissionId, ...payload }` 사용.
   - 성공 시 `assignment-submission`, `recent-feedback`, `learner-dashboard` 등 관련 쿼리 무효화.
   - 에러 시 `extractApiErrorMessage`와 기본 문구 "채점 처리에 실패했습니다." 제공.

3. **AssignmentGradeForm** (`src/features/assignments/components/AssignmentGradeForm.tsx`)
   - "use client" 선언 후 `react-hook-form` + `zodResolver(GradeAssignmentRequestSchema)` 조합으로 폼 제어.
   - 점수 입력은 `Input`, 피드백은 `Textarea`, 재제출 토글은 `Switch`(shadcn-ui) 사용, 상태 배지는 `Badge` 재사용.
   - 제출 시 `useGradeAssignment` 호출, 409 충돌 시 재조회 안내 토스트 노출.
   - **QA Sheet**:
     | 시나리오 | 기대 결과 |
     | --- | --- |
     | 점수 85, 피드백 10자 입력 후 제출 | 성공 토스트 + 상위 콜백 호출 |
     | 점수 120 입력 | 즉시 범위 오류 메시지 표시, 제출 버튼 비활성 |
     | 재제출 요청 토글 ON, 점수 미입력 | 유효성 통과 후 재제출 API 호출 |
     | API 409 응답 | 폼 상단 경고 표시, `refetch` 호출 트리거 |

4. **AssignmentSubmissionGradePage** (`src/app/(protected)/dashboard/courses/[courseId]/assignments/[assignmentId]/submissions/[submissionId]/grade/page.tsx`)
   - "use client" 선언, `params: Promise` 패턴 준수, Suspense 없이 클라이언트 렌더링.
   - `useAssignmentSubmissionDetail`로 데이터 로드, 로딩/오류/정상 상태에 따라 shadcn UI(`Skeleton`, `Alert`, `Button`) 사용.
   - `AssignmentGradeForm`와 제출 정보 카드(`Card`) 배치, 성공 시 이전 페이지 이동 또는 토스트 처리.
   - Instructor 권한 오류(403) 시 별도 안내와 대시보드 이동 버튼 제공.
   - **QA Sheet**:
     | 시나리오 | 기대 결과 |
     | --- | --- |
     | 제출 상세 로딩 중 | Skeleton 표시, 폼 비활성 |
     | 제출 데이터 수신 성공 | 제출 정보 카드 + 폼 노출, 기존 점수/피드백 프리필 |
     | 403 오류 수신 | 권한 오류 경고 + 대시보드 이동 CTA |
     | 채점 성공 | 토스트 출력 후 이전 페이지로 라우팅 |
