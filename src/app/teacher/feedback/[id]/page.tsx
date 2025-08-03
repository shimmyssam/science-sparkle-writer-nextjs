'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FileText, Heart, Users, Eye, EyeOff } from 'lucide-react';
import { EditableFeedbackDisplay } from '@/components/EditableFeedbackDisplay';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackData } from '@/types/feedback';
import type { Json } from '@/integrations/supabase/types';

export default function TeacherFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [originalFeedback, setOriginalFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
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

        setOriginalFeedback(data.feedback_data as unknown as FeedbackData);
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

  const handleSaveFeedback = async (updatedFeedback: FeedbackData) => {
    try {
      const { error } = await supabase
        .from('student_feedback')
        .update({ 
          teacher_modified_feedback: updatedFeedback as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setFeedback(updatedFeedback);
      toast({
        title: "피드백이 저장되었습니다! ✨",
        description: "수정된 피드백이 성공적으로 저장되었어요~",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "저장 중 오류가 발생했습니다",
        description: "피드백을 저장할 수 없었어요. 다시 시도해주세요~",
        variant: "destructive",
      });
    }
  };

  const copyStudentLink = () => {
    const studentUrl = `${window.location.origin}/feedback/${id}`;
    navigator.clipboard.writeText(studentUrl);
    toast({
      title: "학생용 링크 복사됨! ✨",
      description: "학생이 이 링크로 피드백을 확인할 수 있어요~",
    });
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">👨‍🏫 교사용 페이지</h2>
        </div>
        <p className="text-blue-100 mt-2">AI 피드백을 검토하고 수정할 수 있는 교사 전용 공간입니다</p>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/')} className="p-0 h-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          홈으로 돌아가기
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              교사용 피드백 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              AI 피드백을 검토하고 필요시 수정해보세요 ✨
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyStudentLink}>
              <Heart className="h-4 w-4 mr-2" />
              학생 링크 복사
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? '편집 모드' : '미리보기'}
            </Button>
            <Badge variant="secondary" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              교사용
            </Badge>
          </div>
        </div>
      </div>

      {/* Feedback Display */}
      <Card className="p-6">
        {previewMode ? (
          <FeedbackDisplay feedback={feedback} />
        ) : (
          <EditableFeedbackDisplay 
            feedback={feedback}
            originalFeedback={originalFeedback}
            onSave={handleSaveFeedback}
          />
        )}
      </Card>

      {/* Footer */}
      <div className="text-center space-y-4 py-8">
        <p className="text-sm text-muted-foreground">
          AI 피드백을 검토하고 학생에게 더 나은 피드백을 제공해주세요! 💪
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Science Sparkle로 학생들의 과학 글쓰기를 돕고 있어요
        </div>
      </div>
    </div>
  );
} 