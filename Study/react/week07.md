# firebase에서 쿼리 사용하기

- 날짜순으로 정렬

```javascript
// firestore에서 데이터를 전체 가져옴.
const postDB = firestore.collection("post");

// query 가져오기, orderBy로 날짜 순으로 정리
// orderBy("insert_dt", "desc"), insert_dt기준으로 정리 desc는 역순으로 정렬
// .limit(2);는 몇개씩 짤라서 가져올건지. (2)는 2개
let query = postDB.orderBy("insert_dt", "desc").limit(2);
```

# 무한 스크롤

- 무한 스크롤을 위해 firestore에서 데이터를 통으로 가져오지 않고 필요한 만큼 잘라서 가져오는 방법 배우기

## 무한 스크롤 만들기 전 생각하기

1. 결국 페이징 처리를 한다는 것. (1 페이지 이런식으로 버튼 누르지 않고 한다)

- 게시물을 10개, 5개 이런식으로 나눠서 가져와야 한다.

2. 10개를 가져왔으면 두번째는 11번째부터 가져올 수 있어야 한다.
3. 무한 스크롤이란건 스크롤 이벤트와 같이 사용해야 한다. (이벤트를 효과적으로 사용)

- 사용자가 스크롤을 더이상 하지 않거나, 스크롤이 끝났을때를 생각해서 해야한다.
- 스크롤을 내려도 끊기지 않게 잘 내려오도록 `Throttle`를 사용한다. (Devounce는 뚝뚝 끊기기 때문에 / 스크롤이 뚝 끊겨야 일어난다.)
- 스크롤의 경우 몇번이고 바닥 영역에 닿을 수 있어서 다음거를 불러오고, 요청을 보내고 응담을 보냈는데 다음걸 못받으면 리스트에 계속 다음것이 추가되는데, 다음 거가 가져와지는 중인지 아닌지 판별자가 필요하다.
- 스크롤을 내려서 마지막에 닿았을때 다음 리스트가 있는지 없는지 판별자를 줘야 한다.

```javascript
const initialState = {
  list: [],
  // paging 조건을 추가
  paging: { start: null, next: null, size: 3 },
  // 판별자 체크를 위해 선언
  is_loading: false,
};

// 3개를 보여줄거지만 설정은 4개를 가져온다.
// 만약 4개를 다 가져왔으면 3개짜리 리스트에서 다음 페이지가 있는것이다. (1개는 다음거니까) 그리고 리덕스에는 3개만 넣는다.
let query = postDB.orderBy("insert_dt", "desc").limit(4);
```

