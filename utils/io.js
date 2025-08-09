const chatController = require('../Controllers/chat.controller');
const userController = require('../Controllers/user.controller');
const { v4: uuidv4 } = require('uuid');

module.exports = function (io) {
  // 사용자 세션 저장소 (메모리 기반)
  const userSessions = new Map();

  io.on('connection', async (socket) => {
    console.log('client is connected', socket.id);

    socket.on('join_room', async (data) => {
      console.log('join_room', data);
      try {
        const { user_nickname, chatbot_id } = data;

        // UUID 생성
        const user_id = uuidv4();
        const chatroom_id = uuidv4();

        // 사용자 세션 정보 저장
        userSessions.set(socket.id, {
          user_id,
          user_nickname,
          chatbot_id,
          chatroom_id,
          current_distance: 10,
          heart_life: 10,
          turn_count: 9,
        });

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

        // 클라이언트에게 입장 성공 데이터 전송 (콜백 사용하지 않음)
        socket.emit('join_room_success', response);

        console.log(
          `User ${user_nickname} joined room with chatbot ID ${chatbot_id}`
        );
      } catch (error) {
        socket.emit('join_room_error', { error: error.message });
      }
    });

    // 클라이언트로부터 받는 메시지 처리
    socket.on('send_message', async (messageData) => {
      try {
        console.log('Received message:', messageData);

        // 세션에서 사용자 정보 가져오기
        const userSession = userSessions.get(socket.id);
        if (!userSession) {
          throw new Error('User session not found. Please join a room first.');
        }

        // 메시지 데이터 검증
        const { chatbot_id, message, sender_type, chatroom_id, user_id } =
          messageData;

        if (
          !chatbot_id ||
          !message ||
          !sender_type ||
          !chatroom_id ||
          !user_id
        ) {
          throw new Error('Missing required message fields');
        }

        // 콜백 없이 에코 및 AI 지연 고려한 봇 응답 전송

        // 사용자 메시지를 먼저 emit으로 전송 (클라이언트 즉시 표시)
        const userMessage = {
          chatbot_id: chatbot_id,
          message: message,
          user_id: user_id,
          user_nickname: userSession.user_nickname,
          sender_type: sender_type,
          chatroom_id: chatroom_id,
        };

        socket.emit('message', userMessage);

        // 메시지 수신 확인 이벤트 (AI 처리 대기 고려)
        const message_id = uuidv4();
        socket.emit('message_received', {
          message_id,
          chatroom_id,
          user_id,
          chatbot_id,
          status: 'received',
          timestamp: Date.now(),
        });

        // 봇 타이핑 상태 알림 시작
        socket.emit('bot_typing', {
          chatroom_id,
          chatbot_id,
          typing: true,
        });

        // 2~6초 랜덤 지연 후 봇 응답 전송
        const delayMs = 2000 + Math.floor(Math.random() * 4000);
        setTimeout(() => {
          const nextTurnCount = Math.max(0, (userSession.turn_count ?? 9) - 1);
          const botResponse = {
            chatbot_id: chatbot_id,
            chatbot_name: '투닥이',
            message: '퀴즈1 리액션 메시지',
            user_id: user_id,
            sender_type: 'BOT',
            chatroom_id: chatroom_id,
            score: 1,
            chatbot_profile_image: `{S3-URL}/chatbots/${chatbot_id}/profile.png`,
            reaction_image: `{S3-URL}/chatbots/${chatbot_id}/reactions/positive.png`,
            heart_life: userSession.heart_life ?? 10,
            current_distance: userSession.current_distance ?? 10,
            turn_count: nextTurnCount,
            in_reply_to: message_id,
            timestamp: Date.now(),
          };

          // 봇 타이핑 상태 종료 알림
          socket.emit('bot_typing', {
            chatroom_id,
            chatbot_id,
            typing: false,
          });

          // 해당 소켓에만 봇 응답 전송
          socket.emit('message', botResponse);
          console.log('Bot response sent to user:', userSession.user_nickname);
          // 세션 턴 카운트 업데이트
          userSession.turn_count = nextTurnCount;
        }, delayMs);
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('user is disconnected', socket.id);
      // 세션 정보 정리
      userSessions.delete(socket.id);
    });
  });
};
