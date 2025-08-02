const chatController = require('../Controllers/chat.controller');
const userController = require('../Controllers/user.controller');
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
