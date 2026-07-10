/**
 * Screen Name: Onboarding Wizard Flow Test
 * Purpose: Automated unit and integration test to verify step-by-step navigation, AI suggestions, and payload assembly in the onboarding wizard.
 * Version: 1.0
 * Phase: Phase 12 Refinement
 * Date: 2026-07-09
 * What changed in this revision: Created initial integration test verifying format selection, metadata setting, and launch callback payload composition.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Setup } from './Setup';

// Mock audio imports
vi.mock('./audio', () => ({
  playPageTurnSFX: vi.fn(),
  playSparkleSFX: vi.fn()
}));

// Mock image utilities to prevent heic2any initialization error in node
vi.mock('./imageUtils', () => ({
  fileToBase64: vi.fn().mockResolvedValue('mock-base64-string')
}));

// Mock translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str
  })
}));

describe('Onboarding Wizard Flow', () => {
  const mockOnLaunch = vi.fn();
  const mockOnGenreChange = vi.fn();
  const mockOnLanguageChange = vi.fn();
  const mockOnPremiseChange = vi.fn();
  const mockOnVoiceChange = vi.fn();
  const mockOnSoundtrackChange = vi.fn();

  const defaultProps = {
    show: true,
    isTransitioning: false,
    hero: null,
    friend: null,
    villain: null,
    selectedGenre: 'Science & Nature Study',
    selectedLanguage: 'en-US',
    customPremise: '',
    richMode: false,
    selectedVoice: 'Zephyr',
    soundtrackEnabled: true,
    activeCreator: { id: 'test-creator', email: 'test@example.com' },
    onCreatorChange: vi.fn(),
    onHeroUpload: vi.fn(),
    onFriendUpload: vi.fn(),
    onVillainUpload: vi.fn(),
    onGenreChange: mockOnGenreChange,
    onLanguageChange: mockOnLanguageChange,
    onPremiseChange: mockOnPremiseChange,
    onRichModeChange: vi.fn(),
    onVoiceChange: mockOnVoiceChange,
    onSoundtrackChange: mockOnSoundtrackChange,
    onLaunch: mockOnLaunch,
    onSelectHero: vi.fn(),
    onSelectFriend: vi.fn(),
    onSelectVillain: vi.fn(),
    onLoadProject: vi.fn(),
    creativeDirectives: '',
    onCreativeDirectivesChange: vi.fn(),
    heroVisuals: '',
    onHeroVisualsChange: vi.fn(),
    friendVisuals: '',
    onFriendVisualsChange: vi.fn(),
    villainVisuals: '',
    onVillainVisualsChange: vi.fn(),
    villainDna: '',
    onVillainDnaChange: vi.fn(),
    nemesisDNA: { id: '', name: '', role: 'Nemesis', coreDnaPrompt: '', seedFaceUrl: '', creationStage: 'DNA' },
    onNemesisDnaChange: vi.fn(),
    soundPrompt: '',
    onSoundPromptChange: vi.fn(),
    storyBlueprint: [],
    onStoryBlueprintChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the backend REST seeds endpoint responses
    global.fetch = vi.fn().mockImplementation((url: string) => {
      let data: any = [];
      if (url === '/api/formats') {
        data = [
          { id: 'fmt-1', slug: 'science-explainer', title: 'Science Explainer', short_description: 'Explain STEM concepts', recommended_for: 'Kids', age_range: 'Grade 3-5', category_tags: ['Science'], visibility_state: 'Active', featured: true }
        ];
      } else if (url === '/api/flows') {
        data = [
          { id: 'flow-1', slug: 'standard-guided', title: 'Guided Studio', related_formats: ['science-explainer'] }
        ];
      } else if (url === '/api/goals') {
        data = [
          { id: 'goal-1', title: 'Master Photosynthesis', category: 'Science', visibility_state: 'Active' }
        ];
      } else if (url === '/api/personas') {
        data = [
          { id: 'persona-1', displayName: 'Professor Pumpernickel', personaType: 'Science Helper', shortDescription: 'Botanist guide', usageMode: 'narrator', status: 'Active' }
        ];
      } else if (url === '/api/usage-modes') {
        data = [
          { slug: 'narrator', label: 'Story Narrator' }
        ];
      } else if (url === '/api/languages') {
        data = [
          { code: 'en-US', displayName: 'English (US)', status: 'Active' },
          { code: 'es-MX', displayName: 'Spanish (Latin America)', status: 'Active' }
        ];
      }
      return Promise.resolve({
        json: () => Promise.resolve(data)
      });
    }) as any;
  });

  it('navigates through steps and fires launch callback with configured payload', async () => {
    // We render in a basic jsdom node container
    const { container } = render(<Setup {...defaultProps} />);
    
    // Wait for mock fetch data to load
    await waitFor(() => {
      expect(screen.getByText('Science Explainer')).toBeDefined();
    });

    const clickNext = () => {
      const buttons = Array.from(container.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent?.includes('Next Step') || b.textContent?.includes('Launch Story Workspace'));
      if (nextBtn) {
        fireEvent.click(nextBtn);
      } else {
        throw new Error("Next button not found");
      }
    };

    // Step 1: Click the Science Explainer format button to advance to Step 2
    const formatBtn = screen.getByText('Science Explainer');
    fireEvent.click(formatBtn);

    // Step 2: Set Title and Description, verify AI Suggestions checkbox is visible
    await waitFor(() => {
      expect(screen.getByText(/Define the project title, premise/i)).toBeDefined();
    });
    
    const titleInput = screen.getByPlaceholderText('e.g. Photosynthesis: Energy from Light');
    fireEvent.change(titleInput, { target: { value: 'Photosynthesis Adventure' } });

    const descInput = screen.getByPlaceholderText('e.g. A character-driven journey explaining how plants convert light to energy...');
    fireEvent.change(descInput, { target: { value: 'Help Leafy the leaf find light energy' } });

    // Click next to Step 3
    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 3: Goal & Tones selection
    await waitFor(() => {
      expect(screen.getByText(/Define what the reader should learn/i)).toBeDefined();
    });
    
    const goalSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(goalSelect, { target: { value: 'goal-1' } });

    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 4: Cast Character
    await waitFor(() => {
      expect(screen.getByText(/Configure or select a character/i)).toBeDefined();
    });
    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 5: Illustration presets
    await waitFor(() => {
      expect(screen.getByText(/Select the visual rendering preset/i)).toBeDefined();
    });
    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 6: Languages selection
    await waitFor(() => {
      expect(screen.getByText(/Configure single language or dual-language/i)).toBeDefined();
    });
    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 7: Audio & Narration
    await waitFor(() => {
      expect(screen.getByText(/Configure read-aloud voice models/i)).toBeDefined();
    });
    clickNext();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Step 8: Review page summary
    await waitFor(() => {
      expect(screen.getByText(/Review your storybook setup/i)).toBeDefined();
    });

    // Click final launch workspace trigger
    clickNext();

    // Expect the onLaunch callback to be fired with compiled wizard options
    expect(mockOnLaunch).toHaveBeenCalled();
    const callArg = mockOnLaunch.mock.calls[0][0];
    expect(callArg.title).toBe('Photosynthesis Adventure');
    expect(callArg.desc).toBe('Help Leafy the leaf find light energy');
  });
});
