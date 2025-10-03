## Use Case: 코스 검색 & 수강신청 (Learner)

- **Primary Actor**: 등록된 Learner 사용자
- **Precondition (사용자 관점)**:
  - Learner 계정으로 로그인되어 있으며 네트워크 연결이 정상이다.
  - Learner 대시보드에서 코스 카탈로그 화면에 접근할 수 있다.
- **Trigger**: Learner가 새로운 코스를 찾아 수강하고자 할 때.

### Main Scenario
1. Learner는 코스 카탈로그 화면에서 검색어와 필터(카테고리, 난이도, 정렬)를 설정한다.
2. FE는 검색 조건을 포함한 목록 조회 요청을 BE로 전송한다.
3. BE는 Database에서 `published` 상태의 코스를 조건에 맞게 조회해 FE로 반환한다.
4. FE는 결과 목록을 표시하고 Learner가 관심 있는 코스를 선택하면 상세 정보를 요청한다.
5. BE는 선택한 코스의 상세와 Learner의 기존 수강 여부를 조회해 FE로 전달한다.
6. Learner가 `수강신청` 버튼을 클릭하면 FE는 수강신청 API를 호출한다.
7. BE는 코스 상태와 중복 수강 여부를 검증한 뒤, 문제 없으면 `enrollments` 테이블에 기록한다.
8. BE는 성공 또는 실패 결과를 FE로 응답하고, FE는 Learner에게 메시지를 보여주며 대시보드를 갱신한다.

### Edge Cases
- 검색 조건이 비어 있거나 잘못된 경우: FE에서 기본 조건으로 대체하거나 검증 메시지를 제공한다.
- BE 요청 실패(네트워크, 서버 오류): FE에서 재시도 안내 및 오류 메시지를 표시한다.
- 이미 수강 중인 코스 신청: BE에서 409 응답을 반환하고 FE는 `이미 수강 중` 안내를 보여준다.
- 코스가 `published`가 아닌 경우: BE에서 403 응답을 반환하고 FE는 수강 불가 메시지를 출력한다.
- Database 삽입 오류: BE에서 500 응답을 반환하고 FE는 문의 안내 메시지를 제공한다.

### Business Rules
- Learner만 수강신청 API를 호출할 수 있으며 Instructor 권한은 차단한다.
- `published` 상태의 코스만 수강신청 대상이 된다.
- 한 Learner는 동일 코스를 중복으로 등록할 수 없다.
- FE는 `@/lib/remote/api-client`를 통해 모든 HTTP 요청을 전송하고, 사용자 메시지는 FE에서 표준화한다.

@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 검색 조건 입력
FE -> BE: 코스 목록 조회 요청
BE -> Database: published 코스 검색
Database --> BE: 코스 목록
BE --> FE: 코스 목록 응답
User -> FE: 코스 상세 요청
FE -> BE: 코스 상세 조회
BE -> Database: 코스·수강 여부 확인
Database --> BE: 조회 결과
BE --> FE: 상세·수강 상태 응답
User -> FE: 수강신청 클릭
FE -> BE: 수강신청 요청
BE -> Database: enrollments 기록
Database --> BE: 삽입 결과
BE --> FE: 결과 응답
FE --> User: 성공/오류 메시지 표시
@enduml
