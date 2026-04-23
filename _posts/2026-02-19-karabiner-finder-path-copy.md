---
title: Finder에서 파일 경로를 바로 복사하는 Karabiner 단축키
date: 2026-02-19 10:00:00 +0900
categories:
  - 도구
  - Mac
tags:
  - karabiner
  - finder
  - macos
  - claude-code
description: Karabiner-Elements로 Finder에서 절대 경로와 이스케이프 경로를 단축키 하나로 복사하는 방법.
---

Claude Code를 쓰다 보면 파일이나 디렉토리의 경로를 전달해야 할 때가 자주 있다. "이 파일 읽어줘", "이 디렉토리 구조를 파악해줘" 같은 요청을 하려면 정확한 경로가 필요하다.

Finder에서 파일을 보고 있는데 그 경로를 바로 복사할 수 있으면 편하겠다고 생각해서, Karabiner-Elements로 두 가지 단축키를 만들었다.

## macOS 기본 기능의 한계

macOS Finder에는 `Option+Cmd+C`로 "경로 이름 복사" 기능이 있다. 하지만 사용하다 보니 두 가지 아쉬운 점이 있었다.

첫째, 경로를 복사하려면 먼저 마우스로 파일을 선택해야 한다. 키보드에서 마우스로 손이 오가는 게 느렸고, 현재 폴더의 경로만 필요할 때도 파일을 클릭해야 하는 게 번거로웠다.

둘째, 경로에 공백이나 특수문자가 있어도 이스케이프 없이 그대로 복사한다.

```bash
cd /Users/user/Dropbox (Maestral)/dev
# -bash: syntax error near unexpected token `('
```
{: .nolineno }

`Dropbox (Maestral)` 같은 폴더명을 터미널에 그대로 붙여넣으면, 셸이 공백과 괄호를 구문 요소로 해석해서 에러가 난다.

## 두 가지 단축키

Karabiner-Elements의 `shell_command`를 이용해서 두 가지 복사 방식을 만들었다.

| 단축키 | 기능 | 복사 결과 |
|--------|------|-----------|
| `Cmd+Shift+C` | 절대 경로 복사 | `/Users/user/Dropbox (Maestral)/file.txt` |
| `Cmd+Option+Shift+C` | 이스케이프 경로 복사 | `/Users/user/Dropbox\ \(Maestral\)/file.txt` |

두 단축키 모두 파일을 선택한 상태에서는 해당 파일의 경로를, 아무것도 선택하지 않은 상태에서는 현재 폴더의 경로를 복사한다.

**절대 경로**는 Claude Code처럼 내부적으로 경로를 처리하는 도구에 전달할 때 사용한다.

**이스케이프 경로**는 터미널에 직접 붙여넣을 때 사용한다. 공백은 `\ `로, 괄호는 `\(`, `\)`로 자동 변환된다.

## 동작 원리

두 단축키 모두 AppleScript로 Finder에서 경로를 가져온다.

```applescript
tell application "Finder"
  set selectedItems to selection
  if (count of selectedItems) > 0 then
    -- 선택된 항목의 경로
    POSIX path of (item 1 of selectedItems as alias)
  else
    -- 현재 폴더의 경로
    POSIX path of (target of front window as alias)
  end if
end tell
```

절대 경로 버전은 AppleScript 안에서 `set the clipboard to`로 바로 클립보드에 저장한다.

이스케이프 버전은 AppleScript의 출력을 파이프로 후처리한다.

```bash
osascript ... | tr -d '\n' | perl -pe 's/([ ()])/\\$1/g' | pbcopy
```
{: .nolineno }

| 단계 | 명령 | 역할 |
|------|------|------|
| 1 | `tr -d '\n'` | 줄바꿈 제거 |
| 2 | `perl -pe 's/([ ()])/\\$1/g'` | 공백, 괄호를 `\`로 이스케이프 |
| 3 | `pbcopy` | 클립보드에 복사 |

앞에 붙인 `export LC_ALL=en_US.UTF-8`은 한글 파일명이 포함된 경로를 올바르게 처리하기 위한 설정이다.

## Karabiner 설정

`~/.config/karabiner/karabiner.json`{: .filepath}의 `rules` 배열에 다음 두 규칙을 추가한다.

### 절대 경로 복사 (Cmd+Shift+C)

```json
{
    "description": "Cmd+Shift+C to copy selected file path in Finder",
    "manipulators": [
        {
            "conditions": [
                {
                    "bundle_identifiers": ["^com\\.apple\\.finder$"],
                    "type": "frontmost_application_if"
                }
            ],
            "from": {
                "key_code": "c",
                "modifiers": { "mandatory": ["command", "shift"] }
            },
            "to": [{
                "shell_command": "osascript -e 'tell application \\\"Finder\\\"' -e 'set selectedItems to selection' -e 'if (count of selectedItems) > 0 then' -e 'set the clipboard to POSIX path of (item 1 of selectedItems as alias)' -e 'else' -e 'set the clipboard to POSIX path of (target of front window as alias)' -e 'end if' -e 'end tell'"
            }],
            "type": "basic"
        }
    ]
}
```

### 이스케이프 경로 복사 (Cmd+Option+Shift+C)

```json
{
    "description": "Cmd+Option+Shift+C to copy escaped file path in Finder",
    "manipulators": [
        {
            "conditions": [
                {
                    "bundle_identifiers": ["^com\\.apple\\.finder$"],
                    "type": "frontmost_application_if"
                }
            ],
            "from": {
                "key_code": "c",
                "modifiers": { "mandatory": ["command", "option", "shift"] }
            },
            "to": [{
                "shell_command": "export LC_ALL=en_US.UTF-8; osascript -e 'tell application \\\"Finder\\\"' -e 'set selectedItems to selection' -e 'if (count of selectedItems) > 0 then' -e 'POSIX path of (item 1 of selectedItems as alias)' -e 'else' -e 'POSIX path of (target of front window as alias)' -e 'end if' -e 'end tell' | tr -d '\\\\n' | perl -pe 's/([ ()])/\\\\\\\\$1/g' | pbcopy"
            }],
            "type": "basic"
        }
    ]
}
```

> `frontmost_application_if` 조건 덕분에 Finder에서만 동작한다. 다른 앱에서는 기존 `Cmd+Shift+C` 동작이 유지된다.
{: .prompt-info }

## 마무리

단순한 설정이지만 거의 매일 쓰는 기능이 됐다. CLI 도구로 작업하면서 경로를 자주 전달해야 한다면, 한번 설정해두면 유용하게 쓸 수 있을 것이다.
