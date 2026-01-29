
export enum MaterialType {
    NOTES = 'NOTES',
    SLIDES = 'SLIDES',
    LAB = 'LAB',
    VOICE = 'VOICE'
  }
  
  export interface Slide {
    title: string;
    content: string;
    visualPrompt?: string;
    imageUrl?: string;
  }
  
  export interface LabExercise {
    title: string;
    description: string;
    language: string;
    code: string;
    explanation: string;
  }

  export interface ValidationReport {
    syntax_score: number;
    grounding_score: number;
    rubric_score: number;
    ai_eval_score: number;
    final_score: number;
    verdict: "PASS" | "REVIEW" | "FAIL";
    ai_explanation: string;
    notes: string[];
  }
  
  export interface LearningMaterials {
    topic: string;
    readingNotes: string;
    slides: Slide[];
    lab: LabExercise;
    groundingSources?: Array<{ title: string; uri: string }>;
    validation?: {
      theory?: ValidationReport;
      slides?: ValidationReport;
      lab?: ValidationReport;
    };
  