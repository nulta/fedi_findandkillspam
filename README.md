# fedi_findandkillspam (Rev 5)
Find and kill those global spam posts.

- ~~misskey only (yet)~~ **Now with Mastodon, too!**
- ~~100% NOT tested (yet)~~ **Tested, works well!** Big thanks to buttersc.one's really awesome administrators.

## Usage
1. Install [Deno](https://github.com/denoland/deno/releases)
2. From any moderator account, create a API access token
    - See instructions below
3. Download `start.ts`, `config.json`, and `start.bat` (or `start.sh`)
    - With auto-update, other files are not required.
    - `start.bat` is for Windows, `start.sh` is for others.
4. Configure the script
    - open the file **config.json**
    ```jsonc
    {
        "Mastodon": false,  // <-- Set this to true, if your instance is Mastodon
        "Misskey": false,   // <-- Set this to true, if your instance is Misskey

        // In Misskey, should we automatically suspend the user who posted spam post?
        // If false, we only delete the suspicious note.
        // (Mastodon does not support deleting toots from API, so we always suspend the user.)
        "Misskey_ShouldBanUser": false,

        "Site": "https://instancename.example.com/",  // <-- Your instance URL here
        "ApiKey": "???????"  // <-- Your API access token here (see 2.)
    }
    ```
5. Run `start.sh` or `start.bat` to start the script.
    - **Automatically fetches and executes latest script from this GitHub repo.**
    - If you don't want to use auto-update, you can use `local.ts` instead.

### (Misskey) Getting the API access token
- You must use Misskey API to create a access token with administrative permissions.
1. Open the AiScript scratchpad (on /scratchpad)
2. Execute the AiScript below. You'll get the token.
```
<: "Token is:"
<: Mk:api("miauth/gen-token" {
  session: null,
  name: 'Fedi_FindAndKillSpam',
  description: 'github.com/nulta/fedi_findandkillspam',
  permission: ['read:account', 'write:notes', 'write:admin:suspend-user'],
}).token
```

### (Mastodon) Getting the API access token
1. Settings -> Development -> New Application
2. Fill out the *Application name* as you like
3. in *Scopes*, Allow the `read:statuses` and `admin:write:accounts`
4. Submit, and you'll see *Your access token*.


## 사용법
1. [Deno](https://github.com/denoland/deno/releases)를 설치합니다
2. 모더레이터 권한이 있는 계정에서, API 액세스 토큰을 발급합니다
    - 아래의 설명을 보세요
3. `start.ts`, `config.json`, (`start.bat` 또는 `start.sh`)을 내려받습니다
    - 자동 업데이트를 사용한다면, 나머지 파일들은 필요없습니다.
    - Windows라면 `start.bat`, 리눅스 계통이라면 `start.sh`를 내려받습니다.
4. 설정을 합니다
    - **config.json**을 열고 값을 수정합니다
    ```jsonc
    {
        "Mastodon": false,  // <-- 마스토돈이라면, true로 설정하세요
        "Misskey": false,   // <-- 미스키라면, true로 설정하세요

        // 미스키에서, 스팸을 올린 사용자를 자동으로 정지할지 정합니다.
        // false일 경우 노트만 삭제하고 사용자를 정지하지는 않습니다.
        // (마스토돈에서는 노트 삭제를 지원하지 않습니다. 그래서 항상 정지합니다.)
        "Misskey_ShouldBanUser": false,

        "Site": "https://instancename.example.com/",  // <-- 인스턴스의 주소를 넣으세요
        "ApiKey": "???????"  // <-- API 액세스 토큰을 넣으세요 (아래 설명 참조)
    }
    ```
5. `start.sh` 또는 `start.bat`을 실행해서 가동합니다.
    - **자동으로 가장 최신 스크립트를 github에서 받아와 실행합니다.**
    - 자동 업데이트를 원치 않을 경우, `local.ts`를 대신 사용할 수 있습니다.

### (Misskey) API 액세스 토큰 얻기
- 관리자 권한을 사용하려면, 미스키 API를 통해서 토큰을 발급받아야 합니다.
1. AiScript 스크래치 패드를 엽니다. (/scratchpad)
2. 아래의 AiScript를 실행합니다. 그러면 토큰이 나옵니다.
```
<: "Token is:"
<: Mk:api("miauth/gen-token" {
  session: null,
  name: 'Fedi_FindAndKillSpam',
  description: 'github.com/nulta/fedi_findandkillspam',
  permission: ['read:account', 'write:notes', 'write:admin:suspend-user'],
}).token
```

### (Mastodon) API 액세스 토큰 얻기
1. 설정 -> 개발 -> 새로운 애플리케이션
2. *애플리케이션 이름*은 마음대로 설정합니다
3. `read:statuses`와 `admin:write:accounts` 권한을 허용하고 제출합니다.
4. *액세스 토큰*을 얻었습니다.

### 작동방식
- 매 초 글로벌 타임라인을 확인합니다
- 수상한 계정이 수상한 노트를 올린다면, 자동으로 요격합니다
- 서버 단위가 아닌 유저 단위로 작동합니다
    - 서버에서 별도의 설정을 할 필요가 없습니다
    - 네, 원래는 사람 모더레이터가 했을 일을 얘가 대신 한다고 생각하시면 됩니다.
    - 네, **아무 컴퓨터에나 켜놓아도 잘 작동합니다.** 그냥 누군가의 개인 데스크탑이나 노트북에서 켜 놔도, 컴퓨터를 끄지 않는 한 (+절전모드로 들어가지 않는 한) 잘 작동합니다.
        - 물론 운영체제도 상관없습니다. Deno가 돌아가는 한 잘 작동합니다.
        - 위에도 쓰여있듯, 모더레이터가 하는 일을 자동화한 것과 같습니다.
        - 다른 사람 컴퓨터에서 돌리는 것도 가능은 합니다만, API 액세스 토큰 유출에 주의하셔야 합니다. 신뢰할 수 있는 경우 그렇게 하셔도 됩니다.

### 비고
**Rev 3부터 제대로 작동합니다.** 그 전까지는 제대로 테스트를 못 했어요...

**Rev 5부터 자동 업데이트를 지원합니다.** 서버에서 최신 스크립트를 자동으로 받아와서 실행합니다. (다만, 보안상 신경쓰이는 부분이 있다면 로컬로 실행하는 것이 나을 수도 있습니다.)
