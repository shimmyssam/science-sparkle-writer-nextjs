// OpenAI API 호출을 위한 프록시 설정
const API_BASE_URL = '/api/openai';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// 프록시를 통한 OpenAI API 호출 함수
const callOpenAI = async (messages: OpenAIMessage[], options: OpenAIOptions = {}) => {
  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 호출 실패: ${response.status}`);
  }

  return response.json();
};

export interface FeedbackRequest {
  studentName: string;
  essay: string;
  gradeLevel?: string; // 학년 수준 (초등 4학년~중학교)
}

export interface FeedbackResponse {
  feedback: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  improvedSentences?: Array<{
    original: string;
    improved: string;
  }>;
  scientificKnowledge?: {
    present: string[];
    missing: string[];
    suggestions: string;
  };
  ratings: {
    content: { stars: number; comment: string };
    logicalFlow: { stars: number; comment: string };
    sentenceExpression: { stars: number; comment: string };
    scientificKnowledge: { stars: number; comment: string };
    readerAwareness: { stars: number; comment: string };
  };
}

const SCIENCE_WRITING_PROMPT = `
당신은 초등학교 4학년부터 중학교까지의 학생들을 위한 따뜻하고 격려적인 과학 글쓰기 AI 선생님입니다.

## [평가 기준 공통 적용 사항]
- 피드백은 따뜻하고 격려하는 말투로 해줘 (예: ~야, ~이야, ~해요체 사용) 😊
- 핵심 키워드는 반드시 **굵게** 표시해줘
- 피드백은 그동안 작성한 내용과 중복되지 않게, 글의 새로운 장점이나 개선점을 중심으로 써줘
- 글을 쓴 학생의 이름을 처음 문장에 꼭 불러줘

## [세부 평가 항목 및 순서]

① 이 글이 좋았던 점 3가지를 설명해줘.
- 각 항목은 100자 이상으로, 아이가 자부심을 느낄 수 있도록 구체적으로 칭찬해줘
- 아래의 항목 중 최소 2개 이상을 포함하면 좋아:
  - 과학적 정확성 (사실이 정확했는지)
  - 주제 명확성 (중심 생각이 분명했는지)
  - 논리적 전개 (글의 흐름이 자연스럽고 주장과 근거가 잘 연결됐는지)
  - 창의성 (새로운 시각이나 표현이 있었는지)
  - 대상 맞춤성 (읽는 사람을 잘 배려했는지)

② 아래 2개 문장을 과학 지식과 문맥에 맞게 수정 또는 보완해줘
- 글 전체를 읽고, 틀린 과학 지식이 있으면 정확하게 고쳐줘
- 맥락상 추가하면 더 좋은 설명이나 문장이 있다면 자연스럽게 넣어줘
- 수정한 문장은 [예시]로 따로 표시해줘

③ 글에서 핵심 과학 지식이 잘 담겼는지 확인해줘
- 글 속에 과학 개념이나 원리가 명확히 드러났는지 평가해줘
- 개념이 **정확한 표현으로 설명**되었는지, **학생이 제대로 이해하고 쓴 것**인지 판단해줘
- 빠졌다면 어떤 개념이 추가되면 좋을지도 알려줘 (예: 열 전도, 상태 변화 등)

④ 글 전체에서 논리적 흐름과 주장-근거 연결을 따로 점검해줘
- 문단 사이의 연결이 매끄러운지, 글 전체의 흐름이 어색하지 않았는지 확인해줘
- 주장과 근거가 잘 이어졌는지, 설명이 부족하거나 갑작스러운 전환은 없었는지도 짚어줘

⑤ 이 글을 5개 평가 범주에 따라 전반적으로 평가해줘
- 평가 항목: 내용 / **논리적 전개** / 문장 표현 / 과학 지식 활용 / 독자 고려
- 각 항목별로 짧은 설명 + 5점 만점 기준 별점을 제시해줘
(예: 논리적 전개 ★★★★☆ - 전체 흐름은 좋았지만 마지막 문단이 조금 급하게 끝났어요.)

⑥ 다음 글쓰기에서 참고하면 좋은 1~2가지 팁을 제시해줘
- 예: "설명할 땐 과학 용어 옆에 쉬운 말을 덧붙이면 더 좋을 거야!"
- 또는: "문단을 시작할 때 앞 문장을 자연스럽게 이어주는 말(예: 그런데, 그래서)을 넣어보자!"
- 너무 많지 않게, 아이가 **따라 하기 쉬운 행동 중심**으로 적어줘

## 응답 형식:
응답은 반드시 다음 JSON 형식으로 제공해주세요:

{
  "feedback": "학생에게 전하는 전체적인 격려 메시지 (2-3문장)",
  "strengths": ["장점 1", "장점 2", "장점 3"],
  "improvements": ["개선점 1", "개선점 2", "개선점 3"],
  "tips": ["구체적인 팁 1", "구체적인 팁 2"],
  "improvedSentences": [
    {"original": "학생 글에서 개선할 수 있는 원래 문장", "improved": "더 과학적이고 명확한 개선된 문장"},
    {"original": "또 다른 원래 문장", "improved": "개선된 문장"}
  ],
  "scientificKnowledge": {
    "present": ["학생이 잘 사용한 과학 개념 1", "개념 2", "개념 3"],
    "missing": ["추가하면 좋을 과학 개념 1", "개념 2"],
    "suggestions": "과학 지식을 더 깊이 있게 탐구할 수 있는 구체적인 제안"
  },
  "ratings": {
    "content": {"stars": 1-5, "comment": "내용에 대한 구체적 코멘트"},
    "logicalFlow": {"stars": 1-5, "comment": "논리적 흐름에 대한 코멘트"},
    "sentenceExpression": {"stars": 1-5, "comment": "문장 표현에 대한 코멘트"},
    "scientificKnowledge": {"stars": 1-5, "comment": "과학 지식에 대한 코멘트"},
    "readerAwareness": {"stars": 1-5, "comment": "독자 고려에 대한 코멘트"}
  }
}

학생 이름: {studentName}
학생의 글:
{essay}
`;

export const generateFeedback = async (request: FeedbackRequest): Promise<FeedbackResponse> => {
  try {
    const prompt = SCIENCE_WRITING_PROMPT
      .replace('{studentName}', request.studentName)
      .replace('{essay}', request.essay);

    const completion = await callOpenAI([
      {
        role: "system",
        content: "당신은 과학 글쓰기 전문 교육자입니다. 학생들에게 따뜻하고 건설적인 피드백을 제공하며, 항상 JSON 형식으로 응답합니다."
      },
      {
        role: "user",
        content: prompt
      }
    ], {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('OpenAI API에서 응답을 받지 못했습니다.');
    }

    // JSON 파싱 시도
    let feedbackData: FeedbackResponse;
    try {
      // 응답에서 JSON 부분만 추출 (```json으로 감싸져 있을 수 있음)
      let jsonString = response;
      
      // ```json으로 감싸져 있으면 추출
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        jsonString = jsonMatch ? jsonMatch[1] : response;
      } else if (response.includes('```')) {
        const jsonMatch = response.match(/```\s*([\s\S]*?)\s*```/);
        jsonString = jsonMatch ? jsonMatch[1] : response;
      } else {
        // 첫 번째와 마지막 중괄호 사이의 JSON 추출
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        jsonString = jsonMatch ? jsonMatch[0] : response;
      }
      
      console.log('🔍 OpenAI 원본 응답:', response);
      console.log('🔍 파싱할 JSON:', jsonString);
      
      feedbackData = JSON.parse(jsonString.trim());
      console.log('✅ 파싱된 피드백 데이터:', feedbackData);
      
      // 데이터 구조 검증
      console.log('📊 피드백 구조 분석:');
      console.log('- feedback:', typeof feedbackData.feedback, feedbackData.feedback);
      console.log('- strengths:', Array.isArray(feedbackData.strengths), feedbackData.strengths);
      console.log('- improvements:', Array.isArray(feedbackData.improvements), feedbackData.improvements);
      console.log('- tips:', Array.isArray(feedbackData.tips), feedbackData.tips);
      console.log('- ratings:', typeof feedbackData.ratings, feedbackData.ratings);
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      console.error('❌ 원본 응답:', response);
      
      // 파싱 실패시 기본 응답 생성
      feedbackData = {
        feedback: `${request.studentName}님, 과학 글쓰기에 참여해주셔서 감사해요! 더 나은 피드백을 위해 다시 시도해보겠습니다.`,
        strengths: ["글쓰기에 참여한 적극적인 자세가 훌륭해요!"],
        improvements: ["조금 더 자세한 설명을 추가해보세요."],
        tips: ["과학적 개념을 일상 예시와 연결해보세요."],
        ratings: {
          content: { stars: 3, comment: "내용을 더 자세히 분석해드리겠습니다." },
          logicalFlow: { stars: 3, comment: "글의 구조를 더 자세히 살펴보겠습니다." },
          sentenceExpression: { stars: 3, comment: "문장 표현을 더 자세히 검토해드리겠습니다." },
          scientificKnowledge: { stars: 3, comment: "과학 지식을 더 자세히 평가해드리겠습니다." },
          readerAwareness: { stars: 3, comment: "독자 고려를 더 자세히 분석해드리겠습니다." }
        }
      };
    }

    return feedbackData;

  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    
    // API 호출 실패시 기본 응답 반환
    return {
      feedback: `${request.studentName}님, 현재 AI 피드백 시스템에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요! 💫`,
      strengths: [
        "과학 글쓰기에 도전하는 용기가 훌륭해요!",
        "학습에 대한 열정이 느껴져요.",
        "꾸준히 노력하는 모습이 인상적입니다!"
      ],
      improvements: [
        "AI 시스템이 복구되면 더 자세한 피드백을 제공하겠습니다.",
        "계속 과학 글쓰기를 연습해보세요.",
        "궁금한 점이 있으면 언제든 질문해주세요."
      ],
      tips: [
        "과학적 개념을 일상생활과 연결해보세요.",
        "글을 쓰기 전에 간단한 개요를 만들어보세요."
      ],
      ratings: {
        content: { stars: 4, comment: "더 정확한 평가를 위해 다시 시도해주세요." },
        logicalFlow: { stars: 4, comment: "시스템 복구 후 자세히 분석해드리겠습니다." },
        sentenceExpression: { stars: 4, comment: "문장 구조를 더 자세히 검토해드리겠습니다." },
        scientificKnowledge: { stars: 4, comment: "과학 지식을 더 정확히 평가해드리겠습니다." },
        readerAwareness: { stars: 4, comment: "독자 고려 능력을 더 자세히 분석해드리겠습니다." }
      }
    };
  }
};

// API 키 유효성 검사 함수 (프록시를 통해 검증)
export const validateOpenAIKey = async (): Promise<boolean> => {
  try {
    // 간단한 API 호출로 키 유효성 검증
    await callOpenAI([
      { role: "user", content: "Hello" }
    ], { max_tokens: 5 });
    return true;
  } catch (error) {
    console.error('API 키 검증 실패:', error);
    return false;
  }
};

// 사용 가능한 모델 목록
export const AVAILABLE_MODELS = {
  'gpt-4o-mini': '빠르고 경제적 (권장)',
  'gpt-4o': '최고 품질 (비용 높음)',
  'gpt-3.5-turbo': '기본 모델'
} as const;