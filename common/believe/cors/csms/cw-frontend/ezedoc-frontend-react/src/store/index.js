import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
// import logger from 'redux-logger';

import RootReducer from "./reducers/rootReducer";

const middleWare = [];
middleWare.push(thunk);

// The motivation to separate store from src/index.js file, is 
// to seperate redux-store config from it.

const getStore = () => {
  if (process.env.NODE_ENV === "production") {
    const store = createStore(RootReducer, applyMiddleware(...middleWare));
    return store;
  }

  // store Configuration for development environment.

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  // unComment below line and import statement, to enable redux logger;
  // middleWare.push(logger);

  const store = createStore(
    RootReducer,
    composeEnhancers(applyMiddleware(...middleWare))
  );

  return store;
};

const store = getStore();

// window.Cypress will be true in test environment,
// and we assign redux-store to window.store variable.

if (window.Cypress) {
  window.store = store;
}

export const dispatch = store.dispatch;

export default store;
