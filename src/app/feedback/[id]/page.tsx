'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FileText, Heart } from 'lucide-react';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackData } from '@/types/feedback';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('student_feedback')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // 교사가 수정한 피드백이 있으면 그것을 사용, 없으면 원본 피드백 사용
        setFeedback((data.teacher_modified_feedback || data.feedback_data) as unknown as FeedbackData);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError('피드백을 불러올 수 없습니다.');
        toast({
          title: "오류가 발생했습니다",
          description: "피드백을 불러오는 중 문제가 발생했어요~",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-4 py-12">
          <Sparkles className="h-12 w-12 text-primary mx-auto animate-spin" />
          <h2 className="text-xl font-medium">피드백을 불러오는 중...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요~ ✨</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6 py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">피드백을 찾을 수 없어요</h2>
            <p className="text-muted-foreground">
              요청하신 피드백이 존재하지 않거나 삭제되었을 수 있어요~
            </p>
          </div>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Role Badge */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 rounded-lg mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">📚 학생용 페이지</h2>
        </div>
        <p className="text-green-100 mt-2">개인 맞춤 피드백을 확인할 수 있는 학생 전용 공간입니다</p>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/')} className="p-0 h-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          새로운 피드백 받기
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              과학 글쓰기 피드백
            </h1>
            <p className="text-muted-foreground mt-2">
              AI가 분석한 맞춤형 피드백을 확인해보세요 ✨
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Heart className="h-3 w-3 mr-1" />
            학생용
          </Badge>
        </div>
      </div>

      {/* Feedback Display */}
      <Card className="p-6">
        <FeedbackDisplay feedback={feedback} />
      </Card>

      {/* Footer */}
      <div className="text-center space-y-4 py-8">
        <p className="text-sm text-muted-foreground">
          이 피드백이 도움이 되셨나요? 더 나은 피드백을 위해 계속 개선하고 있어요! 💪
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Science Sparkle로 더 멋진 과학 글쓰기를 만들어보세요
        </div>
      </div>
    </div>
  );
} 