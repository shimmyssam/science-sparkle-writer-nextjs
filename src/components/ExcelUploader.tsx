'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  Users,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { generateFeedback, validateOpenAIKey } from '@/services/openai';

interface ExcelData {
  student_name: string;
  essay: string;
  [key: string]: string | number | boolean | null;
}

interface AnalysisResult {
  student_name: string;
  feedback_id: string;
  success: boolean;
  error?: string;
}

export const ExcelUploader = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedData, setUploadedData] = useState<ExcelData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const { toast } = useToast();



  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processExcelFile = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 데이터 검증 및 변환
      const validData: ExcelData[] = [];
      for (const row of jsonData) {
        const rowData = row as Record<string, unknown>;
        
        // 학생 이름과 글 내용이 있는지 확인
        const studentName = rowData['학생이름'] || rowData['이름'] || rowData['student_name'] || rowData['name'];
        const essay = rowData['글내용'] || rowData['내용'] || rowData['essay'] || rowData['content'];
        
        if (studentName && essay) {
          validData.push({
            student_name: String(studentName).trim(),
            essay: String(essay).trim(),
            ...rowData
          });
        }
      }

      if (validData.length === 0) {
        toast({
          title: "데이터를 찾을 수 없습니다",
          description: "Excel 파일에 '학생이름'과 '글내용' 열이 필요합니다.",
          variant: "destructive",
        });
        return;
      }

      setUploadedData(validData);
      toast({
        title: "파일 업로드 성공! ✨",
        description: `${validData.length}명의 학생 데이터를 불러왔습니다.`,
      });

    } catch (error) {
      console.error('Excel 파일 처리 중 오류:', error);
      toast({
        title: "파일 처리 오류",
        description: "Excel 파일을 읽을 수 없습니다. 파일 형식을 확인해주세요.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (excelFile) {
      processExcelFile(excelFile);
    } else {
      toast({
        title: "잘못된 파일 형식",
        description: "Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.",
        variant: "destructive",
      });
    }
  }, [processExcelFile, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const processBatchAnalysis = async () => {
    if (uploadedData.length === 0) return;

    // OpenAI API 키 검증
    if (!validateOpenAIKey()) {
      toast({
        title: "API 설정이 필요합니다",
        description: "OpenAI API 키를 .env.local 파일에 설정해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setAnalysisResults([]);

    const results: AnalysisResult[] = [];

    for (let i = 0; i < uploadedData.length; i++) {
      const student = uploadedData[i];
      
      try {
        // 학생 프로필 확인 및 생성
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('dashboard_uuid')
          .eq('student_name', student.student_name)
          .single();

        if (!existingProfile) {
          await supabase
            .from('student_profiles')
            .insert({ student_name: student.student_name });
        }

        // OpenAI를 통한 실제 피드백 생성
        const feedbackResponse = await generateFeedback({
          studentName: student.student_name,
          essay: student.essay,
          gradeLevel: "초등~중등"
        });

        console.log(`🤖 ${student.student_name} OpenAI 응답:`, feedbackResponse);
        
        // FeedbackDisplay 컴포넌트와 호환되는 형식으로 변환
        const processedFeedback = {
          studentName: student.student_name,
          feedback: feedbackResponse.feedback || `${student.student_name}님의 과학 글쓰기 분석이 완료되었습니다! ✨`,
          strengths: Array.isArray(feedbackResponse.strengths) ? feedbackResponse.strengths : 
            [feedbackResponse.strengths || "과학적 사고력이 돋보이는 글이에요!"],
          improvements: Array.isArray(feedbackResponse.improvements) ? feedbackResponse.improvements : 
            [feedbackResponse.improvements || "더 구체적인 설명을 추가해보세요."],
          tips: Array.isArray(feedbackResponse.tips) ? feedbackResponse.tips : 
            [feedbackResponse.tips || "과학적 개념을 일상생활과 연결해보세요!"],
          ratings: feedbackResponse.ratings && typeof feedbackResponse.ratings === 'object' ? 
            feedbackResponse.ratings : {
              content: { stars: 4, comment: "내용이 흥미롭고 이해하기 쉬워요!" },
              logicalFlow: { stars: 4, comment: "논리적 구조가 잘 갖춰져 있어요!" },
              sentenceExpression: { stars: 4, comment: "문장이 명확하고 읽기 편해요!" },
              scientificKnowledge: { stars: 4, comment: "과학 지식이 잘 드러나요!" },
              readerAwareness: { stars: 4, comment: "독자를 고려한 설명이 좋아요!" }
            },
          // 기존 형식과의 호환성을 위한 추가 필드들
          improvedSentences: feedbackResponse.improvedSentences || [
            {
              original: "더 구체적인 표현이 필요한 문장이 있다면",
              improved: "과학적 용어를 사용해서 더 정확하게 표현해보세요."
            }
          ],
          scientificKnowledge: feedbackResponse.scientificKnowledge || {
            present: ["기본 과학 개념", "논리적 사고"],
            missing: ["심화 개념", "응용 사례"],
            suggestions: "과학적 개념을 일상생활 예시와 함께 설명하면 더 좋겠어요!"
          },
          logicalFlow: {
            rating: feedbackResponse.ratings?.logicalFlow?.stars || 4,
            comment: feedbackResponse.ratings?.logicalFlow?.comment || "글의 구조가 잘 정리되어 있어요!"
          }
        };
        
        console.log(`📝 ${student.student_name} 변환된 피드백:`, processedFeedback);

        // 피드백 저장
        const { data, error } = await supabase
          .from('student_feedback')
          .insert({
            student_name: student.student_name,
            essay: student.essay,
            feedback_data: processedFeedback
          })
          .select()
          .single();

        if (error) throw error;

        results.push({
          student_name: student.student_name,
          feedback_id: data.id,
          success: true
        });

      } catch (error) {
        console.error(`${student.student_name} 분석 중 오류:`, error);
        results.push({
          student_name: student.student_name,
          feedback_id: '',
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }

      // 진행률 업데이트
      const newProgress = ((i + 1) / uploadedData.length) * 100;
      setProgress(newProgress);

      // UI 업데이트를 위한 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setAnalysisResults(results);
    setIsProcessing(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: "배치 분석 완료! 🎉",
      description: `${successCount}/${results.length}명의 분석이 성공적으로 완료되었습니다.`,
    });
  };

  const downloadResultsTemplate = () => {
    // 결과 템플릿 다운로드 기능
    const templateData = [
      { '학생이름': '홍길동', '글내용': '광합성은 식물이 햇빛을 이용해 음식을 만드는 과정입니다...' },
      { '학생이름': '김영희', '글내용': '태양계에는 8개의 행성이 있습니다...' }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "과학 글쓰기 템플릿");
    XLSX.writeFile(wb, "과학글쓰기_업로드_템플릿.xlsx");

    toast({
      title: "템플릿 다운로드 완료! 📄",
      description: "다운로드된 템플릿을 참고해서 데이터를 입력해주세요.",
    });
  };

  return (
    <div className="space-y-6">
      {/* 파일 업로드 영역 */}
      <Card className="p-8">
        <div className="text-center space-y-4 mb-6">
          <FileSpreadsheet className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h3 className="text-xl font-semibold">Excel 파일로 일괄 분석</h3>
            <p className="text-muted-foreground">
              여러 학생의 과학 글쓰기를 한번에 업로드하고 분석할 수 있어요!
            </p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Excel 파일을 여기에 드롭하거나 클릭해서 선택하세요
            </p>
            <p className="text-sm text-muted-foreground">
              .xlsx, .xls 파일만 지원됩니다
            </p>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                파일 선택
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </Button>
            
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={downloadResultsTemplate}>
                <Download className="h-3 w-3 mr-1" />
                템플릿 다운로드
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 업로드된 데이터 미리보기 */}
      {uploadedData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold">업로드된 데이터</h4>
              <Badge variant="secondary">{uploadedData.length}명</Badge>
            </div>
            
            <Button 
              onClick={processBatchAnalysis} 
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isProcessing ? '분석 중...' : '일괄 분석 시작'}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedData.slice(0, 5).map((student, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">{student.student_name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {student.essay.substring(0, 100)}...
                </div>
              </div>
            ))}
            {uploadedData.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                ... 그 외 {uploadedData.length - 5}명 더
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 진행 상황 */}
      {isProcessing && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <h4 className="text-lg font-semibold">분석 진행 중...</h4>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% 완료 ({Math.ceil(progress * uploadedData.length / 100)}/{uploadedData.length}명)
            </p>
          </div>
        </Card>
      )}

      {/* 분석 결과 */}
      {analysisResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold">분석 결과</h4>
          </div>

          <div className="space-y-2">
            {analysisResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.student_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge variant="default">분석 완료</Badge>
                  ) : (
                    <Badge variant="destructive">실패</Badge>
                  )}
                  
                  {result.success && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/feedback/${result.feedback_id}`, '_blank')}
                    >
                      결과 보기
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {analysisResults.some(r => !r.success) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                일부 분석이 실패했습니다. 데이터 형식을 확인하고 다시 시도해보세요.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
};