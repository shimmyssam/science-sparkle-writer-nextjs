// 환경변수 및 AI 연동 상태 확인용 유틸리티

export const checkEnvironment = () => {
  console.log('🔍 환경변수 상태 확인:');
  console.log('OpenAI API Key: 🔒 서버사이드에서만 접근 (보안)');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ 없음');
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10)}...` : '❌ 없음');
    
  return {
    hasOpenAI: true, // 프록시를 통해 서버사이드에서 처리
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    openaiKey: '🔒 서버사이드에서만 접근',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  };
};

// 프록시를 통한 OpenAI API 테스트
export const testOpenAI = async () => {
  try {
    const response = await fetch('/api/openai/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ OpenAI API 연결 성공! (프록시를 통해)');
      return true;
    } else {
      console.error('❌ OpenAI API 연결 실패:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ OpenAI API 테스트 오류:', error);
    return false;
  }
};