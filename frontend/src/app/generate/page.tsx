"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generate } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import Layout from "./components/Layout";
import MaterialGenerator from "./components/MaterialGenerator";
import TheoryViewer, { TheoryViewerHandle } from "./components/TheoryViewer";
import SlidesViewer from "./components/SlidesViewer";
import LabViewer from "./components/LabViewer";
import { LearningMaterials, Slide, LabExercise } from "./types";

export default function GeneratePage() {
  const router = useRouter();
  const { getToken, me, loading: meLoading } = useMe();
  
  const [state, setState] = useState<{
    materials: LearningMaterials | null;
    isLoading: boolean;
    error: string | null;
  }>({
    materials: null,
    isLoading: false,
    error: null,
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const theoryRef = useRef<TheoryViewerHandle>(null);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      router.replace("/login");
    }
  }, [meLoading, me, router]);

  const handleGenerate = async (prompt: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const token = await getToken();
    if (!token) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Authentication required",
      }));
      return;
    }

    try {
      // Generate all three types in parallel
      const [notesRes, slidesRes, labRes] = await Promise.all([
        generate("theory_notes", prompt, undefined, token),
        generate("slides", prompt, undefined, token),
        generate("lab_code", prompt, undefined, token),
      ]);

      // Parse slides from markdown
      const slidesContent = slidesRes.content_markdown;
      const slideBlocks = slidesContent.split("---").filter((s) => s.trim());
      const slides: Slide[] = slideBlocks.map((block) => {
        const lines = block.trim().split("\n");
        const title = lines.find((l) => l.startsWith("#"))?.replace(/^#\s*/, "") || "Slide";
        const content = lines
          .filter((l) => !l.startsWith("#"))
          .join("\n")
          .trim();
        return { title, content, visualPrompt: `Educational diagram for: ${title}` };
      });

      // Parse lab code from markdown
      const labContent = labRes.content_markdown;
      const codeMatch = labContent.match(/```(\w+)?\n([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[2] : "// No code generated";
      const language = codeMatch ? codeMatch[1] || "python" : "python";
      
      const titleMatch = labContent.match(/^#\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1] : prompt;
      
      const descMatch = labContent.match(/^(?!#|```)(.*?)$/m);
      const description = descMatch ? descMatch[1].trim() : "Lab exercise";
      
      const explMatch = labContent.match(/##\s*(?:Explanation|How it works)([\s\S]*?)(?=##|$)/i);
      const explanation = explMatch ? explMatch[1].trim() : "Study the code above.";

      const lab: LabExercise = {
        title,
        description,
        language,
        code,
        explanation,
      };

      const materials: LearningMaterials = {
        topic: prompt,
        readingNotes: notesRes.content_markdown,
        slides: slides.length > 0 ? slides : [{ title: "Generated Slides", content: slidesContent }],
        lab,
        groundingSources: [],
      };

      setState({ materials, isLoading: false, error: null });
      setActiveTab("notes");
    } catch (err) {
      setState({
        materials: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  };

  const handleSidebarExportPDF = () => {
    if (activeTab !== "notes") {
      setActiveTab("notes");
      setTimeout(() => theoryRef.current?.exportPDF(), 100);
    } else {
      theoryRef.current?.exportPDF();
    }
  };

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-pulse">
          <div className="relative mb-12">
            <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-microchip text-indigo-600 text-3xl animate-bounce"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
            Synthesizing Education...
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed font-medium">
            Cross-referencing knowledge bases and generating grounded theory,
            visual aids, and coding challenges.
          </p>
          <div className="mt-8 flex gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
          </div>
        </div>
      );
    }

    if (!state.materials || activeTab === "dashboard") {
      return (
        <div className="space-y-12">
          <div className="animate-fade-in-up">
            <MaterialGenerator
              onGenerate={handleGenerate}
              isGenerating={state.isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fas fa-book text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">
                Reading Notes
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Comprehensive structured notes with citations from course
                materials and knowledge bases.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i className="fas fa-presentation-screen text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">
                Interactive Slides
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Presentation slides with AI-generated visual diagrams and clear
                explanations.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fas fa-code text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">
                Code Labs
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Hands-on programming exercises with runnable code and detailed
                explanations.
              </p>
            </div>
          </div>

          {state.error && (
            <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-center font-bold shadow-sm animate-shake">
              <i className="fas fa-triangle-exclamation mr-3"></i>
              {state.error}
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case "notes":
        return (
          <TheoryViewer
            ref={theoryRef}
            topic={state.materials.topic}
            notes={state.materials.readingNotes}
            sources={state.materials.groundingSources}
          />
        );
      case "slides":
        return <SlidesViewer slides={state.materials.slides} />;
      case "lab":
        return <LabViewer lab={state.materials.lab} />;
      default:
        return null;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onExportPDF={handleSidebarExportPDF}
      hasMaterials={!!state.materials}
    >
      {meLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-600">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      ) : !me ? null : (
        renderContent()
      )}
    </Layout>
  );
}