```javascript
const LOADING = "LOADING";
const initialState = {
  list: [],
  // paging 조건을 추가
  paging: { start: null, next: null, size: 3 },
  // 판별자 체크를 위해 선언
  is_loading: false,
};
const setPost = createAction(SET_POST, (post_list, paging) => ({
  post_list,
  paging,
}));
const loading = createAction(LOADING, (is_loading) => ({ is_loading }));
const getPostFB = (start = null, size = 2) => {
  return function (dispatch, getState, { history }) {
    // state에서 페이징 정보 가져오기
    let _paging = getState().post.paging;
    // 시작 정보가 기록되었는데 다음 데이터가 없을때는 뒤에 코드 실행 안되게 막기
    if (_paging.start && !_paging.next) {
      return;
    }

    // 다음 목록이 있으면 실행

    dispatch(loading(true));
    const postDB = firestore.collection("post");

    // query 가져오기, orderBy로 날짜 순으로 정리
    // orderBy("insert_dt", "desc"), insert_dt기준으로 정리 desc는 역순으로 정렬
    // .limit(2);는 몇개씩 짤라서 가져올건지. (2)는 2개
    // 무한스크롤
    // 3개를 보여줄거지만 설정은 4개를 가져온다.
    // 만약 4개를 다 가져왔으면 3개짜리 리스트에서 다음 페이지가 있는것이다. (1개는 다음거니까)
    // 그리고 리덕스에는 3개만 넣는다.
    let query = postDB.orderBy("insert_dt", "desc");

    // 첫번째는 시작점을 안가져온다.
    // (만약 어디서부터 가져와야한다는 조건이 필요하면 그 시작점을 firebase에서 쿼리 커서로 데이터 페이지화에서 startAt을 쓴다.)
    if (start) {
      // 만약 start정보가 있으면, 시작점을 start로 넣어준다.
      query = query.startAt(start);
    }

    query
      .limit(size + 1)
      .get()
      .then((docs) => {
        let post_list = [];

        let paging = {
          start: docs.docs[0],
          // 마지막 정보를 넣어준다.
          // 4개를 가지고 오게 했는데 4개를 다 가져올수도 있지만 4개에 안맞는 정보를 가져올 수 있다.
          next:
            // docs의 길이가 size+1랑 같니? -> 내가 4개 들고오게 했는데 그거랑 같니?
            docs.docs.length === size + 1
              ? // 같으면 다음 페이지에 가기 위한 조건처리 length - 1을 해주면 배열의 4번째꺼
                docs.docs[docs.docs.length - 1]
              : // size에 맞지않다 = 다음께 없다.
                null,
          size: size,
        };

        docs.forEach((doc) => {
          let _post = doc.data();

          //  Object.keys() 는 key값들을 배열      let post_list = [];로 만들어준다. ['contents', 'comment_cnt'...]
          let post = Object.keys(_post).reduce(
            (acc, cur) => {
              if (cur.indexOf("user_") !== -1) {
                return {
                  ...acc,
                  user_info: { ...acc.user_info, [cur]: _post[cur] },
                };
              }
              return { ...acc, [cur]: _post[cur] };
            },
            { id: doc.id, user_info: {} }
          );
          // push를 해서 총 게시글이 4개들어감. 무한스크롤을 위해 1개 삭제
          post_list.push(post);
        });
        // 무한 스크롤을 위해 마지막 정보는 삭제해준다.
        post_list.pop();
        dispatch(setPost(post_list, paging));
      });
  };
};

export default handleActions(
  {
    [SET_POST]: (state, action) =>
      produce(state, (draft) => {
        // draft를 쓰면 state의 값을 불변성을 지켜주면서 복사해준다.
        draft.list.push(...action.payload.post_list);
        draft.paging = action.payload.paging;
        draft.is_loading = false;
      }),
  },
  initialState
);
```

# 브라우저 창 크기

- 페이지 끝에 스크롤이 닿았는지 알려면 스크롤 할 수 있는 영역이 얼마나 남았는지 계산을 해야한다.
- 계산을 하기 위해서는 `웹 페이지 전체크기`, `얼마나 스크롤 했는지`를 알고 있어야한다.
- `window.innerHeight` 는 가시적으로 보이는 브라우저 창 높이 (메뉴바 툴바 제외한 크기)
- `document.body.scrollHeight` 는 스크롤할 수 있는 높이 (눈에 안보이는 영역 포함)
- `document의 scrollTop` 은 스크롤이 얼마나 움직였는지 알려주는 값
- https://javascript.info/size-and-scroll-window

## 스크롤 값 가져오기

```javascript
const { innerHeight } = window;
const { scrollHeight } = document.body;
// document 아래 documentElement 가 있을 경우에만 scrollTop을 가져오고
// 아니면 document.body.scrollTop 가져온다.
// 브라우저마다 document 에 접근해서 scrollTop을 가져오는게 약간씩 다르기 때문에
// 이런 조건을 해줘야 한다. (크롬만 할 경우면 document.body.scrollTop 만 해줘도 된다.)
const scrollTop =
  (document.documentElement && document.documentElement.scrollTop) ||
  document.body.scrollTop;
```

## post detail 페이지에서 단일 데이터 가져오기

- 계속 헷갈렸던 부분. 리덕스에서 가져와야 하는지? 했던 부분
- 단일 데이터를 가져올거고, 데이터를 유지할게 아니라면 굳이 리덕스에 저장할 필요가 없다.
- 디테일 페이지에서 새로고침을 하면 리덕스가 싹 날아가기 때문에 디테일 페이지는 데이터가 없어서 에러
- 파이어 스토어에서 데이터를 뽑아내는건 모두 목록(list) 페이지에서만 하기 때문이다.
- detail 페이지에서 파이어 스토어에서 데이터를 가져와야 한다.

