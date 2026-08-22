<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 프로젝트 작업 지침

## 기본 원칙

1. 유지보수가 쉬운 코드를 최우선으로 한다.
2. 복잡한 구조나 과도한 추상화는 피한다.
3. 읽기 쉬운 변수명, 함수명, 파일명을 사용한다.
4. 한 파일에 너무 많은 기능을 넣지 않는다.
5. 기존 구조를 크게 바꾸기 전에 사용자에게 설명한다.
6. 불필요한 라이브러리를 추가하지 않는다.
7. 새 라이브러리가 필요하면 설치 전에 필요한 이유, 가능한 대안, 설치 후 변경되는 파일을 설명하고 승인을 받는다.
8. 표준적이고 널리 사용되는 기술과 패턴을 사용한다.
9. 실험적이거나 유지보수가 어려운 기술은 사용하지 않는다.
10. 필요한 경우에만 간단한 한국어 주석을 추가한다.

## 작업 승인 규칙

코드 수정, 파일 생성·삭제, 패키지 설치, DB 구조 변경 전에는 반드시 사용자 승인을 받는다.

작업 요청을 받으면 먼저 수정 내용, 변경될 파일, 변경 이유, 예상 영향, 위험 요소를 설명하고 다음 문장으로 확인한다.

> 이대로 진행할까요?

사용자가 명시적으로 진행을 승인한 경우에만 실제 변경 작업을 수행한다.

### 승인 없이 가능한 작업

- 코드 읽기
- 파일 구조 확인
- 오류 분석
- 로그 확인
- 문제 원인 설명
- 수정 방법 제안
- 코드 리뷰
- 현재 상태 요약

실제 파일 변경은 승인 없이 수행하지 않는다.

## 초보자 사용자 대응

- 어려운 용어는 쉽게 설명한다.
- 한 번에 너무 많은 명령어를 안내하지 않는다.
- 가능한 한 한 단계씩 진행한다.
- 터미널 명령어는 복사해서 바로 실행할 수 있게 제공한다.
- 오류 발생 시 원인을 먼저 설명한 후 수정 방법을 제안한다.
- 이해하기 어려운 내용에는 간단한 예시를 함께 제공한다.

## 코드 작성 원칙

우선순위는 단순함, 가독성, 유지보수성, 안정성, 성능 순서로 한다.

성능 최적화를 위해 코드를 불필요하게 복잡하게 만들지 않는다. 중복 코드가 조금 있는 것보다 지나치게 복잡한 공통화가 더 나쁘다고 판단한다.

## 프로젝트 구조 변경

폴더 구조 변경, 파일 대량 이동, 리팩터링은 작은 단위로 진행한다.

대규모 변경은 DB 변경, 테스트, API 변경, 테스트, UI 변경, 테스트 순서로 단계별 수행하고 각 단계가 끝나면 결과를 사용자에게 설명한다.

## 보안 규칙

다음 정보를 코드에 직접 넣지 않는다.

- API Key
- Secret Key
- Password
- Access Token
- 쿠팡 Access Key
- 쿠팡 Secret Key
- OpenAI API Key
- DB Password

민감한 정보는 `.env` 또는 GitHub Codespaces Secrets를 사용한다. `.env` 파일이 Git에 커밋되지 않는지 확인한다.

## Git 규칙

중요한 변경 전에는 가능하면 현재 Git 상태를 확인한다.

사용자가 원하면 큰 변경 전에 커밋을 권장하지만, 승인 없이 커밋하지 않는다.

사용자 승인 없이 다음 작업을 수행하지 않는다.

- force push
- `reset --hard`
- 브랜치 삭제
- 커밋 기록 변경

## 오류 처리

오류가 발생하면 오류 메시지 확인, 원인 분석, 가능한 원인 설명, 최소 수정 방법 제안, 사용자 승인, 수정, 테스트 순서로 처리한다.

## 프로젝트 목적

여러 온라인 마켓의 상품 등록 및 판매 관리를 자동화한다.

장기적으로 쿠팡, 네이버 스마트스토어, 11번가, G마켓, 옥션을 지원하며 처음에는 쿠팡부터 구현한다.

## 기본 기술 스택

- Next.js
- TypeScript
- Tailwind CSS
- Node.js
- PostgreSQL
- Prisma
- GitHub Codespaces

## 개발 방식

기능을 한 번에 많이 만들지 않고 작은 MVP 단위로 진행한다.

개발 우선순위는 상품 입력 화면, 상품 DB 저장, 상품 조회, 쿠팡 API 연동, AI 상품정보 생성, 다른 마켓 추가, 주문 및 재고 자동화 순서로 한다.

각 단계가 정상 작동한 것을 확인한 후 다음 단계로 넘어간다.

## 작업 완료 보고

작업이 끝나면 변경한 파일, 변경 내용, 실행한 명령어, 테스트 결과, 남아 있는 문제, 다음 추천 단계를 한국어로 안내한다.
