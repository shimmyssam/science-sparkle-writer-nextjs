'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, FileText, Upload, Heart, Copy, Users, User, FileSpreadsheet } from 'lucide-react';
import { FeedbackDisplay } from './FeedbackDisplay';
import { StudentLinksSection } from './StudentLinksSection';
import { ExcelUploader } from './ExcelUploader';
import { supabase } from '@/integrations/supabase/client';
import { generateFeedback, validateOpenAIKey } from '@/services/openai';
import { checkEnvironment } from '@/utils/env-check';
import type { FeedbackData } from '@/types/feedback';

export const WritingAssistant = () => {
  const [studentName, setStudentName] = useState('');
  const [essay, setEssay] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [studentUuid, setStudentUuid] = useState<string | null>(null);
  const { toast } = useToast();

  // 환경변수 및 AI 연동 상태 확인
  React.useEffect(() => {
    const envStatus = checkEnvironment();
    console.log('🔍 AI 연동 상태:', envStatus);
    
    if (!envStatus.hasOpenAI) {
      toast({
        title: "⚠️ AI 설정 확인 필요",
        description: "OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleAnalyze = async () => {
    if (!studentName.trim() || !essay.trim()) {
      toast({
        title: "모든 필드를 입력해주세요",
        description: "학생 이름과 글쓰기 내용이 모두 필요해요~",
        variant: "destructive",
      });
      return;
    }

    // OpenAI API 키 검증
    if (!validateOpenAIKey()) {
      toast({
        title: "API 설정이 필요합니다",
        description: "OpenAI API 키를 .env.local 파일에 설정해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // OpenAI API를 통한 실제 피드백 생성
      const feedbackResponse = await generateFeedback({
        studentName,
        essay,
        gradeLevel: "초등~중등" // 추후 사용자 입력으로 받을 수 있음
      });

      console.log('🤖 OpenAI 원본 응답:', feedbackResponse);
      
      // FeedbackDisplay 컴포넌트와 호환되는 형식으로 변환
      const processedFeedback = {
        studentName,
        feedback: feedbackResponse.feedback || `${studentName}님의 과학 글쓰기 분석이 완료되었습니다! ✨`,
        strengths: Array.isArray(feedbackResponse.strengths) ? feedbackResponse.strengths : 
          [feedbackResponse.strengths || "과학적 사고력이 돋보이는 글이에요!"],
        improvements: Array.isArray(feedbackResponse.improvements) ? feedbackResponse.improvements : 
          [feedbackResponse.improvements || "더 구체적인 설명을 추가해보세요."],
        tips: Array.isArray(feedbackResponse.tips) ? feedbackResponse.tips : 
          [feedbackResponse.tips || "과학적 개념을 일상생활과 연결해보세요!"],
        ratings: feedbackResponse.ratings && typeof feedbackResponse.ratings === 'object' ? 
          feedbackResponse.ratings : {
            content: { stars: 4, comment: "내용이 흥미롭고 이해하기 쉬워요!" },
            logicalFlow: { stars: 4, comment: "논리적 구조가 잘 갖춰져 있어요!" },
            sentenceExpression: { stars: 4, comment: "문장이 명확하고 읽기 편해요!" },
            scientificKnowledge: { stars: 4, comment: "과학 지식이 잘 드러나요!" },
            readerAwareness: { stars: 4, comment: "독자를 고려한 설명이 좋아요!" }
          },
        // OpenAI가 직접 제공하는 구조 사용 (없으면 기본값)
        improvedSentences: feedbackResponse.improvedSentences || [
          {
            original: "더 구체적인 표현이 필요한 문장이 있다면",
            improved: "과학적 용어를 사용해서 더 정확하게 표현해보세요."
          }
        ],
        scientificKnowledge: feedbackResponse.scientificKnowledge || {
          present: ["기본 과학 개념", "논리적 사고"],
          missing: ["심화 개념", "응용 사례"],
          suggestions: "과학적 개념을 일상생활 예시와 함께 설명하면 더 좋겠어요!"
        },
        logicalFlow: {
          rating: feedbackResponse.ratings?.logicalFlow?.stars || 4,
          comment: feedbackResponse.ratings?.logicalFlow?.comment || "글의 구조가 잘 정리되어 있어요!"
        }
      };
      
      console.log('📝 변환된 피드백:', processedFeedback);

      // 학생 프로필 확인 및 생성 (UUID 포함)
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('dashboard_uuid')
        .eq('student_name', studentName)
        .single();

      let studentUuid = existingProfile?.dashboard_uuid;

      // 학생 프로필이 없으면 새로 생성
      if (!existingProfile) {
        const { data: newProfile, error: profileCreateError } = await supabase
          .from('student_profiles')
          .insert({ student_name: studentName })
          .select('dashboard_uuid')
          .single();

        if (profileCreateError) throw profileCreateError;
        studentUuid = newProfile.dashboard_uuid;
      }

      // Save to database
      const { data, error } = await supabase
        .from('student_feedback')
        .insert({
          student_name: studentName,
          essay: essay,
          feedback_data: processedFeedback
        })
        .select()
        .single();

      if (error) throw error;

      setFeedback(processedFeedback);
      setFeedbackId(data.id);
      setStudentUuid(studentUuid || null);
      setIsAnalyzing(false);
      
      toast({
        title: "분석 완료! ✨",
        description: "맞춤형 피드백이 준비되었어요~",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      setIsAnalyzing(false);
      toast({
        title: "오류가 발생했습니다",
        description: "지금 피드백을 저장할 수 없어요. 다시 시도해주세요~",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
          <h1 className="text-4xl font-bold gradient-text">
            과학 글쓰기 도우미
          </h1>
          <Heart className="h-6 w-6 animate-pulse" style={{ color: 'hsl(var(--secondary))' }} />
        </div>
        <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
          AI 선생님 도우미로부터 따뜻하고 격려가 되는 과학 글쓰기 피드백을 받아보세요~ ✨
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="badge-elegant">
            <FileText className="h-3 w-3" />
            초등 4학년~중학교
          </span>
          <span className="badge-outline">
            과학적 정확성
          </span>
          <span className="badge-outline">
            창의적 표현
          </span>
          <span className="badge-outline">
            논리적 구조
          </span>
        </div>
      </div>

      {/* Tabs for Individual and Batch Analysis */}
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="individual" className="gap-2">
            <FileText className="h-4 w-4" />
            개별 분석
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            일괄 분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-8">
          <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="card-elegant">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                <FileText className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                과학 글쓰기 제출하기
              </h2>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                개인 맞춤 피드백을 받으려면 에세이나 과학 답안을 공유해주세요~
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>학생 이름</label>
                <input
                  type="text"
                  placeholder="이름을 입력해주세요~"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="input-elegant w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>과학 글쓰기 내용</label>
                <textarea
                  placeholder="과학 에세이나 답안을 여기에 작성해주세요... 예를 들어, 식물이 어떻게 음식을 만드는지, 물의 순환, 우주에 대해 배운 내용 등을 써보세요! ✨"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  className="textarea-elegant w-full"
                  style={{ minHeight: '300px' }}
                />
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  팁: 더 자세한 내용을 포함할수록 더 좋은 피드백을 제공할 수 있어요!
                </p>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="btn-warm w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    글쓰기 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    피드백 받기~
                  </>
                )}
              </button>
            </div>

            {/* Upload Section */}
            <div className="pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <div className="text-center space-y-2">
                <Upload className="h-8 w-8 mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  선생님용: 일괄 분석을 위한 스프레드시트 업로드
                </p>
                <button className="btn-warm" disabled>
                  <Upload className="h-4 w-4" />
                  파일 업로드 (준비중)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-6">
          {feedback ? (
            <div className="space-y-4">
              <FeedbackDisplay feedback={feedback} />
              {feedbackId && (
                <div className="card-elegant" style={{ backgroundColor: 'hsl(var(--secondary) / 0.1)' }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>피드백 공유하기</h4>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        이 링크를 복사해서 다른 사람과 피드백을 공유하세요
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-warm"
                        onClick={() => {
                          const url = `${window.location.origin}/feedback/${feedbackId}`;
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "학생용 링크 복사됨! ✨",
                            description: "학생이 이 링크로 피드백을 확인할 수 있어요~",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        학생용 링크
                      </button>
                      <button
                        className="btn-warm"
                        onClick={() => {
                          const url = `${window.location.origin}/teacher/feedback/${feedbackId}`;
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "교사용 링크 복사됨! ✨",
                            description: "이 링크로 피드백을 편집할 수 있어요~",
                          });
                        }}
                      >
                        <Users className="h-3 w-3" />
                        교사용 링크
                      </button>
                    </div>
                    <div className="mt-2">
                      <button
                        className="btn-warm w-full"
                        onClick={() => {
                          if (studentUuid) {
                            const url = `${window.location.origin}/student/${studentUuid}`;
                            navigator.clipboard.writeText(url);
                            toast({
                              title: `${studentName}님의 대시보드 링크 복사됨! ✨`,
                              description: "이 링크로 누적 피드백을 확인할 수 있어요~",
                            });
                          }
                        }}
                      >
                        <User className="h-3 w-3" />
                        {studentName}님의 누적 대시보드 링크
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-elegant text-center" style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'hsl(var(--muted-foreground) / 0.2)' }}>
              <div className="space-y-4">
                <Sparkles className="h-12 w-12 mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  여기에 피드백이 나타납니다
                </h3>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  글쓰기를 제출하면 AI 선생님 도우미로부터 따뜻하고 개인 맞춤형 피드백을 받을 수 있어요~ ✨
                </p>
              </div>
            </div>
          )}
        </div>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="mt-8">
          <ExcelUploader />
        </TabsContent>
      </Tabs>

      {/* 학생별 대시보드 링크 섹션 */}
      <div className="mt-12">
        <StudentLinksSection />
      </div>
    </div>
  );
};