```javascript
import React from "react";
import { useSelector } from "react-redux";
// 1. 디테일 페이지의 단일 데이터만 가져오기 위해서 firestore 가져옴
import { firestore } from "../shared/firebase";
import Post from "../components/Post";
import CommentList from "./CommentList";

const PostDetail = (props) => {
  const user_info = useSelector((state) => state.user.user);
  const post_list = useSelector((state) => state.post.list);
  const post_id = props.match.params.post_id;

  // detail페이지에서 새로고침하면 데이터가 날아간다.
  // 그 이유는 리덕스 데이터를 가져오는건 post list페이지에서 관리하기 때문이다.
  // index번호로 찾음
  const post_idx = post_list.findIndex((i) => i.id === post_id);
  // 객체로 가져와짐
  const post_data = post_list[post_idx];
  // 단일 데이터는 리덕스 말고 스테이트에 관리해도 상관없다.
  // post_data 가 있으면 넣고 없을경우 null
  const [post, setPost] = React.useState(post_data ? post_data : null);

  // 단일 데이터를 가져올거고, 데이터를 유지할게 아니라면 굳이 리덕스에 저장할 필요가 없다.
  // 디테일 페이지에서 새로고침을 하면 리덕스가 싹 날아가기 때문에 디테일 페이지는 데이터가 없어서 에러
  // 파이어 스토어에서 데이터를 뽑아내는건 모두 목록페이지에서만 하기 때문이다.
  // 파이어 스토어에서 데이터를 가져와야 한다.

  React.useEffect(() => {
    // 만약 post가 있으면 아래 구문을 할 필요가 없다.
    if (post) {
      return;
    }
    // 2.파이어 스토어에서 데이터를 가져온다.
    const postDB = firestore.collection("post");
    postDB
      .doc(post_id)
      .get()
      .then((doc) => {
        let _post = doc.data();
        let post = Object.keys(_post).reduce(
          (acc, cur) => {
            if (cur.indexOf("user_") !== -1) {
              return {
                ...acc,
                user_info: { ...acc.user_info, [cur]: _post[cur] },
              };
            }
            return { ...acc, [cur]: _post[cur] };
          },
          { id: doc.id, user_info: {} }
        );
        setPost(post);
      });
  }, []);

  return (
    <>
      {post && (
        <Post {...post} is_me={post.user_info.user_id === user_info.uid} />
      )}
      <CommentList />
    </>
  );
};

export default PostDetail;
```

## 댓글 기능 구현

- firestore 복합 쿼리를 사용한다. (복합쿼리는 firestore에서 한 콜렉션의 여러 필드를 한 쿼리로 묶을 때 필요 - 여러 필드 내용을 가지고 쿼리를 쓰고 싶을 때 쓴다)
- 복합 쿼리는 파이어스토어 대시보드에서 설정해준다.

## 옵셔널 체이닝

- ?.
- user_info?.uid 만약 user_info가 있는 값이면 뒤에 .uid를 가져온다
- 만약에 user_info 가 없으면 뒤의 uid는 읽지 않는다.

## 댓글 구현

- 부모한테 뭔가 불러서 자식한테 프롭스로 넘기는걸 드릴링이라고 한다.
- 드릴링이 별로 안좋은 이유는 a 부모와 b 자식 컴포넌트가 있을 때
- b한테만 필요한 어떤 정보를 a가 b한테 넘겨줄때 b한테 넘겨주는 정보가 변할때 a도 재 렌더링이 된다.
- 대신에 b만 정보를 갖고 있으면 a는 재 렌더링이 안되기 때문에 이런 부분을 고려한다.

## 댓글 알림

- 댓글 알림은 내가 쓴 게시글에, **내가 아닌 사람이 댓글을 쓰면** 알려준다.
- firebase realTime에서 설정
- 댓글 알림을 읽었는지 안읽었는지 구분자도 필요하다.

