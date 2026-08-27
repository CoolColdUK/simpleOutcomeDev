export interface MarketingProject {
  readonly title: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly link: string;
  readonly status: 'Live' | 'Coming Soon';
}

export const marketingProjects: readonly MarketingProject[] = [
  {
    title: 'CraftySmile',
    description:
      'A comprehensive e-commerce management platform for Etsy sellers, featuring bulk listing creation, SEO optimization, and automated workflows.',
    features: ['Bulk Operations', 'SEO Tools', 'Analytics', 'Automation'],
    link: 'https://craftysmile.com',
    status: 'Live',
  },
  {
    title: 'GoalJar',
    description:
      'A personal finance tracking application that helps users manage their savings goals and financial transactions with intuitive categorization.',
    features: ['Goal Tracking', 'Transaction Management', 'Analytics', 'Budget Planning'],
    link: '#',
    status: 'Coming Soon',
  },
  {
    title: 'CoachPebble',
    description:
      "Most learning apps let you practice what you already know—CoachPebble shows you what you need to learn next. We're a learning companion that helps students find their weak spots, then drills them with the right questions until they master the topic. Starting with adaptive quizzes and performance insights, we're building towards a platform that serves families, schools, and tutors with tools like custom flashcards, teacher-led mini-tests, and detailed student reports. It's personalised, fun, and designed to make every practice session count.",
    features: ['Adaptive Learning', 'Performance Analytics', 'Custom Flashcards', 'Teacher Tools', 'Student Reports'],
    link: '#',
    status: 'Coming Soon',
  },
];
