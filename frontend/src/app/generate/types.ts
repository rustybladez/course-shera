
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
  
  export interface LearningMaterials {
    topic: string;
    readingNotes: string;
    slides: Slide[];
    lab: LabExercise;
    groundingSources?: Array<{ title: string; uri: string }>;
  }
  
  export interface AppState {
    materials: LearningMaterials | null;
    isLoading: boolean;
    error: string | null;
    isGeneratingImages: boolean;
  }
  