/*
  Screen Name: Workspace Outline
  Purpose: Story structure and scene beats organiser. Helps users arrange chapters and scenes
           before generating visual content. Each beat maps directly to one generated page.
  Version: v1.1
  Phase: Phase 2
  Date: 2026-07-08
  What changed in this revision: Audit pass. Renamed "Add Chapter Beat" / "Add First Scene Beat"
           to friendlier "Add a scene" language. Renamed "Scene objective" label to "Scene
           description". Removed robotic empty-state copy. Renamed proceed CTA from "Continue
           to Generate Scenes" to "Build These Scenes". Added beat count into the proceed button.
           Improved Creative Notes label. Fixed the inline label "Chapter Title" to "Scene title".
*/

import React, { useState } from 'react';
import {
  List, Plus, Target, StickyNote, GripVertical,
  ChevronDown, ChevronRight, Trash2,
  Zap, CheckCircle2, Circle, BookOpen
} from 'lucide-react';
import { ChapterGoal } from './types';

interface WorkspaceOutlineProps {
  storyBlueprint: ChapterGoal[];
  storyGoal: string;
  generalNotes: string;
  onStoryBlueprintChange: (val: ChapterGoal[]) => void;
  onStoryGoalChange: (val: string) => void;
  onGeneralNotesChange: (val: string) => void;
  onSelectBeat: (beat: ChapterGoal | null) => void;
  selectedBeatNum: number | null;
  onNavigateTo: (section: string) => void;
}

// Scene beat accent colours — cycling through a curated palette
const BEAT_ACCENT: string[] = [
  'text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-violet-400',
  'text-pink-400',    'text-orange-400', 'text-teal-400', 'text-rose-400',
  'text-indigo-400',  'text-lime-400',
];

function getBeatAccent(index: number): string {
  return BEAT_ACCENT[index % BEAT_ACCENT.length];
}

