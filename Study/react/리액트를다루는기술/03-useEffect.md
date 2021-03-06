# useEffect 완벽가이드
> https://overreacted.io/ko/a-complete-guide-to-useeffect/

## 1. 모든 렌더링은 고유의 Prop과 State가 있다.
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

// count의 값이 변경될 때 (state에 값이 변화될때의 동작)
// 처음 랜더링 시
function Counter() {
  const count = 0; // useState() 로부터 리턴
  // ...
  <p>You clicked {count} times</p>
  // ...
}

// 클릭하면 함수가 다시 호출된다
function Counter() {
  const count = 1; // useState() 로부터 리턴
  // ...
  <p>You clicked {count} times</p>
  // ...
}

// 또 한번 클릭하면, 다시 함수가 호출된다
function Counter() {
  const count = 2; // useState() 로부터 리턴
  // ...
  <p>You clicked {count} times</p>
  // ...
}
```
* **state를 업데이트 할때마다 컴포넌트를 호춣하며, 랜더 결과물은 counter의 상태값을 살펴본다.**
* **state함수 안의 값은 상수로서 존재하는 값**이며 독립적인 값이다(특정 렌더링시의 상태로 존재).
* 따라서 {count}는 어떠한 데이터 바인딩도 수행하지 않는다.
* `<p>You clicked {count} times</p>` 는 **렌더링 결과물에 숫자 값을 내장하는 것에 불과**하다.
* 어느 특정 렌더링시 그 안의 `count` **상수는 시간이 지나도 바뀌는 것이 아니라 `count`값을 보는 것**이다.

## 2. 모든 렌더링은 고유의 이벤트 핸들러를 가진다.
```javascript
function sayHi(person) {
  const name = person.name;
  setTimeout(() => {
    alert('Hello, ' + name);
  }, 3000);
}

let someone = {name: 'Dan'};
sayHi(someone);

someone = {name: 'Yuzhi'};
sayHi(someone);
```
* `sayHi` 내부에서 특정 호출마다 person 과 name 이라는 지역 상수가 존재한다.
* setTimeout 이벤트가 실행될 때마다가 고유의 name을 기억한다.

```javascript
// 처음 랜더링 시
function Counter() {
  const count = 0; // useState() 로부터 리턴
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + count);
    }, 3000);
  }
  // ...
}

// 클릭하면 함수가 다시 호출된다
function Counter() {
  const count = 1; // useState() 로부터 리턴
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + count);
    }, 3000);
  }
  // ...
}

// 또 한번 클릭하면, 다시 함수가 호출된다
function Counter() {
  const count = 2; // useState() 로부터 리턴
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + count);
    }, 3000);
  }
  // ...
}


// 처음 랜더링 시
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + 0);
    }, 3000);
  }
  // ...
  <button onClick={handleAlertClick} /> // 0이 안에 들어있음
  // ...
}

// 클릭하면 함수가 다시 호출된다
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + 1);
    }, 3000);
  }
  // ...
  <button onClick={handleAlertClick} /> // 1이 안에 들어있음
  // ...
}

// 또 한번 클릭하면, 다시 함수가 호출된다
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + 2);
    }, 3000);
  }
  // ...
  <button onClick={handleAlertClick} /> // 2가 안에 들어있음
  // ...
}
```
* 각각의 렌더링은 **고유한 버전의 `handleAlertClick`을 리턴하며, 고유의 `count`를 기억한다.**
* 특정 렌더링시 내부에서 props와 state는 영원히 같은 상태로 유지된다.
* **이벤트 핸들러 내부의 비동기 함수라 할지라도 같은 count값을 보게된다.**


## 3. 모든 랜더링은 고유의 이펙트를 가진다
* effect가 최신의 state 상태를 읽을 수 있는 것은 변하지 않는 effect안에서 state변수가 임의로 변경되는 것이 아니라, effect 함수 자체가 매 랜더링마다 별도로 존재하기 때문이다.
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      console.log(`You clicked ${count} times`);
    }, 3000);
  });
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```
* 즉 각각의 effect는 매번 렌더링에 속한 count값을 보는 것이다.
```javascript
// 최초 랜더링 시
function Counter() {
  // ...
  useEffect(
    // 첫 번째 랜더링의 이펙트 함수
    () => {
      document.title = `You clicked ${0} times`;
    }
  );
  // ...
}

// 클릭하면 함수가 다시 호출된다
function Counter() {
  // ...
  useEffect(
    // 두 번째 랜더링의 이펙트 함수
    () => {
      document.title = `You clicked ${1} times`;
    }
  );
  // ...
}

// 또 한번 클릭하면, 다시 함수가 호출된다
function Counter() {
  // ...
  useEffect(
    // 세 번째 랜더링의 이펙트 함수
    () => {
      document.title = `You clicked ${2} times`;
    }
  );
  // ..
}
```
* 리액트는 effect 함수를 기억해 뒀다가 **DOM의 변화를 처리하고 브라우저가 그리고 난 뒤 실행**한다.
* **사실 effect는 매 랜더링마다 다른 함수라는 뜻**
* 개념적으로 effect는 랜더링 결과의 일부라고 생각할 수 있다.

