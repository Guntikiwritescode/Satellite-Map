import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useEducationStore } from '@/stores/educationStore';
import LearningDashboard from './education/LearningDashboard';
import LessonCard from './education/LessonCard';
import ProgressTracker from './education/ProgressTracker';

const SatelliteEducation = () => {
  const { 
    courses, 
    selectedCourse, 
    selectedLesson,
    setSelectedCourse 
  } = useEducationStore();

  // Dashboard View
  if (!selectedCourse) {
    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-terminal-green">
                SATELLITE ACADEMY
              </h1>
              <p className="text-base text-neon-cyan font-terminal">
                [ COMPREHENSIVE SPACE TECHNOLOGY EDUCATION ]
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Master satellite technology through structured learning paths. 
            From commercial applications to rocket science, build your expertise step by step.
          </p>
        </div>

        <LearningDashboard />
      </div>
    );
  }

  // Course View
  const course = courses.find(c => c.id === selectedCourse);
  if (!course) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Course Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCourse(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-terminal-green">{course.title}</h1>
          <p className="text-neon-cyan">{course.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Course Lessons</h2>
            <div className="text-sm text-muted-foreground">
              {course.lessons.length} lessons • {course.lessons.length * 12} minutes total
            </div>
          </div>
          
          <div className="space-y-3">
            {course.lessons.map((lesson, index) => {
              const isLocked = index > 0 && !course.lessons[index - 1].completed;
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  courseId={course.id}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <ProgressTracker course={course} />
        </div>
      </div>
    </div>
  );
};

export default SatelliteEducation;