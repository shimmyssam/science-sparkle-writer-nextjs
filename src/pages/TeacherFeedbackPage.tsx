import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FileText, Heart, Users, Eye, EyeOff } from 'lucide-react';
import { EditableFeedbackDisplay } from '@/components/EditableFeedbackDisplay';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TeacherFeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [originalFeedback, setOriginalFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

        setOriginalFeedback(data.feedback_data);
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

  const handleSaveFeedback = async (updatedFeedback: any) => {
    try {
      const { error } = await supabase
        .from('student_feedback')
        .update({ 
          teacher_modified_feedback: updatedFeedback,
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">🎓 교사용 페이지</h2>
        </div>
        <p className="text-blue-100 mt-2">피드백을 편집하고 수정할 수 있는 교사 전용 공간입니다</p>
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
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              교사용 피드백 편집
            </h1>
            <Heart className="h-6 w-6 text-secondary animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              교사 전용
            </Badge>
            <Badge variant="outline" className="gap-1">
              편집 가능
            </Badge>
            <Badge variant="outline" className="gap-1">
              실시간 저장
            </Badge>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            variant={previewMode ? "outline" : "warm"}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                편집 모드
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                미리보기 모드
              </>
            )}
          </Button>
          
          <Button variant="secondary" onClick={copyStudentLink}>
            <Users className="h-4 w-4" />
            학생용 링크 복사
          </Button>
        </div>
      </div>

      {/* Feedback Display */}
      <div className="space-y-6">
        {previewMode ? (
          <FeedbackDisplay feedback={feedback} />
        ) : (
          <EditableFeedbackDisplay 
            feedback={feedback} 
            onSave={handleSaveFeedback}
          />
        )}
        
        <Card className="p-6 bg-secondary/30 border-2 border-primary/20">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-lg">교사 안내사항</h3>
            <div className="text-left space-y-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              <p>• 각 섹션의 편집 버튼을 눌러 피드백을 수정할 수 있습니다</p>
              <p>• 별점은 클릭하여 변경 가능하며, 실시간으로 저장됩니다</p>
              <p>• 미리보기 모드에서 학생이 보게 될 화면을 확인하세요</p>
              <p>• 수정된 피드백은 자동으로 저장되며, 학생용 링크를 통해 공유 가능합니다</p>
            </div>
            <Button asChild variant="warm">
              <Link to="/">
                <Sparkles className="h-4 w-4" />
                새로운 글쓰기 분석하기
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}