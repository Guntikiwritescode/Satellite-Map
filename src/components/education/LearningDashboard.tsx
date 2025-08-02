import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  BookOpen, 
  Clock, 
  Trophy,
  RotateCcw,
  TrendingUp,
  Target
} from 'lucide-react';
import { useEducationStore } from '@/stores/educationStore';
import CourseCard from './CourseCard';

const LearningDashboard = React.memo(() => {
  const { courses, getTotalProgress, resetProgress } = useEducationStore();
  
  // Memoize expensive calculations
  const stats = useMemo(() => {
    const totalProgress = getTotalProgress();
    const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
    const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
    const estimatedTime = Math.round((totalLessons - completedLessons) * 12);
    
    return { totalProgress, totalLessons, completedLessons, estimatedTime };
  }, [courses, getTotalProgress]);
  
  const achievement = useMemo(() => {
    const { totalProgress } = stats;
    if (totalProgress >= 100) return { level: 'Master', icon: Trophy, color: 'text-yellow-500' };
    if (totalProgress >= 75) return { level: 'Expert', icon: Award, color: 'text-purple-500' };
    if (totalProgress >= 50) return { level: 'Proficient', icon: Target, color: 'text-blue-500' };
    if (totalProgress >= 25) return { level: 'Learning', icon: TrendingUp, color: 'text-green-500' };
    return { level: 'Beginner', icon: BookOpen, color: 'text-gray-500' };
  }, [stats.totalProgress]);
  const Achievement = achievement.icon;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-bold text-foreground">{stats.totalProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-stellar-cyan/20 rounded-lg">
                <Trophy className="h-5 w-5 text-stellar-cyan" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-foreground">{stats.completedLessons}/{stats.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-jupiter-amber/20 rounded-lg">
                <Achievement className={`h-5 w-5 ${achievement.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-lg font-bold text-foreground">{achievement.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-nebula-purple/20 rounded-lg">
                <Clock className="h-5 w-5 text-nebula-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Time</p>
                <p className="text-lg font-bold text-foreground">{stats.estimatedTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Learning Progress</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetProgress}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Progress
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-muted-foreground">{stats.completedLessons} of {stats.totalLessons} lessons</span>
              </div>
              <Progress value={stats.totalProgress} className="h-2" />
            </div>
            
            {stats.totalProgress >= 25 && (
              <div className="flex items-center space-x-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Achievement className={`h-5 w-5 ${achievement.color}`} />
                <div>
                  <p className="text-sm font-medium">Achievement Unlocked!</p>
                  <p className="text-xs text-muted-foreground">You've reached {achievement.level} level</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-foreground">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* Study Tips */}
      <Card className="glass-panel border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Study Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-stellar-cyan rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              Start with fundamentals in Commercial Satellites before moving to advanced topics
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-jupiter-amber rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              Complete lessons in order for the best learning experience
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-nebula-purple rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              Take your time with quiz questions to reinforce key concepts
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-danger-red rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              Apply what you learn by exploring satellites in the tactical view
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

LearningDashboard.displayName = 'LearningDashboard';

export default LearningDashboard;