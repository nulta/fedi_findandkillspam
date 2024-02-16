# fedi_findandkillspam
find and kill those spam posts

- misskey only (yet)
- 100% NOT tested (yet)
- no websocket, but fetches new post every second (yet)

## Usage
1. Install [Deno](https://github.com/denoland/deno/releases)
2. From any moderator account, create a access token
    - `write:notes` and `write:admin:suspend-user` permission is required
3. Configure the script
    - open the file `misskey_find_and_kill_spam.ts`
    - `const SERVER_URL = "https://misskey.example.com/"` <-- Insert your URI here
    - `const API_ACCESS_TOKEN = ""` <-- Insert your access token here
4. Run `deno run --allow-net misskey_find_and_kill_spam.ts` to start the script

## 사용법
1. [Deno](https://github.com/denoland/deno/releases)를 받습니다
2. 모더레이터 권한 이상 가진 계정에서, 엑세스 토큰을 하나 발급합니다
3. 스크립트 설정을 합니다
    - `misskey_find_and_kill_spam.ts`을 열고
    - `const SERVER_URL = "https://misskey.example.com/"` <-- 인스턴스 URL 넣고
    - `const API_ACCESS_TOKEN = ""` <-- 큰따옴표 안에 엑세스 토큰 넣습니다
4. `deno run --allow-net misskey_find_and_kill_spam.ts`으로 실행합니다

### 작동방식
- 매 초 글로벌 타임라인을 확인합니다
- 생성일자가 짧은 계정이 수상할 정도로 멘션이 많은 공개 노트를 올린다면, 계정을 정지하고 노트는 삭제합니다
- 서버 단위가 아닌 유저 단위로 작동합니다
