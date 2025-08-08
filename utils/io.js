const chatController = require('../Controllers/chat.controller');
const userController = require('../Controllers/user.controller');
const { v4: uuidv4 } = require('uuid');
module.exports = function (io) {
  // io
  io.on('connection', async (socket) => {
    console.log('client is connected', socket.id);

    socket.on('login', async (userName, cb) => {
      try {
        const user = await userController.saveUser(userName, socket.id);
        // const welcomeMessage = {
        //   chat: `${user.name} is joined to this room`,
        //   user: { id: null, name: 'system' },
        // };
        // io.emit('message', welcomeMessage);
        cb({ ok: true, data: user });
      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    });

    socket.on('join_room', async (data, cb) => {
      console.log('join_room', data);
      try {
        const { user_nickname, chatbot_id } = data;

        // UUID 생성
        const user_id = uuidv4();
        const chatroom_id = uuidv4();

        // 응답 데이터 구조
        const response = {
          user_id: user_id,
          user_nickname: user_nickname,
          chatbot_id: chatbot_id,
          chatroom_id: chatroom_id,
          chatbot_name: '투닥이',
          current_distance: 10,
          heart_life: 10,
          sender_type: 'BOT',
          message: `저기.. ${user_nickname}..! 잘지냈어? 혹시 내가 할말이 있는데 들어줄래?`,
          chatbot_profile_image: `{S3-URL}/chatbots/${chatbot_id}/profile.png`,
          turn_count: 9,
        };

        // 클라이언트에게 응답 전송
        cb({ ok: true, data: response });

        console.log(
          `User ${user_nickname} joined room with chatbot ID ${chatbot_id}`
        );
      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    });

    socket.on('sendMessage', async (message, cb) => {
      try {
        const user = await userController.checkUser(socket.id);

        const newMessage = await chatController.saveChat(message, user);
        //여기서 콜백하면 자기만 하는데 여기서는 io로 해서 모두에게 알려줌 이 부분 바꾸면될듯?
        io.emit('message', newMessage);
        cb({ ok: true });
      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    });
    socket.on('disconnect', () => {
      console.log('user is disconnected');
    });
  });
};
