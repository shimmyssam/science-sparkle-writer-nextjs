import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, User, TrendingUp, Calendar, BookOpen, Trophy } from 'lucide-react';
import { StudentFeedbackCard } from '@/components/StudentFeedbackCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboardPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    averageRating: 0,
    improvementTrend: 0,
    firstSubmission: null,
    latestSubmission: null
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudentFeedbacks = async () => {
      if (!uuid) return;

      try {
        // UUID로 학생 정보 조회
        const { data: profileData, error: profileError } = await supabase
          .from('student_profiles')
          .select('student_name')
          .eq('dashboard_uuid', uuid)
          .single();

        if (profileError) throw profileError;
        
        setStudentName(profileData.student_name);
        
        const { data, error } = await supabase
          .from('student_feedback')
          .select('*')
          .eq('student_name', profileData.student_name)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setFeedbacks(data || []);
        
        // 통계 계산
        if (data && data.length > 0) {
          const ratings = data.map(feedback => {
            const feedbackData = feedback.teacher_modified_feedback || feedback.feedback_data;
            if (feedbackData.ratings) {
              return Object.values(feedbackData.ratings).reduce((sum: number, rating: any) => sum + rating.stars, 0) / 
                     Object.keys(feedbackData.ratings).length;
            }
            return 0;
          });

          const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          const improvementTrend = ratings.length > 1 ? 
            ((ratings[ratings.length - 1] - ratings[0]) / ratings[0]) * 100 : 0;

          setStats({
            totalSubmissions: data.length,
            averageRating: averageRating,
            improvementTrend: improvementTrend,
            firstSubmission: data[0].created_at,
            latestSubmission: data[data.length - 1].created_at
          });
        }
      } catch (error) {
        console.error('Error fetching student feedbacks:', error);
        setError('피드백을 불러올 수 없습니다.');
        toast({
          title: "오류가 발생했습니다",
          description: "학생 피드백을 불러오는 중 문제가 발생했어요~",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentFeedbacks();
  }, [uuid, toast]);

  const handleViewDetails = (feedbackId: string) => {
    navigate(`/feedback/${feedbackId}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center space-y-4 py-12">
          <Sparkles className="h-12 w-12 text-primary mx-auto animate-spin" />
          <h2 className="text-xl font-medium">학습 기록을 불러오는 중...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요~ ✨</p>
        </div>
      </div>
    );
  }

  if (error || !feedbacks.length) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center space-y-6 py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">학습 기록을 찾을 수 없어요</h2>
            <p className="text-muted-foreground">
              {studentName ? `${studentName}님의 피드백이 아직 없어요~` : '유효하지 않은 학생 링크입니다.'}<br/>
              {studentName ? '첫 번째 과학 글쓰기를 제출해보세요!' : '올바른 링크인지 확인해주세요.'}
            </p>
          </div>
          <Button onClick={handleBackToHome}>
            <ArrowLeft className="h-4 w-4" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // studentName은 이미 데이터베이스에서 가져온 상태

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Role Badge */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">📊 학생용 대시보드</h2>
        </div>
        <p className="text-purple-100 mt-2">나의 학습 진도와 누적 피드백을 확인할 수 있는 개인 학습 공간입니다</p>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToHome} className="p-0 h-auto">
          <ArrowLeft className="h-4 w-4" />
          홈으로 돌아가기
        </Button>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {studentName}님의 학습 대시보드
            </h1>
            <Trophy className="h-6 w-6 text-secondary animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              총 {stats.totalSubmissions}회 제출
            </Badge>
            <Badge variant="outline" className="gap-1">
              평균 {stats.averageRating.toFixed(1)}/5점
            </Badge>
            {stats.improvementTrend > 0 && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3" />
                {stats.improvementTrend.toFixed(1)}% 향상
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-900">총 제출 횟수</h3>
          <p className="text-2xl font-bold text-blue-700">{stats.totalSubmissions}회</p>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-green-900">평균 평점</h3>
          <p className="text-2xl font-bold text-green-700">{stats.averageRating.toFixed(1)}/5</p>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-purple-900">성장률</h3>
          <p className="text-2xl font-bold text-purple-700">
            {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* 학습 기간 정보 */}
      {stats.firstSubmission && stats.latestSubmission && (
        <Card className="p-6 bg-secondary/30 border-2 border-primary/20">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">첫 제출</p>
                <p className="font-medium">
                  {new Date(stats.firstSubmission).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="text-muted-foreground">~</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">최근 제출</p>
                <p className="font-medium">
                  {new Date(stats.latestSubmission).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 피드백 목록 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">📝 과학 글쓰기 피드백 기록</h2>
        <div className="grid gap-6">
          {feedbacks.map((feedback, index) => (
            <StudentFeedbackCard
              key={feedback.id}
              feedback={feedback}
              index={index}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>

      {/* 격려 메시지 */}
      <Card className="p-6 bg-gradient-to-r from-accent-soft to-secondary-soft border-accent/20">
        <div className="text-center space-y-3">
          <h3 className="font-semibold text-lg">🌟 {studentName}님, 정말 열심히 하고 있어요!</h3>
          <p className="text-muted-foreground">
            지금까지 {stats.totalSubmissions}번의 과학 글쓰기를 완성했고, 
            평균 {stats.averageRating.toFixed(1)}점의 훌륭한 성과를 보이고 있어요!
            {stats.improvementTrend > 0 && (
              <span className="text-green-600 font-medium">
                {' '}특히 {stats.improvementTrend.toFixed(1)}%의 성장을 이루어냈답니다! 🎉
              </span>
            )}
          </p>
          <Button onClick={handleBackToHome} variant="warm">
            <Sparkles className="h-4 w-4" />
            새로운 글쓰기 도전하기
          </Button>
        </div>
      </Card>
    </div>
  );
}