const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (테스트 클라이언트용)
app.use(express.static('.'));

// 샘플 데이터
let chatbots = [
  {
    chatbot_id: 1,
    chatbot_profile_image: 'tudag.png',
    chatbot_name: '투닥이',
    chatbot_personalities: '소심함, 감정 과몰입, 인정 욕구, 관계 중심 정서',
    chatbot_speciality: '공감 능력 학습기',
    is_unknown: false,
  },
  {
    chatbot_id: 2,
    chatbot_profile_image: '다람쥐.png',
    chatbot_name: '밝음이',
    chatbot_personalities: '활발함, 긍정적, 호기심 많음, 에너지 넘침',
    chatbot_speciality: '동기부여 전문가',
    is_unknown: true,
  },
  {
    chatbot_id: 3,
    chatbot_profile_image: '양.png',
    chatbot_name: '차분이',
    chatbot_personalities: '침착함, 논리적, 신중함, 분석적',
    chatbot_speciality: '문제 해결 도우미',
    is_unknown: true,
  },
];

// API 엔드포인트들

// 1. 모든 챗봇 조회
app.get('/api/chatbots', (req, res) => {
  res.json({
    success: true,
    data: {
      chatbots: chatbots,
    },
  });
});

// 2. 특정 챗봇 조회
app.get('/api/chatbots/:id', (req, res) => {
  const chatbotId = parseInt(req.params.id);
  const chatbot = chatbots.find((bot) => bot.chatbot_id === chatbotId);

  if (!chatbot) {
    return res.status(404).json({
      success: false,
      message: '챗봇을 찾을 수 없습니다.',
    });
  }

  res.json({
    success: true,
    data: chatbot,
  });
});

// 3. 새 챗봇 추가
app.post('/api/chatbots', (req, res) => {
  const {
    chatbot_name,
    chatbot_personalities,
    chatbot_speciality,
    is_unknown = false,
  } = req.body;

  if (!chatbot_name || !chatbot_personalities || !chatbot_speciality) {
    return res.status(400).json({
      success: false,
      message: '필수 필드가 누락되었습니다.',
    });
  }

  const newChatbot = {
    chatbot_id: Math.max(...chatbots.map((bot) => bot.chatbot_id)) + 1,
    chatbot_profile_image: `{S3-URL}/chatbots/${
      Math.max(...chatbots.map((bot) => bot.chatbot_id)) + 1
    }/profile.png`,
    chatbot_name,
    chatbot_personalities,
    chatbot_speciality,
    is_unknown,
  };

  chatbots.push(newChatbot);

  res.status(201).json({
    success: true,
    data: newChatbot,
    message: '챗봇이 성공적으로 생성되었습니다.',
  });
});

// 4. 챗봇 정보 수정
app.put('/api/chatbots/:id', (req, res) => {
  const chatbotId = parseInt(req.params.id);
  const chatbotIndex = chatbots.findIndex(
    (bot) => bot.chatbot_id === chatbotId
  );

  if (chatbotIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '챗봇을 찾을 수 없습니다.',
    });
  }

  const {
    chatbot_name,
    chatbot_personalities,
    chatbot_speciality,
    is_unknown,
  } = req.body;

  // 업데이트할 필드만 수정
  if (chatbot_name) chatbots[chatbotIndex].chatbot_name = chatbot_name;
  if (chatbot_personalities)
    chatbots[chatbotIndex].chatbot_personalities = chatbot_personalities;
  if (chatbot_speciality)
    chatbots[chatbotIndex].chatbot_speciality = chatbot_speciality;
  if (typeof is_unknown !== 'undefined')
    chatbots[chatbotIndex].is_unknown = is_unknown;

  res.json({
    success: true,
    data: chatbots[chatbotIndex],
    message: '챗봇 정보가 성공적으로 수정되었습니다.',
  });
});

// 5. 챗봇 삭제
app.delete('/api/chatbots/:id', (req, res) => {
  const chatbotId = parseInt(req.params.id);
  const chatbotIndex = chatbots.findIndex(
    (bot) => bot.chatbot_id === chatbotId
  );

  if (chatbotIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '챗봇을 찾을 수 없습니다.',
    });
  }

  chatbots.splice(chatbotIndex, 1);

  res.json({
    success: true,
    message: '챗봇이 성공적으로 삭제되었습니다.',
  });
});

// 6. 특정 특성을 가진 챗봇 검색
app.get('/api/chatbots/search/personality', (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: '검색 키워드가 필요합니다.',
    });
  }

  const filteredChatbots = chatbots.filter(
    (bot) =>
      bot.chatbot_personalities.toLowerCase().includes(keyword.toLowerCase()) ||
      bot.chatbot_speciality.toLowerCase().includes(keyword.toLowerCase())
  );

  res.json({
    success: true,
    data: {
      chatbots: filteredChatbots,
      count: filteredChatbots.length,
    },
  });
});

// 7. 편지 데이터 조회
app.get('/api/letters/:chatroom_id', (req, res) => {
  const { chatroom_id } = req.params;

  // 샘플 편지 데이터 생성 (실제 구현에서는 데이터베이스에서 조회)
  const letterData = {
    chatroom_id: chatroom_id,
    is_finished: true,
    current_distance: 10,
    letter:
      '안녕하세요! 오늘 하루는 어떠셨나요?\n\n투닥이가 여러분의 일상에 작은 위로가 되었으면 좋겠어요. 때로는 힘든 일들이 있더라도, 그 모든 순간들이 우리를 더 강하게 만들어 준다고 생각해요.\n\n내일도 좋은 하루 되세요! 투닥이가 항상 응원하고 있을게요.',
    user_nickname: `${chatroom_id}`,
    chatbot_name: '투닥이',
    chatbot_id: 1,
    from_chatbot: '힘들었던 하루 끝에, \n 투닥이',
    letter_mp3: `{S3-URL}/chatrooms/results/${chatroom_id}/letter_voice.mp3`,
    chatbot_result_image: 'tudag.png',
  };

  res.json(letterData);
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
  });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청하신 엔드포인트를 찾을 수 없습니다.',
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   GET    /api/chatbots                    - 모든 챗봇 조회`);
  console.log(`   GET    /api/chatbots/:id                - 특정 챗봇 조회`);
  console.log(`   POST   /api/chatbots                    - 새 챗봇 추가`);
  console.log(`   PUT    /api/chatbots/:id                - 챗봇 정보 수정`);
  console.log(`   DELETE /api/chatbots/:id                - 챗봇 삭제`);
  console.log(`   GET    /api/chatbots/search/personality - 챗봇 검색`);
  console.log(`   GET    /api/letters/:chatroom_id        - 편지 데이터 조회`);
});
