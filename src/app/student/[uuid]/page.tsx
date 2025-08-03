'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, User, TrendingUp, Calendar, BookOpen, Trophy } from 'lucide-react';
import { StudentFeedbackCard } from '@/components/StudentFeedbackCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StudentFeedbackRow, FeedbackData } from '@/types/feedback';

export default function StudentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackRow[]>([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalSubmissions: number;
    averageRating: number;
    improvementTrend: number;
    firstSubmission: string | null;
    latestSubmission: string | null;
  }>({
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

        setFeedbacks((data || []) as unknown as StudentFeedbackRow[]);
        
        // 통계 계산
        if (data && data.length > 0) {
          const ratings = data.map(feedback => {
            const feedbackData = (feedback.teacher_modified_feedback || feedback.feedback_data) as unknown as FeedbackData;
            if (feedbackData?.ratings) {
              return Object.values(feedbackData.ratings).reduce((sum: number, rating) => sum + rating.stars, 0) / 
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
    router.push(`/feedback/${feedbackId}`);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">피드백을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleBackToHome}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBackToHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="h-8 w-8 text-primary" />
                {studentName}님의 대시보드
              </h1>
              <p className="text-muted-foreground">과학 글쓰기 피드백 현황</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Science Sparkle
          </Badge>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">총 제출 횟수</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}회</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">평균 평점</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}점</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">개선도</p>
                <p className="text-2xl font-bold">{stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">최근 제출</p>
                <p className="text-sm font-medium">
                  {stats.latestSubmission ? new Date(stats.latestSubmission).toLocaleDateString() : '없음'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 피드백 목록 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">피드백 히스토리</h2>
          
          {feedbacks.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">아직 피드백이 없어요</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 과학 글쓰기를 제출해보세요!
              </p>
              <Button onClick={handleBackToHome}>
                글쓰기 시작하기
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {feedbacks.map((feedback) => (
                <StudentFeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  onViewDetails={() => handleViewDetails(feedback.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 