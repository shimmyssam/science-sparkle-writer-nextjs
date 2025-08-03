import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Star, ExternalLink } from 'lucide-react';

interface StudentFeedbackCardProps {
  feedback: {
    id: string;
    created_at: string;
    feedback_data: any;
    teacher_modified_feedback?: any;
  };
  index: number;
  onViewDetails: (id: string) => void;
}

export const StudentFeedbackCard = ({ feedback, index, onViewDetails }: StudentFeedbackCardProps) => {
  const feedbackData = feedback.teacher_modified_feedback || feedback.feedback_data;
  const submissionDate = new Date(feedback.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  // 평균 별점 계산
  const averageRating = feedbackData.ratings ? 
    Object.values(feedbackData.ratings).reduce((sum: number, rating: any) => sum + rating.stars, 0) / 
    Object.keys(feedbackData.ratings).length : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg font-semibold">
              {index + 1}주차
            </Badge>
            {feedback.teacher_modified_feedback && (
              <Badge variant="outline" className="text-xs">
                교사 수정됨
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="text-sm font-medium">
                {averageRating.toFixed(1)}/5
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(feedback.id)}
            >
              <ExternalLink className="h-3 w-3" />
              자세히 보기
            </Button>
          </div>
        </div>

        {/* 제출 날짜 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>제출일: {submissionDate}</span>
        </div>

        {/* 주요 강점 미리보기 */}
        {feedbackData.strengths && feedbackData.strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-foreground mb-2">💪 주요 강점</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {feedbackData.strengths[0]}
            </p>
          </div>
        )}

        {/* 개선 팁 미리보기 */}
        {feedbackData.tips && feedbackData.tips.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-foreground mb-2">💡 개선 팁</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {feedbackData.tips[0]}
            </p>
          </div>
        )}

        {/* 종합 점수 */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>ID: {feedback.id.slice(0, 8)}...</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i <= Math.round(averageRating) ? 'text-warning fill-warning' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};