import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  Circle,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';
import { Course } from '@/stores/educationStore';

interface ProgressTrackerProps {
  course: Course;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ course }) => {
  const progress = course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;
  const remainingLessons = course.totalLessons - course.completedLessons;
  const estimatedTime = remainingLessons * 12; // 12 minutes average per lesson

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <span>Course Progress</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Completion</span>
            <span className="text-sm text-muted-foreground">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/20 rounded-lg border border-muted/40">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{course.completedLessons}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          
          <div className="text-center p-3 bg-muted/20 rounded-lg border border-muted/40">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{estimatedTime}m</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        {/* Lesson Status */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Lesson Status</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {course.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/20">
                <div className="flex-shrink-0">
                  {lesson.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {index + 1}. {lesson.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {lesson.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement */}
        {progress >= 100 && (
          <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Course Completed!</p>
                <p className="text-xs text-muted-foreground">You've mastered all lessons in this course</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;