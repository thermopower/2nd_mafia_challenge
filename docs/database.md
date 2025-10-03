# Database Blueprint

## 데이터 플로우 요약
- **온보딩**: Supabase Auth 계정 생성 후 `profiles`에 이름, 휴대전화, 역할(`learner` · `instructor`)을 저장하고, 약관 동의 내역은 `terms_acceptances`에 기록한다. 동의 후 역할에 맞는 화면으로 이동한다.
- **코스 탐색 및 수강신청 (학습자)**: 학습자가 검색어와 카테고리·난이도 필터, 정렬 조건을 적용해 `status='published'`인 코스를 조회하고, 수강 신청 시 `enrollments`에 (learner, course) 쌍을 기록해 중복 신청을 차단한 뒤 결과를 Learner 대시보드에 반영한다.
- **강사 코스 관리**: 강사는 대시보드에서 자신의 코스(`courses.instructor_id`) 목록과 현재 `status` 값을 확인해 학습자에게 노출할 코스를 `published` 상태로 유지하고, 카테고리·난이도 정보를 검토해 Learner 필터 조건과 정합성을 맞춘다.
- **과제 열람 (학습자)**: 수강 중인 코스의 과제 중 `status='published'` 항목을 조회하고, `status='closed'`인 경우 제출 UI를 비활성화하며 지각 허용·재제출 허용 정책과 마감일, 점수 비중을 함께 표기한다.
- **과제 제출 (학습자)**: 학습자가 텍스트(필수)와 링크(선택) 답안을 제출하면 `assignment_submissions`에 새 버전 레코드를 생성하고, 마감 전에는 `status='submitted'`, 지각 허용 시에는 `late=true`, 재제출이 불가한 과제에서는 기존 제출 존재 여부를 검증해 거절하거나 갱신한다.
- **과제 관리 및 채점 (강사)**: 강사는 코스별 과제를 작성·수정하며 제목, 설명, 마감일, 점수 비중, 지각 허용 여부, 재제출 허용 여부, 채점 기준을 설정하고 `status`를 `draft→published→closed`로 전환한다. 초안(draft) 상태에서는 모든 필드를 수정할 수 있으나, 게시됨(published) 상태에서는 마감일·지각 허용·채점 기준 필드만 제한적으로 수정 가능하며, 마감됨(closed) 상태에서는 수정이 불가하다. 지각 불허 과제는 `auto_close_at`이 마감일과 동일하게 설정되어 자동 마감된다. 과제 삭제 시 제출 내역이 없으면 하드 삭제(즉시 완전 제거)되고, 제출 내역이 있으면 소프트 삭제(`is_deleted=true`)되어 학습자 화면에서 숨겨지며 제출 데이터는 보존된다. 제출 목록에서는 본인 코스 소유권을 확인한 뒤 점수(0~100)와 피드백을 입력해 제출 상태를 `graded` 또는 `resubmission_required`로 갱신하고, 필요 시 재제출 권한을 부여한다.
- **성적 조회 (학습자)**: 학습자는 본인 제출물만 조회하며 점수, 지각 여부, 재제출 요청 여부, 피드백을 확인하고, 각 과제의 `weight`를 활용해 코스 총점을 계산해 요약한다.

## PostgreSQL 스키마
```sql
-- 사용자 프로필 (Supabase auth.users와 1:1 매핑)
CREATE TABLE profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    role text NOT NULL CHECK (role IN ('learner', 'instructor')),
    full_name text NOT NULL,
    mobile_phone text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 약관 버전 관리
CREATE TABLE terms_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_code text NOT NULL UNIQUE,
    effective_at timestamptz NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 약관 동의 이력
CREATE TABLE terms_acceptances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(user_id),
    terms_version_id uuid NOT NULL REFERENCES terms_versions(id),
    accepted_at timestamptz NOT NULL DEFAULT NOW(),
    user_agent text,
    ip_address text
);

-- 코스 메타데이터 (강사 소유 및 게시 상태)
CREATE TABLE courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id uuid NOT NULL REFERENCES profiles(user_id),
    title text NOT NULL,
    description text NOT NULL,
    thumbnail_url text,
    status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    category text NOT NULL,
    difficulty text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 수강신청 내역 (중복 방지)
CREATE TABLE enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL REFERENCES profiles(user_id),
    course_id uuid NOT NULL REFERENCES courses(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (learner_id, course_id)
);

-- 과제 정의 (게시·마감 정책 포함, 소프트 삭제 지원)
CREATE TABLE assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES courses(id),
    title text NOT NULL,
    description text NOT NULL,
    due_at timestamptz NOT NULL,
    weight numeric(5, 2) NOT NULL,
    allow_late boolean NOT NULL,
    allow_resubmission boolean NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'published', 'closed')),
    grading_rubric text NOT NULL DEFAULT '',  -- 채점 기준
    auto_close_at timestamptz,  -- 자동 마감 시각 (지각 불허 시 due_at과 동일)
    is_deleted boolean NOT NULL DEFAULT FALSE,  -- 소프트 삭제 여부
    deleted_at timestamptz,  -- 삭제 시각
    deleted_by uuid REFERENCES profiles(user_id),  -- 삭제 실행자
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 과제 제출물 (버전 관리 및 채점 상태)
CREATE TABLE assignment_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES assignments(id),
    learner_id uuid NOT NULL REFERENCES profiles(user_id),
    version integer NOT NULL CHECK (version >= 1),
    answer_text text NOT NULL,
    answer_link text,
    status text NOT NULL CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
    late boolean NOT NULL DEFAULT FALSE,
    score integer CHECK (score BETWEEN 0 AND 100),
    feedback text,
    graded_at timestamptz,
    graded_by uuid REFERENCES profiles(user_id),  -- 채점자 추적
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, learner_id, version)
);

-- 주요 인덱스
CREATE INDEX courses_instructor_idx ON courses (instructor_id);
CREATE INDEX courses_status_idx ON courses (status);
CREATE INDEX courses_category_idx ON courses (category);
CREATE INDEX courses_difficulty_idx ON courses (difficulty);
CREATE INDEX courses_title_idx ON courses (title);
CREATE INDEX courses_created_at_idx ON courses (created_at DESC);

CREATE INDEX enrollments_course_idx ON enrollments (course_id);
CREATE INDEX enrollments_learner_idx ON enrollments (learner_id);

CREATE INDEX assignments_course_idx ON assignments (course_id);
CREATE INDEX assignments_is_deleted_idx ON assignments (is_deleted);
CREATE INDEX assignments_auto_close_at_idx ON assignments (auto_close_at) WHERE auto_close_at IS NOT NULL;
CREATE INDEX assignments_deleted_by_idx ON assignments (deleted_by) WHERE deleted_by IS NOT NULL;

CREATE INDEX assignment_submissions_assignment_idx ON assignment_submissions (assignment_id);
CREATE INDEX assignment_submissions_learner_idx ON assignment_submissions (learner_id);
CREATE INDEX assignment_submissions_graded_by_idx ON assignment_submissions (graded_by);

CREATE INDEX terms_versions_code_idx ON terms_versions (version_code);
CREATE INDEX terms_acceptances_user_idx ON terms_acceptances (user_id);
CREATE INDEX terms_acceptances_version_idx ON terms_acceptances (terms_version_id);
```