export const WorkspaceOutline: React.FC<WorkspaceOutlineProps> = ({
  storyBlueprint,
  storyGoal,
  generalNotes,
  onStoryBlueprintChange,
  onStoryGoalChange,
  onGeneralNotesChange,
  onSelectBeat,
  selectedBeatNum,
  onNavigateTo,
}) => {
  const [expandedBeats, setExpandedBeats] = useState<Set<number>>(new Set([1]));

  const toggleExpand = (num: number) => {
    setExpandedBeats(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...storyBlueprint];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onStoryBlueprintChange(updated);
  };

  const moveDown = (index: number) => {
    if (index >= storyBlueprint.length - 1) return;
    const updated = [...storyBlueprint];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onStoryBlueprintChange(updated);
  };

  const removeBeat = (index: number) => {
    const updated = storyBlueprint.filter((_, i) => i !== index);
    onStoryBlueprintChange(updated);
    onSelectBeat(null);
  };

  const updateTitle = (index: number, val: string) => {
    const updated = [...storyBlueprint];
    updated[index] = { ...updated[index], title: val };
    onStoryBlueprintChange(updated);
  };

  const updateGoal = (index: number, val: string) => {
    const updated = [...storyBlueprint];
    updated[index] = { ...updated[index], goal: val };
    onStoryBlueprintChange(updated);
  };

  const addBeat = () => {
    const num = storyBlueprint.length + 1;
    const newBeat: ChapterGoal = {
      chapterNum: num,
      title: `Scene ${num}`,
      goal: '',
    };
    onStoryBlueprintChange([...storyBlueprint, newBeat]);
    setExpandedBeats(prev => new Set([...prev, num]));
    onSelectBeat(newBeat);
  };

  const addSection = () => {
    const num = storyBlueprint.length + 1;
    const newBeat: ChapterGoal = {
      chapterNum: num,
      title: `Section ${num}`,
      goal: '',
    };
    onStoryBlueprintChange([...storyBlueprint, newBeat]);
  };

  const isEmpty = storyBlueprint.length === 0;

  return (
    <div className="space-y-8 text-left animate-fadeIn">

      {/* PAGE HEADER */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-violet-400 text-xs font-bold font-mono uppercase tracking-wider">
          <List size={13} />
          <span>Story Outline</span>
        </div>
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
          Plan your story
        </h2>
        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
          Add and arrange your scenes in order. Each scene becomes one illustrated page when you build your story.
        </p>
      </div>

      {/* STORY GOAL */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-wider">
          <Target size={12} />
          <span>Story Goal</span>
        </div>
        <input
          id="outline-story-goal"
          type="text"
          value={storyGoal}
          onChange={(e) => onStoryGoalChange(e.target.value)}
          placeholder="e.g. Teach children about the water cycle through an adventure story"
          className="w-full rounded-xl bg-slate-950 border border-slate-800 text-sm p-3 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
        />
        <p className="text-[10px] text-slate-700">
          A clear goal improves the quality of every generated scene.
        </p>
      </div>

      {/* BEATS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600">
            Scenes{storyBlueprint.length > 0 ? ` (${storyBlueprint.length})` : ''}
          </h3>
          {storyBlueprint.length > 0 && (
            <span className="text-[10px] text-slate-700">Click a scene to select and edit it</span>
          )}
        </div>

        {isEmpty ? (
          /* EMPTY STATE */
          <div className="py-16 px-8 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl">
              <BookOpen size={28} className="text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-300">Your outline is empty</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Add your first scene to start planning your story. Each scene becomes one page in your finished book.
              </p>
            </div>
            <button
              id="outline-add-first-beat"
              onClick={addBeat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus size={14} /> Add your first scene
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {storyBlueprint.map((beat, index) => {
              const isSelected = selectedBeatNum === beat.chapterNum;
              const isExpanded = expandedBeats.has(beat.chapterNum);
              const accentClass = getBeatAccent(index);
              const hasGoal = beat.goal && beat.goal.trim().length > 5;

              return (
                <div
                  key={`beat-${beat.chapterNum}-${index}`}
                  id={`outline-beat-${beat.chapterNum}`}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-indigo-500/40 bg-indigo-600/5'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  {/* BEAT HEADER */}
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                    onClick={() => {
                      toggleExpand(beat.chapterNum);
                      onSelectBeat(isSelected ? null : beat);
                    }}
                  >
                    <GripVertical size={13} className="text-slate-700 shrink-0" />

                    <div className={`w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-extrabold shrink-0 ${accentClass}`}>
                      {beat.chapterNum}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-200 truncate">
                        {beat.title || `Scene ${beat.chapterNum}`}
                      </p>
                      {!isExpanded && beat.goal && (
                        <p className="text-[10px] text-slate-600 truncate mt-0.5">{beat.goal}</p>
                      )}
                    </div>

                    {hasGoal
                      ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      : <Circle size={13} className="text-slate-800 shrink-0" />
                    }

                    {isExpanded
                      ? <ChevronDown size={13} className="text-slate-600 shrink-0" />
                      : <ChevronRight size={13} className="text-slate-700 shrink-0" />
                    }
                  </div>

                  {/* EXPANDED EDIT */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60">
                      <div className="pt-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Scene title</label>
                        <input
                          type="text"
                          value={beat.title}
                          onChange={(e) => updateTitle(index, e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 text-sm p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                          Scene description
                        </label>
                        <textarea
                          value={beat.goal}
                          onChange={(e) => updateGoal(index, e.target.value)}
                          rows={3}
                          placeholder="What happens in this scene? What should the reader learn or feel?"
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 text-xs p-2.5 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            title="Move up"
                            className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-white disabled:opacity-25 transition-all cursor-pointer text-xs"
                          >▲</button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === storyBlueprint.length - 1}
                            title="Move down"
                            className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-white disabled:opacity-25 transition-all cursor-pointer text-xs"
                          >▼</button>
                        </div>
                        <button
                          onClick={() => removeBeat(index)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 hover:bg-red-500/15 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ADD ACTIONS */}
        <div className="flex gap-2 mt-4">
          <button
            id="outline-add-scene"
            onClick={addBeat}
            className="flex-1 py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/30 bg-transparent hover:bg-indigo-600/5 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-200 transition-all cursor-pointer"
          >
            <Plus size={13} /> Add a scene
          </button>
          <button
            id="outline-add-section"
            onClick={addSection}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition-all"
          >
            Add a section break
          </button>
        </div>

        {/* PROCEED CTA */}
        {storyBlueprint.length > 0 && (
          <div className="pt-2">
            <button
              id="outline-proceed-generate"
              onClick={() => onNavigateTo('pages')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-extrabold text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Zap size={15} />
              Build these {storyBlueprint.length} scene{storyBlueprint.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {/* NOTES */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase font-mono tracking-wider">
          <StickyNote size={12} />
          <span>Story Notes</span>
        </div>
        <textarea
          id="outline-notes"
          value={generalNotes}
          onChange={(e) => onGeneralNotesChange(e.target.value)}
          rows={3}
          placeholder="Themes, plot ideas, or anything you want to remember while building…"
          className="w-full rounded-xl bg-slate-950 border border-slate-800 text-xs p-3 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-600 resize-none leading-relaxed"
        />
        <p className="text-[10px] text-slate-700">
          Personal notes — not used by the generator.
        </p>
      </div>

    </div>
  );
};
