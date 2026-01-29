
import React, { useState, useEffect } from 'react';
import { Slide, ValidationReport } from '../types';
import { GeminiService } from '../services/geminiService';
import ValidationBadge from './ValidationBadge';

interface SlidesViewerProps {
  slides: Slide[];
  validation?: ValidationReport;
}

const SlidesViewer: React.FC<SlidesViewerProps> = ({ slides, validation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // store generated images per slide
  const [images, setImages] = useState<Record<number, string>>({});

  // loading state per slide
  const [loadingSlides, setLoadingSlides] = useState<Record<number, boolean>>(
    {}
  );

  // fullscreen preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const currentSlide = slides[currentSlideIndex];

  // generate image for a slide
  const fetchImageForSlide = async (index: number, force = false) => {
    if (images[index] && !force) return;

    setLoadingSlides(prev => ({ ...prev, [index]: true }));

    try {
      const slide = slides[index];
      const prompt = slide.visualPrompt || slide.title;

      const url = await GeminiService.generateVisual(prompt);

      if (url) {
        setImages(prev => ({ ...prev, [index]: url }));
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setLoadingSlides(prev => ({ ...prev, [index]: false }));
    }
  };

  // auto-generate image on slide change
  useEffect(() => {
    fetchImageForSlide(currentSlideIndex);
  }, [currentSlideIndex]);

  return (
    <>
      {validation && (
        <div className="mb-6">
          <ValidationBadge validation={validation} />
        </div>
      )}
      
      <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex-1 bg-indigo-900 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col">

          {/* Slide Counter */}
          <div className="absolute top-8 left-8 text-indigo-300/50 font-bold text-xl">
            0{currentSlideIndex + 1} / 0{slides.length}
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">

            {/* Text Content */}
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {currentSlide.title}
              </h2>

              <div className="space-y-4">
                {currentSlide.content.split('\n').map((bullet, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-indigo-100 text-lg md:text-xl"
                  >
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{bullet.replace(/^[•\-\*]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Section */}
            <div className="w-full md:w-1/2 aspect-video bg-indigo-800/50 rounded-2xl overflow-hidden border border-indigo-700/50 flex items-center justify-center relative">

              {/* Regenerate Button */}
              <button
                onClick={() => fetchImageForSlide(currentSlideIndex, true)}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 text-white px-3 py-1 rounded text-xs z-10"
              >
                🔄 Regenerate
              </button>

              {images[currentSlideIndex] ? (
                <img
                  src={images[currentSlideIndex]}
                  alt="Slide visual"
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                  onClick={() =>
                    setPreviewImage(images[currentSlideIndex])
                  }
                />
              ) : loadingSlides[currentSlideIndex] ? (
                <div className="text-center text-indigo-300">
                  <i className="fas fa-circle-notch fa-spin text-3xl mb-4"></i>
                  <p>Generating visual...</p>
                </div>
              ) : (
                <button
                  onClick={() =>
                    fetchImageForSlide(currentSlideIndex, true)
                  }
                  className="text-indigo-400 opacity-60 hover:opacity-100 text-center"
                >
                  <i className="fas fa-image text-6xl mb-2"></i>
                  <p className="text-sm mt-2">Generate Image</p>
                </button>
              )}

              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-[10px] text-white rounded uppercase tracking-widest">
                AI Generated
              </div>
            </div>
          </div>
        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center no-print">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all ${i === currentSlideIndex ? 'w-8 bg-indigo-400' : 'w-2 bg-indigo-800'}`}
              />
            ))}
          </div>
          <div className="flex gap-4">
            <button
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex(v => v - 1)}
              className="w-12 h-12 rounded-full border border-indigo-700 text-indigo-200 hover:bg-indigo-800 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex(v => v + 1)}
              className="w-12 h-12 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-30 flex items-center justify-center shadow-lg transition-all"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen Preview */}
    {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
            alt="Fullscreen preview"
          />
        </div>
      )}
    </>
  );
};

export default SlidesViewer;
