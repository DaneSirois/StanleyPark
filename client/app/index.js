import React, {Component} from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';

import root_reducer from './root_reducer.js';
import { Router, Route, hashHistory } from 'react-router';

import thunk from 'redux-thunk';
import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';

import App__module from './modules/App/App__index.js';
import Loading__module from './modules/Loading/Loading__index.js';
import Portal__module from './modules/Portal/Portal__index.js';
import Channel__view from './Views/Views__channel.js';

import * as actions from './modules/Shared/actions/index.js';

import './assets/normalize.css';
import './assets/global.css';

// Redux Middleware:
const localStorage_middleware = (store) => (next) => (action) => {
  switch (action.type) {
    case 'USER_AUTHENTICATED':
      if (!localStorage.user_JWT) {
        const serializedToken = JSON.stringify(action.payload.JWT);
        localStorage.setItem("user_JWT", serializedToken);
        console.log("USER_AUTHENTICATED from index.js. Just stored this in localStorage:", serializedToken);
      }
      console.log("Inside of the localStorage redux middleware USER_AUTHENTICATED block. Just stored the users JWT in localStorage. Here is the token hash:", action.payload.JWT);
      next(action);
    break;
    case 'LOGOUT_USER':
      if (localStorage.user_JWT) {
        localStorage.removeItem("user_JWT");
        console.log("Inside of the localStorage Redux middleware LOGOUT_USER. You will only see this if there was a JWT previously stored inside of localStorage. I just removed it. Here is the updated localStorage object:", localStorage);
      }
      next(action);
    break;
    default:
      next(action);
  }
};

const scoreTiles__middleware = (store) => (next) => (action) => {
 switch (action.type) {
   case 'REFRESH_PORTAL':
      //
      action.channels.forEach((channel) => {
        let messageArray = action.messages.map((message) => message);
        channel.score = messageArray.filter((message) => {
          return message.channel_id === channel.id;
        }).reduce((score, message) => {
          return score + Math.pow(((new Date(message.created_at)).getTime() / Date.now()), 2);
        }, 0)
        let headline = action.topics.find((topic) => topic.channel_id === channel.id)
        channel.headline = headline ? headline.name : '';
        channel.img_url = headline ? headline.img_url : '';
      });
  next(action);
  break;
  default:
    next(action);
 }
}

const socket = io('http://159.203.35.124:3000');
const socketIoMiddleware = createSocketIoMiddleware(socket, "socket/");

// Build store with middleware:
const middleware = [thunk, socketIoMiddleware, localStorage_middleware, scoreTiles__middleware];
const store = applyMiddleware(...middleware)(createStore)(root_reducer);

// Get JWT from 'Localstorage':
const user_JWT = JSON.parse(localStorage.getItem("user_JWT")) || undefined;

// Dispatch Initialization action:
setTimeout(() => {
  store.dispatch(actions.InitializeApp(user_JWT));
}, 3000);

// Mount the entry module:
ReactDOM.render(
  <Provider store={store}>
    <App__module/>
  </Provider>,
  document.getElementById('SRC')
);
