
"use client";

import React, { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Lightbulb, BarChart2, ListChecks } from 'lucide-react';
import { analyzeResume, type AnalyzeResumeOutput, type AnalyzeResumeInput } from '@/ai/flows/resume-analysis';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert File to Data URI
async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ResumeAnalyzer() {
  const { t, language } = useLanguage(); 
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [animatedScores, setAnimatedScores] = useState({ clarity: 0, keyword: 0 });

  useEffect(() => {
    if (analysisResult) {
      const { clarityScore, keywordScore } = analysisResult;
      let startTimestamp: number | null = null;
      const duration = 1500; // 1.5 seconds for the animation

      const animateScores = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        setAnimatedScores({
          clarity: Math.floor(progress * clarityScore),
          keyword: Math.floor(progress * keywordScore),
        });

        if (progress < 1) {
          requestAnimationFrame(animateScores);
        }
      };

      requestAnimationFrame(animateScores);
    }
  }, [analysisResult]);

  const handleResumeUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setUploadedFile(file);
    setAnimatedScores({ clarity: 0, keyword: 0 });

    try {
      const resumeDataUri = await fileToDataUri(file);
      const input: AnalyzeResumeInput = { resumeDataUri, language }; 
      const result = await analyzeResume(input);
      setAnalysisResult(result);
      toast({ title: t('messages.analysisCompleteTitle'), description: t('messages.analysisCompleteDesc') });
    } catch (e: any) {
      console.error("Error analyzing resume:", e);
      const errorMessage = e.message || t('messages.errorOccurred');
      setError(errorMessage);
      toast({ title: t('messages.analysisFailedTitle'), description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload onFileUpload={handleResumeUpload} disabled={isLoading} />
      
      {isLoading && (
        <Card className="shadow-md border-0"> 
          <CardContent className="pt-6 text-center">
            <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-muted-foreground">{t('messages.analysisInProgress')}</p>
            {uploadedFile && <p className="text-sm text-muted-foreground">{t('messages.feedbackForFile', { fileName: uploadedFile.name })}</p>}
          </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="shadow-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">{t('headings.analysisError')}</p>
                <p className="text-sm">{error}</p>
                <Button onClick={() => { setError(null); setUploadedFile(null); }} variant="outline" className="mt-4">
                {t('buttons.tryAgain')}
                </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && !isLoading && !error && (
        <Card className="shadow-xl">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
                <CheckCircle className="h-10 w-10 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-bold">{t('headings.resumeAnalysisReport')}</h3>
                {uploadedFile && <p className="text-sm text-muted-foreground">{t('messages.feedbackForFile', { fileName: uploadedFile.name })}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('resumeAnalyzerResults.clarityScore')}</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{animatedScores.clarity}/100</div>
                  <Progress value={animatedScores.clarity} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('resumeAnalyzerResults.keywordScore')}</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{animatedScores.keyword}/100</div>
                  <Progress value={animatedScores.keyword} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                {t('resumeAnalyzerResults.suggestions')}
              </h3>
              {analysisResult.suggestions.length > 0 ? (
                <ul className="space-y-3 list-inside">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start p-3 bg-muted/50 rounded-md">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mr-3 mt-1 shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{t('messages.noSpecificSuggestions')}</p>
              )}
            </div>
            <Button onClick={() => {setAnalysisResult(null); setUploadedFile(null);}} variant="outline" className="w-full mt-6">
              {t('buttons.analyzeAnotherResume')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
