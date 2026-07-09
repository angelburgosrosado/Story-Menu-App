/**
 * Screen Name: Progress Intelligence Dashboard
 * Purpose: Track reading progress, creation momentum, and assignments in a warm, motivating way
 * Version: 1.1
 * Phase: Phase 17
 * Date: 2026-07-08
 * What changed in this revision: Enhanced premium styling, added empty states, refined copy and visualization.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Activity, BookOpen, PenTool, TrendingUp, CheckCircle, 
    Award, Target, Users, Book, Clock, Heart, Sparkles, Star, 
    ArrowRight, Lightbulb, PlayCircle, PlusCircle
} from 'lucide-react';

interface ProgressDashboardProps {
    onClose?: () => void;
    currentUser: {
        id: string;
        email: string;
        displayName?: string;
        role?: 'Creator' | 'Teacher' | 'Parent' | 'Student' | 'Admin';
    } | null;
}

type ViewMode = 'learner' | 'homeschool' | 'creator';

// Helper component for a warm circular progress ring
const ProgressRing = ({ progress, size = 60, strokeWidth = 6, colorClass = "text-indigo-500", trackClass = "text-indigo-100" }: { progress: number, size?: number, strokeWidth?: number, colorClass?: string, trackClass?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                className={trackClass}
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                className={`${colorClass} transition-all duration-1000 ease-out`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
        </svg>
    );
};

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onClose, currentUser }) => {
    const { t } = useTranslation();
    
    // Default view based on role
    const initialView: ViewMode = (currentUser?.role === 'Student') ? 'learner' : 
                                 (currentUser?.role === 'Teacher' || currentUser?.role === 'Parent') ? 'homeschool' : 
                                 'creator';
    
    const [viewMode, setViewMode] = useState<ViewMode>(initialView);

    // Mock data simulation (in a real app, this would be fetched)
    const hasData = true; // Set to false to see the motivating empty states

    const learnerData = {
        readingGoal: { current: 3, target: 5 },
        readingStreak: 4,
        storiesCompleted: 12,
        bilingualRead: 5,
        creationGoal: { current: 1, target: 2 },
    };

    const educatorData = {
        assignmentsCompleted: 18,
        totalAssigned: 24,
        activeLearners: 3,
        averageReadingTime: '25m',
        classStreak: 12
    };

    const creatorData = {
        storiesPublished: 8,
        totalSaves: 145,
        averageRating: 4.8,
        creationStreak: 5,
        draftsInProgress: 3
    };

    const renderLearnerView = () => {
        if (!hasData) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-indigo-50 p-6 rounded-full mb-6">
                        <BookOpen className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Your reading journey begins here</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                        Every great story starts with a single page. Dive into a new world and start building your reading streak today.
                    </p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center">
                        <PlayCircle className="w-5 h-5 mr-2" /> Start today's reading
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
                        <Sparkles className="w-48 h-48 text-indigo-900" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Weekly Goal</span>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Strong reading week!</h3>
                            <p className="text-indigo-900/70 font-medium text-lg">Just 2 more stories to hit your weekly goal.</p>
                        </div>
                        <div className="flex items-center space-x-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white">
                            <ProgressRing progress={(learnerData.readingGoal.current / learnerData.readingGoal.target) * 100} size={80} strokeWidth={8} />
                            <div>
                                <p className="text-3xl font-black text-indigo-900">{learnerData.readingGoal.current}<span className="text-lg text-indigo-400">/{learnerData.readingGoal.target}</span></p>
                                <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Stories read</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-50 group-hover:bg-orange-100 transition-colors p-3 rounded-xl">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-gray-900 mb-1">{learnerData.readingStreak} <span className="text-xl text-gray-400 font-medium">days</span></p>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">Reading streak</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-50 group-hover:bg-emerald-100 transition-colors p-3 rounded-xl">
                                <BookOpen className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-gray-900 mb-1">{learnerData.storiesCompleted}</p>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">Stories completed</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-cyan-50 group-hover:bg-cyan-100 transition-colors p-3 rounded-xl">
                                <Activity className="w-6 h-6 text-cyan-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-gray-900 mb-1">{learnerData.bilingualRead}</p>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">Bilingual reading sessions</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-50 group-hover:bg-purple-100 transition-colors p-3 rounded-xl">
                                <PenTool className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-gray-900 mb-1">{learnerData.creationGoal.current}<span className="text-xl text-gray-400 font-medium">/{learnerData.creationGoal.target}</span></p>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">Creative drafts</p>
                    </div>
                </div>

                {/* Call to Action Banner */}
                <div className="bg-gray-900 rounded-2xl p-1 shadow-lg">
                    <div className="bg-gray-900 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="bg-gray-800 p-3 rounded-full">
                                <Lightbulb className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Ready for your next adventure?</h4>
                                <p className="text-gray-400 text-sm">Continue your story "The Magic Forest"</p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-stone-100 transition flex items-center justify-center">
                            Resume reading <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHomeschoolView = () => {
        if (!hasData) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-emerald-50 p-6 rounded-full mb-6">
                        <Users className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Set up your learning environment</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                        Invite learners and create your first reading assignment to start tracking their progress and habits.
                    </p>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" /> Assign a visual lesson
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <Award className="w-5 h-5 text-emerald-600" />
                                <span className="text-emerald-800 font-bold uppercase tracking-widest text-xs">Family Overview</span>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Great week for reading!</h3>
                            <p className="text-emerald-900/70 font-medium text-lg">Your learners are highly engaged. 75% of assignments are completed.</p>
                        </div>
                        <div className="flex items-center space-x-6 bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white">
                            <div className="text-right">
                                <p className="text-3xl font-black text-emerald-900">75%</p>
                                <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide">Completion Rate</p>
                            </div>
                            <ProgressRing progress={75} size={70} strokeWidth={6} colorClass="text-emerald-500" trackClass="text-emerald-100" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <div className="bg-stone-50 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
                            <Users className="w-5 h-5 text-stone-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mb-1">{educatorData.activeLearners}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Active Learners</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <div className="bg-stone-50 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5 text-stone-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mb-1">{educatorData.averageReadingTime}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Daily Avg. Time</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <div className="bg-orange-50 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mb-1">{educatorData.classStreak}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Family Streak</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <div className="bg-blue-50 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
                            <Target className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mb-1">80%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Goal met</p>
                    </div>
                </div>

                <div className="bg-emerald-900 rounded-2xl p-1 shadow-lg">
                    <div className="bg-emerald-900 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="bg-emerald-800 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Keep the momentum going</h4>
                                <p className="text-emerald-200 text-sm">Assign a new visual lesson for next week</p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto bg-white text-emerald-900 px-6 py-3 rounded-full font-bold hover:bg-stone-100 transition">
                            Create Assignment
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCreatorView = () => {
        if (!hasData) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-amber-50 p-6 rounded-full mb-6">
                        <PenTool className="w-12 h-12 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Share your first story</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                        Once you publish a story, you'll see engagement metrics, reader saves, and ratings right here.
                    </p>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" /> Publish your first project
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gray-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 opacity-20 pointer-events-none">
                        <TrendingUp className="w-64 h-64 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0">
                            <div className="flex items-center space-x-2 mb-3">
                                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/30">Creator Momentum</span>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Your audience is growing</h3>
                            <p className="text-gray-400 font-medium text-lg max-w-lg">Your recent story "Echoes of Time" received 15 new saves this week!</p>
                        </div>
                        <div className="flex flex-col space-y-3 bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl border border-gray-700 min-w-[200px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-gray-300 font-medium">
                                    <Heart className="w-4 h-4 mr-2 text-rose-400" /> Total Saves
                                </div>
                                <span className="text-white font-bold text-lg">{creatorData.totalSaves}</span>
                            </div>
                            <div className="h-px w-full bg-gray-700"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-gray-300 font-medium">
                                    <Star className="w-4 h-4 mr-2 text-amber-400" /> Avg Rating
                                </div>
                                <span className="text-white font-bold text-lg">{creatorData.averageRating}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5">
                        <div className="bg-indigo-50 p-4 rounded-2xl">
                            <BookOpen className="w-7 h-7 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900 mb-1">{creatorData.storiesPublished}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Published</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5">
                        <div className="bg-teal-50 p-4 rounded-2xl">
                            <PenTool className="w-7 h-7 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900 mb-1">{creatorData.draftsInProgress}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Drafts</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5">
                        <div className="bg-orange-50 p-4 rounded-2xl">
                            <Flame className="w-7 h-7 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-gray-900 mb-1">{creatorData.creationStreak}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Weekly Streak</p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-100 rounded-2xl p-1 shadow-sm">
                    <div className="bg-amber-50 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between border border-amber-200/50">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="bg-amber-200 p-3 rounded-full">
                                <Sparkles className="w-6 h-6 text-amber-700" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">You have a draft nearly finished</h4>
                                <p className="text-gray-600 text-sm">"The Silent Planet" is 90% complete.</p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition">
                            Review & Publish
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">Progress & Insights</h1>
                    <p className="text-gray-500 mt-2 text-lg">Track your reading, creating, and sharing journey.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="mt-4 sm:mt-0 px-6 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full font-bold transition shadow-sm">
                        Close Dashboard
                    </button>
                )}
            </div>

            {/* View Mode Tabs */}
            <div className="flex flex-wrap gap-2 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-fit mb-10 shadow-inner">
                <button 
                    onClick={() => setViewMode('learner')}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'learner' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-stone-200/50'}`}
                >
                    <BookOpen className="w-4 h-4 mr-2" /> Learner
                </button>
                <button 
                    onClick={() => setViewMode('homeschool')}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'homeschool' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-stone-200/50'}`}
                >
                    <Users className="w-4 h-4 mr-2" /> Family & Classroom
                </button>
                <button 
                    onClick={() => setViewMode('creator')}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'creator' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-stone-200/50'}`}
                >
                    <PenTool className="w-4 h-4 mr-2" /> Creator
                </button>
            </div>

            {/* Content area */}
            <div className="mt-4 min-h-[400px]">
                {viewMode === 'learner' && renderLearnerView()}
                {viewMode === 'homeschool' && renderHomeschoolView()}
                {viewMode === 'creator' && renderCreatorView()}
            </div>
        </div>
    );
};

// Fallback icon just in case
const Flame = ({className}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
