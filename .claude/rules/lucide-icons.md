# lucide-react 아이콘 가용성 확인

## 규칙

lucide-react 아이콘을 코드에 사용하기 전, 반드시 해당 버전에서 아이콘이 존재하는지 확인한다.

```bash
node -e "const l = require('./node_modules/lucide-react'); console.log(typeof l.MapXIcon)"
# undefined → 존재하지 않음
# function  → 존재함
```

## 이유

lucide-react는 버전마다 아이콘명이 다르다. 추가/제거/이름 변경이 빈번하므로 추측하면 런타임 오류가 발생한다. `transport-route-finder` 구현 중 `MapXIcon`이 없어 컴포넌트 렌더 오류가 발생한 사례가 있다.

## 대안 탐색

없는 아이콘은 유사한 이름을 검색한다:

```bash
node -e "const l = require('./node_modules/lucide-react'); console.log(Object.keys(l).filter(k => k.toLowerCase().includes('map')))"
```
