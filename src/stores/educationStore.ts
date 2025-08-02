import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string[];
  completed: boolean;
  quiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

interface EducationStore {
  courses: Course[];
  selectedCourse: string | null;
  selectedLesson: string | null;
  
  // Cached calculations for performance
  _totalProgress: number | null;
  _progressLastUpdate: number;
  
  // Actions
  setSelectedCourse: (courseId: string | null) => void;
  setSelectedLesson: (lessonId: string | null) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  resetProgress: () => void;
  getTotalProgress: () => number;
  
  // Internal optimizations
  _invalidateProgressCache: () => void;
}

const initialCourses: Course[] = [
  {
    id: 'commercial',
    title: 'Commercial Satellites',
    description: 'Learn about the business of space and commercial satellite operations',
    icon: 'Building',
    color: 'stellar-cyan',
    totalLessons: 6,
    completedLessons: 0,
    lessons: [
      {
        id: 'comm-basics',
        title: 'Communication Satellite Fundamentals',
        description: 'Understanding how satellites enable global communications',
        duration: '8 min',
        difficulty: 'Beginner',
        completed: false,
        content: [
          'Communication satellites are spacecraft that relay and amplify radio telecommunications signals via transponders.',
          'They create communication channels between source and receiver points on Earth.',
          'The first commercial communication satellite was Telstar 1, launched in 1962.',
          'Geostationary satellites orbit at 35,786 km above Earth, appearing stationary to ground observers.',
          'Modern satellites carry multiple transponders, each capable of handling thousands of phone calls or data streams.',
          'Applications include television broadcasting, internet backhaul, mobile communications, and emergency services.'
        ],
        quiz: {
          question: 'At what altitude do geostationary communication satellites orbit?',
          options: ['2,000 km', '20,000 km', '35,786 km', '50,000 km'],
          correct: 2,
          explanation: 'Geostationary satellites orbit at exactly 35,786 km above Earth\'s equator, matching Earth\'s rotation period of 24 hours.'
        }
      },
      {
        id: 'earth-observation',
        title: 'Earth Observation Systems',
        description: 'How satellites monitor our planet from space',
        duration: '10 min',
        difficulty: 'Beginner',
        completed: false,
        content: [
          'Earth observation satellites use sensors to collect data about Earth\'s land, atmosphere, and oceans.',
          'They provide critical data for weather forecasting, climate monitoring, and disaster response.',
          'Different types of sensors capture visible light, infrared, radar, and other electromagnetic radiation.',
          'Resolution determines the smallest feature that can be detected - from meters to kilometers.',
          'Commercial providers like Planet Labs operate constellations of small satellites for daily global coverage.',
          'Applications include agriculture monitoring, urban planning, environmental compliance, and supply chain tracking.'
        ]
      },
      {
        id: 'navigation-systems',
        title: 'Global Navigation Systems',
        description: 'GPS and other positioning satellite networks',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Global Navigation Satellite Systems (GNSS) provide precise positioning and timing services.',
          'The US GPS system consists of 24+ satellites in Medium Earth Orbit (MEO) at ~20,000 km altitude.',
          'Other systems include GLONASS (Russia), Galileo (EU), and BeiDou (China).',
          'Receivers calculate position by measuring time delays from multiple satellites.',
          'Accuracy ranges from meters (civilian) to centimeters (with augmentation systems).',
          'Commercial applications include precision agriculture, autonomous vehicles, and location-based services.'
        ]
      },
      {
        id: 'satellite-internet',
        title: 'Satellite Internet Constellations',
        description: 'Modern mega-constellations providing global internet',
        duration: '15 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Large Low Earth Orbit (LEO) constellations provide global broadband internet coverage.',
          'Starlink, OneWeb, and Amazon Project Kuiper are leading constellation projects.',
          'LEO satellites offer lower latency than traditional geostationary satellites.',
          'Thousands of satellites work together to provide continuous coverage.',
          'Ground stations and inter-satellite links route data across the network.',
          'Benefits include coverage in remote areas and disaster recovery communications.'
        ]
      },
      {
        id: 'commercial-imaging',
        title: 'Commercial Satellite Imaging',
        description: 'High-resolution Earth imaging for business applications',
        duration: '10 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Commercial imaging satellites provide sub-meter resolution imagery for various industries.',
          'Maxar, Planet Labs, and BlackSky are major commercial imaging providers.',
          'Synthetic Aperture Radar (SAR) can image through clouds and at night.',
          'Hyperspectral imaging analyzes specific wavelengths for detailed material identification.',
          'Applications include oil and gas exploration, mining, agriculture, and financial analytics.',
          'Real-time monitoring capabilities enable rapid response to changing conditions.'
        ]
      },
      {
        id: 'business-models',
        title: 'Satellite Business Models',
        description: 'How satellite companies generate revenue',
        duration: '12 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Satellite operators use various business models: capacity leasing, managed services, and data sales.',
          'Traditional GEO operators lease transponder capacity to broadcasters and telecom companies.',
          'New space companies focus on data-as-a-service and analytics platforms.',
          'Vertical integration combines satellite manufacturing, launch, and operations.',
          'Subscription models provide regular access to imagery and data products.',
          'Government contracts remain a significant revenue source for many operators.'
        ]
      }
    ]
  },
  {
    id: 'government',
    title: 'Government & Military',
    description: 'Explore government and military satellite applications',
    icon: 'Shield',
    color: 'jupiter-amber',
    totalLessons: 5,
    completedLessons: 0,
    lessons: [
      {
        id: 'military-comms',
        title: 'Military Satellite Communications',
        description: 'Secure communications for defense operations',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Military satellites provide secure, jam-resistant communications for defense forces.',
          'Advanced Extremely High Frequency (AEHF) satellites offer protected communications.',
          'Multiple security layers including encryption and frequency hopping prevent interception.',
          'Global coverage ensures communications in any theater of operations.',
          'Interoperability allows coordination between allied forces.',
          'Space-based relay capabilities extend beyond line-of-sight limitations.'
        ]
      },
      {
        id: 'intelligence-surveillance',
        title: 'Intelligence & Surveillance',
        description: 'Space-based intelligence gathering systems',
        duration: '15 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Intelligence satellites provide strategic and tactical information to government agencies.',
          'Electro-optical satellites capture high-resolution visible and infrared imagery.',
          'Signals intelligence (SIGINT) satellites intercept communications and electronic emissions.',
          'Radar satellites can monitor activities regardless of weather or lighting conditions.',
          'Real-time surveillance enables rapid response to emerging threats.',
          'Multi-source intelligence fusion provides comprehensive situational awareness.'
        ]
      },
      {
        id: 'space-stations',
        title: 'Space Stations & Research',
        description: 'Government space stations and scientific research',
        duration: '18 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'The International Space Station (ISS) represents international cooperation in space.',
          'Microgravity research advances materials science, medicine, and fundamental physics.',
          'China\'s Tiangong space station demonstrates growing space capabilities.',
          'Future lunar stations will support deep space exploration missions.',
          'Commercial crew vehicles now transport astronauts to and from stations.',
          'Research conducted in space benefits life on Earth through technology transfer.'
        ]
      },
      {
        id: 'weather-climate',
        title: 'Weather & Climate Monitoring',
        description: 'Satellites for meteorology and climate science',
        duration: '14 min',
        difficulty: 'Beginner',
        completed: false,
        content: [
          'Weather satellites provide critical data for forecasting and climate research.',
          'Geostationary satellites monitor weather patterns continuously over specific regions.',
          'Polar-orbiting satellites provide global coverage twice daily.',
          'Advanced sensors measure temperature, humidity, precipitation, and atmospheric composition.',
          'Data supports hurricane tracking, severe weather warnings, and climate models.',
          'International cooperation ensures global weather monitoring coverage.'
        ]
      },
      {
        id: 'early-warning',
        title: 'Early Warning Systems',
        description: 'Satellites for missile detection and nuclear monitoring',
        duration: '10 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Early warning satellites detect missile launches using infrared sensors.',
          'Space Based Infrared System (SBIRS) provides global missile warning coverage.',
          'Nuclear detonation detection systems monitor for treaty violations.',
          'Rapid alert capabilities enable defensive responses to threats.',
          'International monitoring supports arms control verification.',
          'Advanced sensors can distinguish between various types of launches.'
        ]
      }
    ]
  },
  {
    id: 'manufacturing',
    title: 'Build & Launch',
    description: 'Learn how satellites are designed, built, and launched',
    icon: 'Rocket',
    color: 'nebula-purple',
    totalLessons: 7,
    completedLessons: 0,
    lessons: [
      {
        id: 'satellite-design',
        title: 'Satellite Design Principles',
        description: 'Fundamental concepts in spacecraft design',
        duration: '16 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Satellite design balances mission requirements, mass constraints, and cost considerations.',
          'The spacecraft bus provides power, thermal control, attitude control, and communications.',
          'Payload instruments or antennas perform the primary mission functions.',
          'Redundancy and fault tolerance ensure mission success despite component failures.',
          'Modular design allows for standardization and cost reduction.',
          'Environmental factors include radiation, thermal cycling, and micrometeorite impacts.'
        ]
      },
      {
        id: 'manufacturing-process',
        title: 'Satellite Manufacturing',
        description: 'How satellites are built in clean room facilities',
        duration: '14 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Satellites are assembled in ultra-clean environments to prevent contamination.',
          'Precision manufacturing ensures components meet strict specifications.',
          'Integration and testing verify all systems work together correctly.',
          'Quality control processes prevent defects that could cause mission failure.',
          'Supply chain management coordinates components from multiple suppliers.',
          'Modern manufacturing includes automation and digital quality tracking.'
        ]
      },
      {
        id: 'testing-validation',
        title: 'Testing & Validation',
        description: 'Rigorous testing to ensure satellite reliability',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Thermal vacuum testing simulates the space environment on Earth.',
          'Vibration testing ensures satellites survive launch stresses.',
          'Electromagnetic compatibility testing prevents interference between systems.',
          'Functional testing verifies all systems operate as designed.',
          'Environmental testing includes radiation exposure and thermal cycling.',
          'End-to-end testing validates complete mission scenarios.'
        ]
      },
      {
        id: 'launch-vehicles',
        title: 'Launch Vehicle Systems',
        description: 'Rockets that carry satellites to orbit',
        duration: '18 min',
        difficulty: 'Beginner',
        completed: false,
        content: [
          'Launch vehicles provide the energy needed to reach orbital velocity.',
          'Multi-stage rockets shed weight as fuel is consumed during ascent.',
          'Payload fairings protect satellites during atmospheric flight.',
          'Different orbits require different amounts of energy to reach.',
          'Reusable rockets like Falcon 9 have reduced launch costs significantly.',
          'Small satellite launchers serve the growing market for dedicated launches.'
        ]
      },
      {
        id: 'orbital-mechanics',
        title: 'Orbital Mechanics Basics',
        description: 'The physics of satellite orbits',
        duration: '20 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Orbital mechanics governs how satellites move through space.',
          'Kepler\'s laws describe elliptical orbits and orbital periods.',
          'Orbital altitude determines the satellite\'s speed and period.',
          'Inclination angle affects ground coverage patterns.',
          'Orbital decay occurs due to atmospheric drag in low orbits.',
          'Stationkeeping maneuvers maintain precise orbital positions.'
        ]
      },
      {
        id: 'mission-planning',
        title: 'Mission Planning & Design',
        description: 'Planning successful satellite missions',
        duration: '15 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Mission planning begins with defining objectives and requirements.',
          'Trade studies compare different design options and their trade-offs.',
          'Launch window analysis determines optimal launch timing.',
          'Ground station coverage affects communication opportunities.',
          'Mission timeline spans from concept through end-of-life disposal.',
          'Risk analysis identifies potential failure modes and mitigation strategies.'
        ]
      },
      {
        id: 'deployment-commissioning',
        title: 'Deployment & Commissioning',
        description: 'From launch to operational status',
        duration: '10 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Deployment begins immediately after separation from the launch vehicle.',
          'Solar panels and antennas deploy automatically or by ground command.',
          'Initial checkout verifies all systems are functioning properly.',
          'Orbit adjustments position the satellite in its operational orbit.',
          'Commissioning phase tests all mission capabilities before service begins.',
          'Handover to operations team occurs after successful commissioning.'
        ]
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operations & Maintenance',
    description: 'Day-to-day satellite operations and lifecycle management',
    icon: 'Settings',
    color: 'danger-red',
    totalLessons: 6,
    completedLessons: 0,
    lessons: [
      {
        id: 'ground-control',
        title: 'Ground Control Operations',
        description: '24/7 satellite monitoring and control',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Mission control centers monitor satellite health and performance continuously.',
          'Telemetry provides real-time data on satellite systems and status.',
          'Command and control systems allow operators to manage satellite functions.',
          'Automated monitoring systems alert operators to anomalies.',
          'Multiple ground stations provide global communication coverage.',
          'Backup control centers ensure continuity of operations.'
        ]
      },
      {
        id: 'orbit-maintenance',
        title: 'Orbit Maintenance',
        description: 'Keeping satellites in their proper positions',
        duration: '14 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'Orbital perturbations gradually change satellite orbits over time.',
          'Stationkeeping maneuvers correct for orbital drift and maintain position.',
          'Fuel consumption limits satellite operational lifetime.',
          'Precise orbit determination uses tracking data from multiple sources.',
          'Collision avoidance maneuvers protect satellites from space debris.',
          'Electric propulsion systems offer fuel-efficient orbit maintenance.'
        ]
      },
      {
        id: 'anomaly-resolution',
        title: 'Anomaly Resolution',
        description: 'Diagnosing and fixing satellite problems',
        duration: '16 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Anomalies can range from minor software glitches to major hardware failures.',
          'Diagnostic procedures help identify the root cause of problems.',
          'Remote software updates can fix many operational issues.',
          'Safe mode procedures protect satellites when problems occur.',
          'Redundant systems allow operations to continue despite component failures.',
          'Lessons learned from anomalies improve future satellite designs.'
        ]
      },
      {
        id: 'satellite-servicing',
        title: 'In-Orbit Satellite Servicing',
        description: 'Extending satellite life through space-based maintenance',
        duration: '18 min',
        difficulty: 'Advanced',
        completed: false,
        content: [
          'Robotic servicing missions can extend satellite operational life.',
          'Refueling services add years to satellite missions.',
          'Component replacement can restore failed capabilities.',
          'Orbit relocation services move satellites to new positions.',
          'Inspection services provide detailed health assessments.',
          'Future servicing capabilities may include major upgrades and repairs.'
        ]
      },
      {
        id: 'data-processing',
        title: 'Data Processing & Distribution',
        description: 'From raw satellite data to useful information',
        duration: '10 min',
        difficulty: 'Beginner',
        completed: false,
        content: [
          'Raw satellite data requires processing to become useful information.',
          'Ground processing systems convert, calibrate, and format data.',
          'Data distribution networks deliver products to end users.',
          'Cloud computing enables rapid processing of large datasets.',
          'Automated processing pipelines handle routine data products.',
          'Quality control ensures data meets accuracy requirements.'
        ]
      },
      {
        id: 'end-of-life',
        title: 'End-of-Life Management',
        description: 'Responsible satellite disposal and deorbiting',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false,
        content: [
          'End-of-life planning prevents creation of long-term space debris.',
          'Deorbiting procedures safely dispose of satellites in Earth\'s atmosphere.',
          'Graveyard orbits provide disposal for high-altitude satellites.',
          'International guidelines require disposal within 25 years of mission end.',
          'Active debris removal services may clean up existing space junk.',
          'Sustainable space practices ensure access for future generations.'
        ]
      }
    ]
  }
];

