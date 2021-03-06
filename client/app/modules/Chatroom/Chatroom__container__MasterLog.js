import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as ReactDOM from 'react-dom';
import style from './styles/index.css';

import MessageList__container from './Chatroom__container__MessageList.js';

function ageInMs(dbObject) {
  return dbObject ? new Date(dbObject.created_at).getTime() : Infinity;
}

function messageTopicCoupler (messages, topicFirst, topicSecond) {
  return messages.filter((message) => {
    return  (ageInMs(message) > ageInMs(topicFirst)
      && ageInMs(message) <= ageInMs(topicSecond));
  });
}

class MasterLog__container extends Component {

  componentDidUpdate() {
    this.props.handleUpdate();
  }

  renderTopicLists(topicList) {
    let topics = topicList.map((topic) => topic);
    if (this.props.topics.length) {
      return topics.reverse().map((topic, index, topics) => {
        if(this.props.chatLog && Number(topic.channel_id) === Number(this.props.channel_id)) {
          return (
            <li className={style.topicDivider} key={topic.id}>
              <p className={style.topicName}>{topic.name}</p>
              <MessageList__container key={topic.id} channel_id={this.props.channel_id} messages={messageTopicCoupler(this.props.chatLog, topic, topics[index+1])} topic={topic.name} created_at={topic.created_at} />
            </li>
          )
        }
      });
    } else {
      return(
        <div className={style.spinner}></div>
      )
    }
  }
  render() {
    return (
      <ul className={style.masterLogContainer}>
        {this.renderTopicLists.bind(this)(this.props.topics)}
      </ul>
    );
  };
};

// GOTTA DO THIS:
function mapStateToProps(state) {
  return ({
    topics: state.Feed.topics,
    chatLog: state.Chatroom.chatLog
  });
};

export default connect(mapStateToProps)(MasterLog__container);