### 코드 실행 과정
1. 리액트는 state가 0일때의 ui를 보여준다.
2. 컴포넌트가 랜더링 결과물인 `<p>You clicked 0 times</p>` 를 그린다.
3. 컴포넌트는 effect를 실행한다. `() => { document.title = 'You clicked 0 times' }`
4. 리액트는 ui를 업데이트 하기 위해 dom에 변경된 값을 그린다.
5. 버튼을 클릭하면, 컴포넌트는 리액트에게 상태값을 1로 변경해달라고 요청한다.
6. 리액트는 상태가 1일때의 ui를 그린다.
7. 그리고 effect의 값을 다시 실행한다

## 4. 모든 랜더링은 고유의 ... 모든 것을 가지고 있다.
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      console.log(`You clicked ${count} times`);
    }, 3000);
  });
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
  // 0 1 2 3 4 5가 순서대로 찍힌다.
```
* 위의 코드를 뜸을 들이며 여러번 클릭할 경우, 로그는 순서대로 출력된다. 각각의 타이머는 특정 렌더링에 속하기 때문에 **그 시점의 count 값을 가지기 때문이다.**
* 클래스형 컴포넌트의 경우 순서대로 출력되지 않는데 클래스형 컴포넌트의 `this.state.count`의 값은 언제나 최신의 값을 가리키기 때문에 매번 5가 찍힌다.
* 클래스 컴포넌트의 경우 전통적 타임아웃에서 잘못된 값을 가져오는데 주로 클로저와 연관이 있다. 
* **클로저는 접근하려는 값이 절대 바뀌지 않을 때 유용하다. 반드시 상수를 참조하고 있기 때문에 생각을 하기 쉽도록 만들어준다.** 클로저를 사용하면 클래스 컴포넌트도 순서대로 값이 출력되기 변경이 가능하다.

## 5. 흐름 거슬러 올라가기
* **컴포넌트의 렌더링 안에 있는 모든 함수 (이벤트 핸들러, 이펙트, 타임아웃이나 그 안에서 호출되는 API 등) 렌더가 호출될 때 정의된 props와 state 값을 잡아둔다**
```javascript
// 두 예제는 같다.
function Example(props) {
  useEffect(() => {
    setTimeout(() => {
      console.log(props.counter);
    }, 1000);
  });
  // ...
}

function Example(props) {
  const counter = props.counter;
  useEffect(() => {
    setTimeout(() => {
      console.log(counter);
    }, 1000);
  });
  // ...
}
```
* **props나 state를 컴포넌트 안에서 일찍 읽어 들였는지 아닌지는 상관이 없다!**
* effect 안에서 정의해둔 콜백에서 사전에 잡아둔 값이 아닌 **최신의 값을 이용하고 싶을 때 쉬운 방법으로는 `ref`를 이용하는 방법이 있다.** 
* 과거의 랜더링 시점에서 미래의 `props 나 state` 를 조회할때 주의해야 하는 점은 **흐름을 거슬러 올라가는 일**이다.
```javascript
function Example() {
  const [count, setCount] = useState(0);
  const latestCount = useRef(count); // 1.
  useEffect(() => {
    // 변경 가능한 값을 최신으로 설정한다
    latestCount.current = count; // 2
    setTimeout(() => {
      // 변경 가능한 최신의 값을 읽어 들인다
      console.log(`You clicked ${latestCount.current} times`); // 3
    }, 3000);
  });
```
* 미리 잡아둔 props 및 state와는 달리 특정 콜백에서 latestCount.current 의 값을 읽어 들일 때 언제나 같은 값을 보장하지 않는다.
* 정의된 바에 따라서 이 값은 언제나 변경될 수 있다는 점을 주의해야한다.

## 6. 클린업(cleanup)
* effect의 클린업의 목적은 구독과 같은 이펙트를 **되돌리는** 것이다.
```javascript
// 첫번째 렌더링에서 `prop 이 {id: 10}`이고, 두번째 렌더링에서 `{id: 20}`이라고 할 경우.
useEffect(() => {
  ChatAPI.subscribeToFriendStatus(props.id, handleStatusChange);
  return () => {
    ChatAPI.unsubscribeFromFriendStatus(props.id, handleStatusChange);
  };
});
```
* 리액트는 **브라우저가 페인트 하고 난 뒤**에 effect를 실행한다.
* **이전 effect는 새 prop과 함께 리렌더링 되고 난 뒤에 클린업된다.**
1. 리액트가 `{id: 20}`을 가지고 UI를 렌더링한다.
2. 브라우저가 돔을 그린다. 화면상에서 `{id: 20}` 이 반영된 UI를 볼 수 있다.
3. 리액트는 `{id: 10}` 에 대한 effect를 클린업한다.
4. 리액트가 `{id: 20}` 에 대한 effect를 실행한다.
