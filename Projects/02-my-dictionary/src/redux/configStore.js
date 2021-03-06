import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import dictionary from "./modules/dictionary";

const middlewares = [thunk];
const rootReducer = combineReducers({ dictionary });

const enhancer = applyMiddleware(...middlewares);

const store = createStore(rootReducer, enhancer);

export default store;