## 😳무한 스크롤과 댓글 알람에서 중요한 것!

- 함수형 컴포넌트에서 이벤트

# SEO

- 검색엔진 최적화
- 네이버나 구글같은 검색 엔진에 뭔가를 검색했을때, 내가 만든 사이트가 검색 결과에 더 잘보이게 하는 것.

1. 검색을 하면 검색 엔진이 사이트 내용물(메타태그, html 내용 등)을 한번 크롤링한다.
2. 검색 엔진이 인덱스(색인)같은걸 만든다.
3. 누간가 검색을 하면, 검색 결과를 뿌려준다.

> 검색 엔진 최적화는 검색 엔진이 내 사이트를 크롤링 할 때, 정보를 더 잘 가져갈 수 있도록 해주는 과정을 검색 엔진 최적화 라고 한다

# React 에서 검색 엔진 최적화

1. meta-data 넣는다.
2. pre-rendering
3. server side redering

> 구글 검색 엔진은 자바스크립트를 실행할 수 있다.
> 내용물을 가져갈 수 있다. 검색 엔진마다 크롤링을 해가는 방법이 다 다르다.

## Pre-rendering

- 빌드할 때 미리 특정 페이지를 렌더링해서 html 파일을 만들어 둔다.
- 검색 엔진이 크롤링 하러 사이트에 들어왔을 때, 빈 껍데기 html 파일 대신 내용물을 가져갈 수 있다.

> react-snap
> yarn add --dev react-snap // dev모드(개발)에서만 실행한다.

# Meta tag

- 메타태그는 웹페이지의 제목이나 이미지, 간단한 설명을 검색엔진에 알려준다.
- 리액트는 기본적으로 index.html 파일 한개이기 때문에 페이지별로 메타태그를 나누기 어려웠다.
- 그래서 페이지를 돌아다닐때 라우터마다 다른 메타태그를 넣어주기 위한 패키지를 설치한다. react-helmet

```javascript
yarn add react-helmet
```

# 성능 지표 보기

- webCitals 은 cra를 통해 기본 패키지로 추가된다
- webCitals 은 웹 사이트의 상태를 체크해준다. (예: 맨 첫번째 페이지가 로드되는데 얼마나 걸렸는지, 리덕스로 데이터를 가져오는데 얼마나 걸렸는지 등)

```javascript
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);

      //버튼을 클릭했을때 이벤트의 시간소요도 등을 체크 할 수 있다.
      getFID(onPerfEntry); // first input delay _ 웹페이지의 반응. 이벤트가 시작되는데 얼마나 시간 소요

      getFCP(onPerfEntry); // first contentful paint _ 브라우저가 화면에 그려지기까지의 특정 시간 측정

      // 예를들어 p태그랑 h1태그가 있으면, h1을 더 커다랗고 중요하다고 판단
      getLCP(onPerfEntry); // largest contentful paint _ 웹페이지에서 제일 커다란 덩어리의 시간 소요를 체크
      getTTFB(onPerfEntry); // time to first byte _ 브라우저가 페이지에 들어갈 내용의 가장 1번째 byte 걸리는 시간
    });
  }
};

export default reportWebVitals;
```

# 렌더링 횟수 줄이기

- 부모가 바뀔 때 자식 컴포넌트도 렌더링되는데 이 방법을 막기 위한 방법
- <code>React.memo</code>

# 고민할 것

- 사이트 로딩 속도 개선
- api 중복 호출 방지
- 오류 나지 않도록 api 호출 전후처리
- 오류가 나도 빈화면을 보지 않도록 에러 페이지 만들어주기
- 오래 걸리는 비동기 작업이 있다면 스피너를 띄워주기 (이미지 지연 로딩 등)

## 이미지 용량 줄이기

- 프론트, 백엔드 모두 처리가 필요하다.
- 작은 이미지 같은 경우 화질이 좋을 필요가 없다. (프로필 사진)
- 이미지를 리사이징해서 저장할 수 있다.
- 상황에 맞는 이미지를 가져다가 써야한다.
- css로 image sprite 할 수 있다.