export const useEducationStore = create<EducationStore>()(
  persist(
    (set, get) => ({
      courses: initialCourses,
      selectedCourse: null,
      selectedLesson: null,
      _totalProgress: null,
      _progressLastUpdate: 0,

      setSelectedCourse: (courseId) => set({ selectedCourse: courseId, selectedLesson: null }),
      
      setSelectedLesson: (lessonId) => set({ selectedLesson: lessonId }),
      
      markLessonComplete: (courseId, lessonId) => set((state) => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            const updatedLessons = course.lessons.map(lesson => 
              lesson.id === lessonId ? { ...lesson, completed: true } : lesson
            );
            const completedCount = updatedLessons.filter(lesson => lesson.completed).length;
            return {
              ...course,
              lessons: updatedLessons,
              completedLessons: completedCount
            };
          }
          return course;
        });
        return { courses: updatedCourses, _totalProgress: null };
      }),
      
      resetProgress: () => set((state) => ({
        courses: state.courses.map(course => ({
          ...course,
          completedLessons: 0,
          lessons: course.lessons.map(lesson => ({ ...lesson, completed: false }))
        })),
        _totalProgress: null
      })),
      
      getTotalProgress: () => {
        const state = get();
        const now = Date.now();
        
        // Use cached value if still valid (cache for 1 second)
        if (state._totalProgress !== null && (now - state._progressLastUpdate) < 1000) {
          return state._totalProgress;
        }
        
        const totalLessons = state.courses.reduce((sum, course) => sum + course.totalLessons, 0);
        const completedLessons = state.courses.reduce((sum, course) => sum + course.completedLessons, 0);
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // Cache the result
        set({ _totalProgress: progress, _progressLastUpdate: now });
        
        return progress;
      },
      
      _invalidateProgressCache: () => set({ _totalProgress: null })
    }),
    {
      name: 'satellite-education-progress',
      partialize: (state) => ({
        courses: state.courses,
        selectedCourse: state.selectedCourse,
        selectedLesson: state.selectedLesson
      })
    }
  )
);