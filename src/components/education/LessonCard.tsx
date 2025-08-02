import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle,
  Circle,
  Clock,
  Brain,
  ArrowRight,
  Award
} from 'lucide-react';
import { Lesson, useEducationStore } from '@/stores/educationStore';

interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  isLocked?: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, courseId, isLocked = false }) => {
  const { setSelectedLesson, markLessonComplete } = useEducationStore();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleStartLesson = () => {
    setSelectedLesson(lesson.id);
    setCurrentPage(0);
    setShowQuiz(false);
    setQuizAnswer(null);
    setShowExplanation(false);
  };

  const handleNextPage = () => {
    if (currentPage < lesson.content.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (lesson.quiz && !showQuiz) {
      setShowQuiz(true);
    } else {
      handleCompleteLesson();
    }
  };

  const handleCompleteLesson = () => {
    markLessonComplete(courseId, lesson.id);
    setSelectedLesson(null);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setQuizAnswer(answerIndex);
    setShowExplanation(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (lesson.id === useEducationStore.getState().selectedLesson) {
    // Lesson Content View
    return (
      <Card className="glass-panel h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-foreground">{lesson.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLesson(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Lesson Progress</span>
              <span className="text-sm text-muted-foreground">
                {showQuiz ? 'Quiz' : `${currentPage + 1}/${lesson.content.length}`}
              </span>
            </div>
            <Progress 
              value={showQuiz ? 90 : ((currentPage + 1) / lesson.content.length) * 85} 
              className="h-2" 
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!showQuiz ? (
            // Content Pages
            <>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="text-base leading-relaxed">
                  {lesson.content[currentPage]}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-muted/20">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Circle className="h-4 w-4" />
                  <span>Page {currentPage + 1} of {lesson.content.length}</span>
                </div>
                
                <Button onClick={handleNextPage}>
                  {currentPage < lesson.content.length - 1 ? (
                    <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
                  ) : lesson.quiz ? (
                    <>Take Quiz <Brain className="h-4 w-4 ml-2" /></>
                  ) : (
                    <>Complete <CheckCircle className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </>
          ) : (
            // Quiz Section
            <div className="space-y-6">
              <div className="text-center">
                <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Knowledge Check</h3>
                <p className="text-sm text-muted-foreground">Test your understanding</p>
              </div>
              
              <Card className="bg-muted/20 border-muted/40">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-4">{lesson.quiz?.question}</h4>
                  
                  <div className="space-y-2">
                    {lesson.quiz?.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={
                          quizAnswer === index 
                            ? index === lesson.quiz?.correct 
                              ? "default" 
                              : "destructive"
                            : "outline"
                        }
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => !showExplanation && handleQuizAnswer(index)}
                        disabled={showExplanation}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                        {showExplanation && index === lesson.quiz?.correct && (
                          <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {showExplanation && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-foreground">
                        <strong>Explanation:</strong> {lesson.quiz?.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {showExplanation && (
                <div className="text-center">
                  <Button onClick={handleCompleteLesson} size="lg">
                    <Award className="h-4 w-4 mr-2" />
                    Complete Lesson
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Lesson Card View
  return (
    <Card className={`glass-panel hover:border-primary/40 transition-all duration-200 ${
      isLocked ? 'opacity-50' : 'group cursor-pointer'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {lesson.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium mb-1 ${
              isLocked ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'
            }`}>
              {lesson.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {lesson.description}
            </p>
            
            <div className="flex items-center space-x-3">
              <Badge className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{lesson.duration}</span>
              </div>
            </div>
          </div>
          
          {!isLocked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartLesson}
              className="group-hover:bg-primary group-hover:text-primary-foreground"
            >
              {lesson.completed ? 'Review' : 'Start'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;