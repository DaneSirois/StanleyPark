import {SET_ACTIVE_AUTH_TAB__type} from '../Auth__types.js';

const activeForm__reducer = (state = "loginForm", action) => {
  switch(action.type) {
    case SET_ACTIVE_AUTH_TAB__type:
      return action.payload;
    default:
      return state;
  };
};

export default activeForm__reducer;