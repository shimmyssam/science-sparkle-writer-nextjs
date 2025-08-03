'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Heart, Star, CheckCircle, Lightbulb, BookOpen, Target, Edit3, Save, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackData } from '@/types/feedback';

// 마크다운 볼드 텍스트를 HTML로 변환하는 함수
const renderBoldText = (text: string) => {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

interface EditableFeedbackProps {
  feedback: FeedbackData;
  originalFeedback?: FeedbackData | null;
  onSave: (updatedFeedback: FeedbackData) => void;
}

const StarRating = ({ stars, onStarClick }: { stars: number; onStarClick?: (rating: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 cursor-pointer ${
            i <= stars ? 'text-warning fill-warning' : 'text-muted-foreground'
          }`}
          onClick={() => onStarClick && onStarClick(i)}
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

export const EditableFeedbackDisplay = ({ feedback, onSave }: EditableFeedbackProps) => {
  const [editableFeedback, setEditableFeedback] = useState(feedback);
  const [editModes, setEditModes] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const toggleEditMode = (section: string) => {
    setEditModes(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateArrayItem = (section: 'strengths' | 'tips', index: number, value: string) => {
    setEditableFeedback(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (section: 'strengths' | 'tips') => {
    setEditableFeedback(prev => ({
      ...prev,
      [section]: [...prev[section], '새로운 항목을 입력하세요']
    }));
  };

  const removeArrayItem = (section: 'strengths' | 'tips', index: number) => {
    setEditableFeedback(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateRating = (category: string, field: 'stars' | 'comment', value: string | number) => {
    setEditableFeedback(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: {
          ...prev.ratings[category as keyof typeof prev.ratings],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    onSave(editableFeedback);
    setEditModes({});
    toast({
      title: "피드백이 저장되었습니다! ✨",
      description: "수정된 피드백이 성공적으로 저장되었어요~",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-secondary-soft to-accent-soft border-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-semibold text-foreground">
              {editableFeedback.studentName}님의 피드백 (교사용 편집)
            </h2>
          </div>
          <Button onClick={handleSave} variant="warm" size="sm">
            <Save className="h-4 w-4" />
            전체 저장
          </Button>
        </div>
        <p className="text-muted-foreground">
          각 섹션을 클릭하여 편집하고 개인 맞춤 피드백을 완성하세요~ ✨
        </p>
      </Card>

      {/* 1. Strengths */}
      <Card className="p-6 space-y-4 border-secondary/20 hover:shadow-encouraging transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">
              ① 글쓰기의 세 가지 뛰어난 장점
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('strengths')}
          >
            {editModes.strengths ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-3">
          {editableFeedback.strengths.map((strength, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Badge variant="secondary" className="mt-1 text-xs">
                {index + 1}
              </Badge>
              {editModes.strengths ? (
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={strength}
                    onChange={(e) => updateArrayItem('strengths', index, e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('strengths', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderBoldText(strength) }}
                />
              )}
            </div>
          ))}
          {editModes.strengths && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('strengths')}
            >
              <Plus className="h-4 w-4" />
              장점 추가
            </Button>
          )}
        </div>
      </Card>

      {/* 2. Improved Sentences */}
      <Card className="p-6 space-y-4 border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              ② 문장 개선 제안
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('sentences')}
          >
            {editModes.sentences ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-4">
          {editableFeedback.improvedSentences?.map((sentence, index) => (
            <div key={index} className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">원래 문장:</p>
                {editModes.sentences ? (
                  <Input
                    value={sentence.original}
                    onChange={(e) => {
                      const newSentences = [...(editableFeedback.improvedSentences || [])];
                      newSentences[index] = { ...newSentences[index], original: e.target.value };
                      setEditableFeedback(prev => ({ ...prev, improvedSentences: newSentences }));
                    }}
                    className="mt-1"
                  />
                ) : (
                  <p 
                    className="text-foreground"
                    dangerouslySetInnerHTML={{ __html: renderBoldText(sentence.original) }}
                  />
                )}
              </div>
              <div className="p-3 bg-accent-soft rounded-lg border border-accent/20">
                <p className="text-sm text-accent mb-1">[개선 예시]</p>
                {editModes.sentences ? (
                  <Textarea
                    value={sentence.improved}
                    onChange={(e) => {
                      const newSentences = [...(editableFeedback.improvedSentences || [])];
                      newSentences[index] = { ...newSentences[index], improved: e.target.value };
                      setEditableFeedback(prev => ({ ...prev, improvedSentences: newSentences }));
                    }}
                    className="mt-1 min-h-[60px]"
                  />
                ) : (
                  <p 
                    className="text-foreground font-medium"
                    dangerouslySetInnerHTML={{ __html: renderBoldText(sentence.improved) }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Scientific Knowledge */}
      <Card className="p-6 space-y-4 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              ③ 과학 지식 평가
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('knowledge')}
          >
            {editModes.knowledge ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              잘 포함된 개념들:
            </h4>
            <div className="flex flex-wrap gap-2">
              {editableFeedback.scientificKnowledge?.present?.map((concept, index) => (
                <Badge key={index} variant="secondary">
                  {concept}
                </Badge>
              ))}
            </div>
          </div>
          
          {editableFeedback.scientificKnowledge?.missing && editableFeedback.scientificKnowledge.missing.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                추가를 고려해보세요:
              </h4>
              <div className="flex flex-wrap gap-2">
                {editableFeedback.scientificKnowledge?.missing?.map((concept, index) => (
                  <Badge key={index} variant="outline">
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            {editModes.knowledge ? (
              <Textarea
                value={editableFeedback.scientificKnowledge?.suggestions || ''}
                onChange={(e) => setEditableFeedback(prev => ({
                  ...prev,
                  scientificKnowledge: { ...prev.scientificKnowledge!, suggestions: e.target.value }
                }))}
                className="w-full min-h-[80px]"
              />
            ) : (
              <p 
                className="text-foreground"
                dangerouslySetInnerHTML={{ __html: renderBoldText(editableFeedback.scientificKnowledge?.suggestions || '') }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* 4. Logical Flow */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              ④ 논리적 흐름과 구조
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('logic')}
          >
            {editModes.logic ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <StarRating 
            stars={editableFeedback.logicalFlow?.rating || 0} 
            onStarClick={editModes.logic ? (rating) => setEditableFeedback(prev => ({
              ...prev,
              logicalFlow: { ...prev.logicalFlow!, rating }
            })) : undefined}
          />
          <span className="text-sm text-muted-foreground">
            {editableFeedback.logicalFlow?.rating || 0}/5 별
          </span>
        </div>
        {editModes.logic ? (
          <Textarea
            value={editableFeedback.logicalFlow?.comment || ''}
            onChange={(e) => setEditableFeedback(prev => ({
              ...prev,
              logicalFlow: { ...prev.logicalFlow!, comment: e.target.value }
            }))}
            className="w-full min-h-[80px]"
          />
        ) : (
          <p 
            className="text-foreground"
            dangerouslySetInnerHTML={{ __html: renderBoldText(editableFeedback.logicalFlow?.comment || '') }}
          />
        )}
      </Card>

      {/* 5. Overall Ratings */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-foreground">
              ⑤ 종합 평가
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('ratings')}
          >
            {editModes.ratings ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {Object.entries(editableFeedback.ratings).map(([category, rating]) => (
            <div key={category} className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {getCategoryNameInKorean(category)}
                </h4>
                <StarRating 
                  stars={rating.stars} 
                  onStarClick={editModes.ratings ? (stars) => updateRating(category, 'stars', stars) : undefined}
                />
              </div>
              {editModes.ratings ? (
                <Textarea
                  value={rating.comment}
                  onChange={(e) => updateRating(category, 'comment', e.target.value)}
                  className="text-sm min-h-[60px]"
                />
              ) : (
                <p 
                  className="text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: renderBoldText(rating.comment) }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Tips for Next Time */}
      <Card className="p-6 space-y-4 bg-gradient-to-r from-accent-soft to-secondary-soft border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              ⑥ 다음 글쓰기를 위한 도움되는 팁
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEditMode('tips')}
          >
            {editModes.tips ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-3">
          {editableFeedback.tips.map((tip, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Badge variant="outline" className="mt-1 text-xs">
                {index + 1}
              </Badge>
              {editModes.tips ? (
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={tip}
                    onChange={(e) => updateArrayItem('tips', index, e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('tips', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderBoldText(tip) }}
                />
              )}
            </div>
          ))}
          {editModes.tips && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('tips')}
            >
              <Plus className="h-4 w-4" />
              팁 추가
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};