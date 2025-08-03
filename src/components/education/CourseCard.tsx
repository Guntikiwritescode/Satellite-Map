import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Shield, 
  Rocket, 
  Settings,
  Play,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Course, useEducationStore } from '@/stores/educationStore';

interface CourseCardProps {
  course: Course;
}

const iconMap = {
  Building,
  Shield,
  Rocket,
  Settings
};

const CourseCard: React.FC<CourseCardProps> = React.memo(({ course }) => {
  const { setSelectedCourse } = useEducationStore();
  
  // Memoize expensive calculations
  const courseStats = useMemo(() => {
    const Icon = iconMap[course.icon as keyof typeof iconMap] || Building;
    const progress = course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;
    const isCompleted = course.completedLessons === course.totalLessons;
    const nextLesson = course.lessons.find(lesson => !lesson.completed);
    
    return { Icon, progress, isCompleted, nextLesson };
  }, [course]);

  return (
    <Card className="glass-panel hover:border-primary/40 transition-all duration-200 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-${course.color}/20 rounded-lg group-hover:bg-${course.color}/30 transition-colors`}>
              <courseStats.Icon className={`h-6 w-6 text-${course.color}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                {course.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {course.description}
              </p>
            </div>
          </div>
          {courseStats.isCompleted && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </div>
          <Progress value={courseStats.progress} className="h-2" />
        </div>

        {/* Course Stats */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{course.totalLessons * 12}min total</span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {course.totalLessons} lessons
            </Badge>
          </div>
        </div>

        {/* Next Lesson Info */}
        {courseStats.nextLesson && (
          <div className="p-3 bg-muted/20 rounded-lg border border-muted/40">
            <p className="text-xs font-medium text-primary mb-1">Up Next:</p>
            <p className="text-sm text-foreground">{courseStats.nextLesson.title}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {courseStats.nextLesson.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">{courseStats.nextLesson.duration}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => setSelectedCourse(course.id)}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant={courseStats.isCompleted ? "outline" : "default"}
        >
          <Play className="h-4 w-4 mr-2" />
          {courseStats.isCompleted ? 'Review Course' : courseStats.nextLesson ? 'Continue Learning' : 'Start Course'}
        </Button>
      </CardContent>
    </Card>
  );
});

CourseCard.displayName = 'CourseCard';

export default CourseCard;