---
title: "Mac + Android 환경에서 Obsidian 동기화하기: Maestral을 선택한 이유"
date: 2025-01-10 14:00:00 +0900
categories:
  - 개발
  - 도구
tags:
  - obsidian
  - maestral
  - dropbox
  - 동기화
  - macos
  - android
---

백엔드 개발자로 일하면서 Obsidian으로 문서를 관리하고 있다. 맥북 2대와 안드로이드 폰을 사용하는 환경이라, 처음엔 동기화가 간단할 줄 알았다. 하지만 실제로는 꽤 오래 걸렸고, 여러 시행착오 끝에 지금의 설정에 정착했다.

Google Drive와 Dropbox 공식 앱을 거쳐 Maestral이라는 오픈소스 클라이언트를 쓰게 된 과정을 정리해본다.

---

## Google Drive: 한글 파일명 문제

안드로이드를 쓰고 있어서 Google Drive가 당연한 선택지처럼 보였다. 실제로 처음에는 큰 문제없이 동작하는 것 같았는데, 시간이 지나면서 이상한 현상이 나타났다.

### 문제 상황

일부 마크다운 파일의 이름이 멋대로 바뀌어 있었다. 예를 들면 이런 식이다.

```
원래 이름: 2024-01-01 데일리노트_가나다라마바사.md
바뀐 이름: 2024-01~1.md
```

파일명 중간에 물결표가 들어가고 나머지는 잘려나간다. 처음엔 뭔가 잘못 건드린 줄 알았는데, 규칙적으로 발생했다.

### 원인

macOS와 Google Drive의 파일명 인코딩 처리 방식이 충돌하는 문제였다.

macOS는 한글 파일명을 저장할 때 NFD(Normalization Form Canonical Decomposition) 방식을 사용한다. 쉽게 말하면 '한'이라는 글자를 'ㅎ + ㅏ + ㄴ'처럼 자소로 분리해서 저장한다는 뜻이다.

반면 Google Drive는 NFC(Normalization Form Canonical Composition) 방식을 기대한다. 윈도우나 웹 환경의 표준 방식이다. 동기화 과정에서 NFD 파일명을 인식하지 못하거나 너무 긴 이름으로 오판하는 경우가 있었고, 결국 MS-DOS 시절의 8.3 파일명 규칙으로 강제 변환해버렸다.

`convmv` 같은 툴로 인코딩을 변환하거나 파일명에서 특수문자를 제거하면 되긴 한다. 하지만 파일을 만들 때마다 이런 걸 신경 써야 한다는 게 말이 안 된다고 생각했다. Google Drive는 포기했다.

---

## Dropbox 공식 앱: 동기화 지연

Dropbox로 옮기면서 파일명 문제는 사라졌다. 하지만 다른 문제가 생겼다.

### 문제 상황

한쪽 맥북에서 문서를 수정하고 저장했는데, 다른 맥북에서 열어보면 이전 버전 그대로였다. Dropbox 아이콘은 '최신 상태'라고 표시되는데 실제로는 동기화가 안 된 상태였다. 앱을 재시작해도 동기화가 시작되지 않았다.

파일 속성을 확인해봐도 특별한 문제는 없었다. 단순히 Dropbox가 파일 변경을 감지하지 못하는 것 같았다.

### 원인

macOS의 파일 시스템 API가 변경되면서 Dropbox 공식 클라이언트가 파일 변경 이벤트(FSEvent)를 놓치는 경우가 생긴 것으로 보인다.

특히 Obsidian처럼 임시 파일을 만들어서 원본과 교체하는 방식(Atomic Save)으로 저장하는 에디터에서 이런 문제가 자주 발생한다고 한다. 공식 앱이 무겁다는 점도 마음에 들지 않았다.

---

## Maestral: 현재 사용 중인 솔루션

공식 앱 대신 Maestral이라는 오픈소스 Dropbox 클라이언트를 찾았다.

### Maestral 특징

Python으로 작성된 Dropbox 클라이언트다. 공식 앱에 있는 무거운 기능들을 제거하고 동기화 자체에만 집중한다.

메모리 점유율이 낮고, macOS의 FSEvent를 정확하게 감지한다. `.mignore` 파일로 동기화 제외 대상을 설정할 수 있고, CLI 명령어도 지원해서 개발자가 쓰기 편하다.

### 설정 방법

기존 Dropbox 앱과 충돌을 피하기 위해 연결을 해제하고 삭제했다.

Homebrew로 Maestral을 설치한다.

```bash
brew install --cask maestral
```

Maestral을 실행하고 로그인하면 `~/Dropbox (Maestral)` 폴더가 생성된다. Obsidian 볼트를 이 폴더로 옮겼다.

Obsidian 볼트 루트 폴더에 `.mignore` 파일을 만들어서 동기화 제외 대상을 설정했다. `.gitignore`와 동일한 문법을 사용한다.

```
# .mignore 예시
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.trash/
```

이후 모든 문제가 해결됐다. 한쪽 맥에서 수정하면 다른 맥에 거의 즉시 반영된다. 파일명이 깨지는 일도 없다.

안드로이드에서는 Dropsync 앱으로 해당 폴더를 연결해서 사용하고 있다.

---

## 정리

Mac과 Android 환경에서 Obsidian을 동기화해야 한다면 다음과 같이 설정하는 걸 추천한다.

Google Drive는 한글 파일명 처리에 문제가 있어서 권장하지 않는다. Dropbox 공식 앱은 가끔 파일 변경을 감지하지 못하는 경우가 있다.

Mac에는 Maestral을, Android에는 Dropsync를 설치하면 안정적으로 동기화할 수 있다.

참고로 Maestral은 스마트 동기화(온라인 전용)를 지원하지 않아서 모든 파일을 로컬에 다운로드한다. 텍스트 중심의 Obsidian 사용자라면 문제없지만, 대용량 파일을 다룬다면 고려해야 할 부분이다.
