import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FileText, Heart } from 'lucide-react';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function FeedbackPage() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setFeedback(data.teacher_modified_feedback || data.feedback_data);
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
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              홈으로 돌아가기
            </Link>
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
        <Button variant="ghost" asChild className="p-0 h-auto">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            새로운 피드백 받기
          </Link>
        </Button>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              과학 글쓰기 피드백
            </h1>
            <Heart className="h-6 w-6 text-secondary animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              개별 피드백
            </Badge>
            <Badge variant="outline" className="gap-1">
              공유 가능
            </Badge>
          </div>
        </div>
      </div>

      {/* Feedback Display */}
      <div className="space-y-6">
        <FeedbackDisplay feedback={feedback} />
        
        <Card className="p-6 bg-secondary/30 border-2 border-primary/20">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-lg">더 많은 피드백이 필요하세요?</h3>
            <p className="text-muted-foreground">
              새로운 과학 글쓰기로 더 자세한 피드백을 받아보세요~ ✨
            </p>
            <Button asChild variant="warm">
              <Link to="/">
                <Sparkles className="h-4 w-4" />
                새로운 글쓰기 시작하기
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}