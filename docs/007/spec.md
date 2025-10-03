# 7번 기능 – 학습자 대시보드 & 성적 피드백

## Use Case
- **Primary Actor**: 학습자(Learner)
- **Precondition (사용자 관점)**:
  - 유효한 학습자 계정으로 로그인되어 있다.
  - 최소 한 개 이상 강의에 등록되어 있다.
- **Trigger**: 학습자가 내 대시보드 메뉴를 클릭하거나 `/dashboard` URL로 직접 접근한다.

## Main Scenario
1. 학습자가 대시보드 페이지에 진입하면 프런트엔드가 React Query를 통해 요약 데이터를 비동기 요청한다.
2. 프런트엔드는 `@/lib/remote/api-client`를 사용해 `GET /learner/dashboard` API를 호출하며 사용자 토큰을 함께 전달한다.
3. 백엔드는 토큰으로 학습자 계정을 확인한 뒤 개인 제출 목록, 과제별 메타데이터, 강의별 가중치 정보를 조회한다.
4. 백엔드는 과제별 점수/상태와 강의별 누적 점수를 계산하여 표준 응답 포맷으로 반환한다.
5. 프런트엔드는 수신한 데이터를 카드·테이블 UI로 렌더링하고, 지각 제출·재제출 요청 등 상태를 시각적으로 표시한다.
6. 학습자는 각 과제 행에서 피드백 링크를 열람하거나 재제출 요청 시 안내 버튼을 확인한다.

## Edge Cases
- 네트워크 실패 또는 5xx: 에러 토스트와 재시도 버튼을 노출하고 React Query `retry`를 제한적으로 사용한다.
- 401/403 응답: 세션 만료 메시지를 띄우고 로그인 페이지로 리다이렉트한다.
- 등록 강의가 없거나 제출 이력이 없는 경우: 빈 상태 일러스트와 코스 등록 CTA를 보여준다.
- 일부 과제 점수가 누락된 경우: 상태를 `평가 대기`로 표시하고 총점 계산에서 제외한다.
- 재제출 허용 과제의 마감 기한이 지난 경우: `지각` 배지를 강조하고 허용 여부에 따라 재제출 버튼을 토글한다.

## Business Rules
- 학습자는 본인이 제출한 과제와 등록한 강의 데이터만 조회할 수 있다.
- 총점은 `Σ(과제 점수 × 과제 가중치)`로 계산하며, 가중치 합이 1 미만이면 남은 비중은 0으로 간주한다.
- 마감 기한 이후 제출은 지각으로 표기하고, 재제출 허용 플래그가 `true`일 때만 버튼을 노출한다.
- 피드백 텍스트가 길 경우 2줄까지만 미리보기로 보여 주고, 전체 내용은 모달/드로어에서 확인한다.
- 시스템 시간은 UTC 기준으로 비교하며, 사용자 로캘에 맞춰 클라이언트에서 변환한다.

## Sequence Diagram
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 대시보드 페이지 진입
FE -> FE: React Query 캐시 확인
FE -> BE: GET /learner/dashboard (with token)
BE -> Database: 학습자 제출/강의/과제 데이터 조회
Database --> BE: 데이터 결과 세트
BE -> BE: 총점 및 상태 계산
BE --> FE: 200 OK + DashboardSummaryDTO
FE -> User: 카드/테이블 UI 렌더링
alt 인증 만료
    BE --> FE: 401 Unauthorized
    FE -> User: 로그인 세션 만료 안내
end
@enduml
