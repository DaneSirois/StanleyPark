const axios = require('axios');
const utilities = require('./utilities.js');
const util = require('util');
const bcrypt = require('bcrypt');
const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host : 'ec2-23-23-225-81.compute-1.amazonaws.com',
    user : 'zkqtyekbnttwgv',
    password : 's4DwVTvb5tgsOqOBdQaiBc7HKf',
    database : 'de1lpea4frrcvo',
    port: 5432,
    ssl: true
  }
});

const inspect = (o, d = 1) => {
  console.log(util.inspect(o, { colors: true, depth: d }));
};

// Socket IO:
module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    const emit__action = (type, payload) => socket.emit('action', { type, payload });
    const broadcast__action = (type, payload) => io.emit('action', { type, payload });
    socket.userLocation = {};
    
    
    socket.on('action', (action) => {
      const today = new Date().toJSON().slice(0,10)
      switch (action.type) {

        case 'socket/FETCH_LOCATION':
          
          let locationData = action.payload.data;
          socket.userLocation.city = locationData.city;
          socket.userLocation.userip = locationData.query;
          socket.userLocation.timezone = locationData.timezone;
          knex('cities').select('id')
            .where({name: locationData.city})
            .then(function(result) {
              if (result.length) {

              socket.userLocation.id = result[0].id;
              console.log("result", socket.userLocation.id);
              } else {
                knex('cities').insert({
                  name: locationData.city
                }).returning('id').then((id) => {
                  socket.userLocation.id = id;
                });
              }
          });

          broadcast__action('ADD_LOCATION', socket.userLocation);    
        break;

        case 'socket/GET_CHANNELS': 
        console.log("this is legit",socket.userLocation);
          knex('channels')
            .select()
            .where({
              city_id: socket.userLocation.id
            })
            .then((channels) => {
            emit__action('GET_CHANNELS', channels);
          })
        break;

        case 'socket/FETCH_CHANNEL_STATE':
          knex('messages')
          .select()
          .where('channel_id', action.payload)
          .then((messages) => {
            emit__action('ADD_MESSAGES', messages)
          })
          knex('topics')
          .select()
          .where('channel_id', action.payload)
          .then((topics) => {
            let updatesBundle = []
            topics.forEach((topic, i, topics) => {
              knex('updates')
              .select()
              .where('topic_id', topic.id)
              .orderBy('created_at', 'desc')
              .then((updates) => {
                for (let i = 0; i < updates.length; i += 1) {
                  updatesBundle.push(updates[i]);
                }
                if (i == topics.length - 1) {
                  emit__action('ADD_UPDATES', updatesBundle);
                  emit__action('ADD_TOPICS', topics);
                }
              })
            })
          })
        case 'socket/SIGNUP_USER':
          const userCreds = action.payload;
          bcrypt.hash(userCreds.password, 10, (err, hash) => {
            knex('users').insert({
              name: userCreds.username,
              password_digest: hash,
              email: userCreds.email,
              // session_id: utilities.generateRandomStr()
            }).then((result) => {
              console.log(result);
              // emit__action('USER_AUTHENTICATED', action.payload);
            });
          });
        break;
        case 'socket/AUTHENTICATE_USER':
          const userInput = action.payload;
          bcrypt.compareSync(userInput.password, userInput.password);
          broadcast__action('USER_AUTHENTICATED', action.payload);
        break;
        case 'socket/NEW_MESSAGE':
          knex('messages').insert({
            message_text: action.payload.message_text,
            user_id: 1,
            channel_id: action.payload.channel_id
          }).then((result) => {
            broadcast__action('ADD_MESSAGE', action.payload);
          });
        break;
        case 'socket/NEW_UPDATE':
          knex('updates').insert({
            content: action.payload.content,
            topic_id: action.payload.topic_id, // FIIIIIIXXXXX THIIIIISSSS
            created_at: today,
            updated_at: today
          }).returning('id').then((update_id) => {
            broadcast__action('ADD_UPDATE', {
              id: update_id[0],
              content: action.payload.content,
              topic_id: action.payload.topic_id, // CHANGE THIS
              date: new Date()
            });
          });
        break;
        case 'socker/FETCH_UPDATES':
          knex('updates').select().orderBy()
        break;
        case 'socket/NEW_TOPIC':
          knex('topics').insert({
            name: action.payload.name,
            channel_id: action.payload.channel_id,
            created_at: today,
            updated_at: today
          }).returning('id').then((topic_id) => {
            broadcast__action('ADD_TOPIC', {
              id: topic_id[0],
              name: action.payload.name,
              date: new Date(),
              channel_id: action.payload.channel_id});
          })
        break;
        case 'socket/NEW_CHANNEL':
          const channelData = action.payload;
          knex('channels').select('id').where('name', channelData.name)
          .then((result) => {
            if (result.length) {
              console.log('Channel already exists!');
            } else {
              knex('channels').insert({
                name: channelData.name,
                city_id: socket.user.id
              }).returning('id').then((channel_id) => {
                channelData.tags.forEach((tag_name) => {
                  knex('tags')
                  .select('id')
                  .where('name', tag_name)
                  .then((tag_id) => {
                    if (tag_id.length) {
                      knex('tag_channel').insert({
                        tag_id: tag_id[0].id,
                        channel_id: channel_id[0]
                        }).then((result) => {
                        });
                    } else {

                      knex('tags').insert({
                        name:tag_name
                      }).returning('id').then((tag_id) => {
                        knex('tag_channel').insert({
                        tag_id: tag_id[0],
                        channel_id: channel_id[0]
                        }).then((result) => {
                        });
                      })
                    }
                  });
                })
                broadcast__action('NEW_CHANNEL', action.payload);
              });
            }
          })
        break;

      }
    });
    socket.on('disconnect', function(){
      console.log("Socket disconnected");
    });
  });
};