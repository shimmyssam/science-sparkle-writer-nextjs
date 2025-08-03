import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, CheckCircle, Lightbulb, BookOpen, Target } from 'lucide-react';
import type { FeedbackData } from '@/types/feedback';

// 마크다운 볼드 텍스트를 HTML로 변환하는 함수
const renderBoldText = (text: string) => {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

interface FeedbackProps {
  feedback: FeedbackData;
}

const StarRating = ({ stars }: { stars: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= stars ? 'text-warning fill-warning' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
};

const getCategoryNameInKorean = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    'content': '내용',
    'logicalFlow': '논리적 흐름',
    'sentenceExpression': '문장 표현',
    'scientificKnowledge': '과학 지식',
    'readerAwareness': '독자 고려'
  };
  return categoryMap[category] || category;
};

export const FeedbackDisplay = ({ feedback }: FeedbackProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-secondary-soft to-accent-soft border-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-secondary" />
          <h2 className="text-xl font-semibold text-foreground">
            {feedback.studentName}님의 피드백
          </h2>
        </div>
        <p className="text-muted-foreground">
          격려가 가득한 개인 맞춤 피드백입니다~ ✨
        </p>
      </Card>

      {/* 1. Strengths */}
      <Card className="p-6 space-y-4 border-secondary/20 hover:shadow-encouraging transition-all duration-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-secondary" />
          <h3 className="text-lg font-semibold text-foreground">
            ① 글쓰기의 세 가지 뛰어난 장점
          </h3>
        </div>
        <div className="space-y-3">
          {feedback.strengths?.map((strength, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Badge variant="secondary" className="mt-1 text-xs">
                {index + 1}
              </Badge>
              <p 
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderBoldText(strength) }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Improved Sentences */}
      <Card className="p-6 space-y-4 border-accent/20">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            ② 문장 개선 제안
          </h3>
        </div>
        <div className="space-y-4">
          {feedback.improvedSentences?.map((sentence, index) => (
            <div key={index} className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">원래 문장:</p>
                <p 
                  className="text-foreground"
                  dangerouslySetInnerHTML={{ __html: renderBoldText(sentence.original) }}
                />
              </div>
              <div className="p-3 bg-accent-soft rounded-lg border border-accent/20">
                <p className="text-sm text-accent mb-1">[개선 예시]</p>
                <p 
                  className="text-foreground font-medium"
                  dangerouslySetInnerHTML={{ __html: renderBoldText(sentence.improved) }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Scientific Knowledge */}
      <Card className="p-6 space-y-4 border-primary/20">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            ③ 과학 지식 평가
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              잘 포함된 개념들:
            </h4>
            <div className="flex flex-wrap gap-2">
              {feedback.scientificKnowledge?.present?.map((concept, index) => (
                <Badge key={index} variant="secondary">
                  {concept}
                </Badge>
              ))}
            </div>
          </div>
          
          {feedback.scientificKnowledge?.missing && feedback.scientificKnowledge.missing.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                추가를 고려해보세요:
              </h4>
              <div className="flex flex-wrap gap-2">
                {feedback.scientificKnowledge?.missing?.map((concept, index) => (
                  <Badge key={index} variant="outline">
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p 
              className="text-foreground"
              dangerouslySetInnerHTML={{ 
                __html: renderBoldText(feedback.scientificKnowledge?.suggestions || "과학적 개념을 더 깊이 탐구해보세요!") 
              }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Logical Flow */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            ④ 논리적 흐름과 구조
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <StarRating stars={feedback.logicalFlow?.rating || 4} />
          <span className="text-sm text-muted-foreground">
            {feedback.logicalFlow?.rating || 4}/5 별
          </span>
        </div>
        <p 
          className="text-foreground"
          dangerouslySetInnerHTML={{ 
            __html: renderBoldText(feedback.logicalFlow?.comment || "글의 구조와 논리적 흐름을 분석하고 있습니다.") 
          }}
        />
      </Card>

      {/* 5. Overall Ratings */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">
            ⑤ 종합 평가
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {Object.entries(feedback.ratings || {}).map(([category, rating]) => (
            <div key={category} className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {getCategoryNameInKorean(category)}
                </h4>
                <StarRating stars={rating.stars} />
              </div>
              <p 
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderBoldText(rating.comment) }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Tips for Next Time */}
      <Card className="p-6 space-y-4 bg-gradient-to-r from-accent-soft to-secondary-soft border-accent/20">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            ⑥ 다음 글쓰기를 위한 도움되는 팁
          </h3>
        </div>
        <div className="space-y-3">
          {feedback.tips?.map((tip, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Badge variant="outline" className="mt-1 text-xs">
                {index + 1}
              </Badge>
              <p 
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderBoldText(tip) }}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};