# fedi_findandkillspam (Rev 4)
find and kill those global spam posts

- misskey only (yet)
- ~~100% NOT tested (yet)~~ **Tested, works well!** Big thanks to buttersc.one's really awesome administrators.
- no websocket, but fetches new post every second (yet)

## Usage
1. Install [Deno](https://github.com/denoland/deno/releases)
2. From any moderator account, create a access token
    - `write:notes` and `write:admin:suspend-user` permission is required
    - You must use API Console to create a access token which has `write:admin:suspend-user` permission.
    - Settings -> API -> API Console
    - *Endpoint*: `miauth/gen-token`
    - Set *Params* like this:
    ```
    {
      session: null,
      name: 'FindAndKillSpam',
      description: 'github.com/nulta/fedi_findandkillspam',
      permission: ['read:account', 'write:notes', 'write:admin:suspend-user'],
    }
    ```
    - Send. You'll see the token below.
3. Configure the script
    - open the file **misskey_find_and_kill_spam.ts**
    - `const SERVER_URL = "https://misskey.example.com/"` <-- Insert your URI here
    - `const API_ACCESS_TOKEN = ""` <-- Insert your access token here
4. Run `deno run --allow-net misskey_find_and_kill_spam.ts` to start the script

## 사용법
1. [Deno](https://github.com/denoland/deno/releases)를 받습니다
2. 모더레이터 권한 이상 가진 계정에서, 엑세스 토큰을 하나 발급합니다
    - **관리자 권한을 사용하려면, API Console을 통해서 토큰을 발급받아야 합니다!**
    - 설정 -> API에서, API Console을 엽니다.
    - Endpoint를 `miauth/gen-token`로 설정합니다.
    - Params 칸에 아래 코드를 붙여넣습니다.
    ```
    {
      session: null,
      name: 'FindAndKillSpam',
      description: 'github.com/nulta/fedi_findandkillspam',
      permission: ['read:account', 'write:notes', 'write:admin:suspend-user'],
    }
    ```
    - Send 버튼을 누릅니다. 정지 권한이 있는 토큰을 발급받았습니다.
    ![image](https://github.com/nulta/fedi_findandkillspam/assets/35414766/7bcb77b5-2057-406f-9680-623bf2987158)

3. 스크립트 설정을 합니다
    - **misskey_find_and_kill_spam.ts**을 열고
    - `const SERVER_URL = "https://misskey.example.com/"` <-- 인스턴스 URL 넣고
    - `const API_ACCESS_TOKEN = "InsertApiAccessTokenHere"` <-- 큰따옴표 안에 엑세스 토큰 넣습니다
4. `deno run --allow-net misskey_find_and_kill_spam.ts`으로 실행합니다

### 작동방식
- 매 초 글로벌 타임라인을 확인합니다
- 생성일자가 짧은 계정이 수상할 정도로 멘션이 많은 공개 노트를 올린다면, 계정을 정지하고 노트는 삭제합니다 (요격합니다)
- 서버 단위가 아닌 유저 단위로 작동합니다
    - 서버에서 별도의 설정을 할 필요가 없습니다
    - 네, 원래는 사람 모더레이터가 했을 일을 얘가 대신 한다고 생각하시면 됩니다.

### 비고
**Rev 3부터 제대로 작동합니다.** 그 전까지는 제대로 테스트를 못 했어요...
**현재 버전은 Rev 4입니다** 변경 사항: 스팸 체크 로직 개선, 업데이트 자동 확인 기능 추가.
