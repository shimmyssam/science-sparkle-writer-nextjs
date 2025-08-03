'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, User, ExternalLink, Copy, Search, BookOpen, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  student_name: string;
  feedback_count: number;
  latest_submission: string;
  average_rating: number;
  dashboard_uuid: string;
}

export const StudentLinksSection = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredStudents(
        students.filter(student => 
          student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      // student_profiles과 student_feedback을 조인해서 데이터 가져오기
      const { data: profilesData, error: profilesError } = await supabase
        .from('student_profiles')
        .select('student_name, dashboard_uuid');

      if (profilesError) throw profilesError;

      const studentsWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: feedbackData, error: feedbackError } = await supabase
            .from('student_feedback')
            .select('created_at, feedback_data, teacher_modified_feedback')
            .eq('student_name', profile.student_name);

          if (feedbackError) throw feedbackError;

          const feedbackCount = feedbackData?.length || 0;
          const latestSubmission = feedbackData?.length > 0 ? 
            Math.max(...feedbackData.map(f => new Date(f.created_at).getTime())) : null;

          // 평균 평점 계산
          let averageRating = 0;
          if (feedbackData && feedbackData.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ratings = feedbackData.map((feedback: any) => {
              const data = feedback.teacher_modified_feedback || feedback.feedback_data;
              if (data?.ratings) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return Object.values(data.ratings).reduce((sum: number, rating: any) => sum + rating.stars, 0) / 
                       Object.keys(data.ratings).length;
              }
              return 0;
            });
            averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          }

          return {
            student_name: profile.student_name,
            dashboard_uuid: profile.dashboard_uuid,
            feedback_count: feedbackCount,
            latest_submission: latestSubmission ? new Date(latestSubmission).toISOString() : new Date().toISOString(),
            average_rating: averageRating
          };
        })
      );

      setStudents(studentsWithStats.sort((a, b) => 
        new Date(b.latest_submission).getTime() - new Date(a.latest_submission).getTime()
      ));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "학생 목록을 불러올 수 없습니다",
        description: "잠시 후 다시 시도해주세요~",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyStudentLink = (student: StudentData) => {
    const url = `${window.location.origin}/student/${student.dashboard_uuid}`;
    navigator.clipboard.writeText(url);
    toast({
      title: `${student.student_name}님의 대시보드 링크 복사됨! ✨`,
      description: "학생이 이 링크로 자신의 누적 피드백을 확인할 수 있어요~",
    });
  };

  const openStudentDashboard = (student: StudentData) => {
    window.open(`/student/${student.dashboard_uuid}`, '_blank');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground">학생 목록을 불러오는 중...</p>
        </div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="p-6 border-dashed border-2 border-muted-foreground/20">
        <div className="text-center space-y-3">
          <Users className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium text-muted-foreground">
            아직 제출된 글쓰기가 없어요
          </h3>
          <p className="text-sm text-muted-foreground">
            첫 번째 학생이 글쓰기를 제출하면 여기에 표시됩니다~ ✨
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            학생별 누적 피드백 대시보드
          </h2>
          <Badge variant="secondary">{students.length}명</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          각 학생의 개인 대시보드 링크를 복사해서 공유하세요
        </p>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="학생 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 학생 목록 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredStudents.map((student) => (
          <div
            key={student.student_name}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">{student.student_name}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{student.feedback_count}회 제출</span>
                  </div>
                  {student.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>평균 {student.average_rating.toFixed(1)}/5점</span>
                    </div>
                  )}
                  <span>
                    최근: {new Date(student.latest_submission).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openStudentDashboard(student)}
              >
                <ExternalLink className="h-3 w-3" />
                보기
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyStudentLink(student)}
              >
                <Copy className="h-3 w-3" />
                링크 복사
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && searchTerm && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            &ldquo;{searchTerm}&rdquo;에 해당하는 학생이 없어요
          </p>
        </div>
      )}
    </Card>
  );
};