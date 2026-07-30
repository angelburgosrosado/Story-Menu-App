const fs = require('fs');

const inserts = [
  "starting_formats (id, slug, title, short_description, long_description, audience_tags, category_tags, recommended_for, sample_output_hint, age_range, visibility_state, show_in_onboarding, show_in_homeschool, show_in_teacher_flows, featured, sort_order, icon)",
  "creator_flows (id, slug, title, short_description, best_for, output_hint, related_formats, visibility_state, show_in_onboarding, featured, sort_order)",
  "story_goals (id, slug, title, short_description, category, tags, related_formats, related_creator_flows, importance, visibility_state, show_in_wizard, show_in_homeschool, show_in_teacher_flows, featured, sort_order)",
  "usage_modes (id, slug, label, shortDescription, generationBehaviorHint, safetyNotes, visibleInWizard, sortOrder, status)",
  "personas (id, slug, displayName, shortDescription, longDescription, personaType, roleDefaults, ageGroup, audience_tags, language_tags, stylePreference, visualSummary, generationSafeDescription, usageMode, referenceImageStatus, recurringCharacter, visibilityScope, consentStatus, moderationStatus, approvedForGeneration, sort_order, status)",
  "styles (id, slug, title, shortDescription, longDescription, visualMood, audienceTags, useCaseTags, styleFamily, recommendationTags, visibleInStudio, visibleInHomeschool, visibleInTeacherFlow, visibilityState, featured, sortOrder, internalTestingOnly, artworkReference)",
  "prompt_templates (id, slug, title, workflowType, formatMappings, creatorFlowMappings, styleModifiers, educationalMode, bilingualHandlingHint, personaConsistencyHint, status, visibleInAdmin, internalTestingOnly)",
  "languages (id, code, slug, displayName, nativeName, direction, status, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, supportsBilingual, supportsNarration, supportsTranslation, internalTestingOnly, educationalNotes, sortOrder, featured)",
  "glossary_entries (id, slug, sourceTerm, preferredTranslation, sourceLanguageCode, targetLanguageCode, termType, preserveTerm, scopeType, internalTestingOnly, status, sortOrder)",
  "translation_workflows (id, slug, title, workflowType, eligibleSourceLanguages, eligibleTargetLanguages, glossarySupport, protectedTermSupport, bilingualOutputSupport, narrationCompatibility, status, internalTestingOnly)",
  "voices (id, slug, displayName, providerId, modelId, languageCodes, primaryLanguageCode, accentLabel, toneLabel, ageDescriptor, narratorSuitability, childSafe, classroomSafe, supportsBilingualWorkflows, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, internalTestingOnly, status, featured, sortOrder)",
  "soundtrack_items (id, slug, title, category, mood, educationalSuitability, familySuitability, classroomSuitability, languageNeutral, status, internalTestingOnly, sortOrder)",
  "narration_workflows (id, slug, title, workflowType, eligibleLanguages, eligibleVoices, soundtrackSupport, bilingualCompatibility, exportCompatibility, status, internalTestingOnly)"
];

let sql = "\n-- Auto-generated missing generic tables\n";
for (const ins of inserts) {
  const match = ins.match(/^(\w+)\s*\((.*)\)$/);
  const table = match[1];
  const cols = match[2].split(',').map(c => c.trim().toLowerCase());
  
  sql += `DROP TABLE IF EXISTS ${table};\n`;
  sql += `CREATE TABLE ${table} (\n`;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    let type = 'TEXT';
    if (col === 'id') type = 'VARCHAR(255) PRIMARY KEY';
    else if (col.includes('tags') || col.includes('mappings') || col.includes('modifiers') || col.includes('languages') || col.includes('voices') || col.includes('related_') || col.includes('codes')) {
      type = 'JSONB';
    } else if (col.startsWith('is_') || col.startsWith('show_') || col.startsWith('visible') || col === 'featured' || col === 'internaltestingonly' || col === 'preserveterm' || col.startsWith('supports')) {
      type = 'BOOLEAN DEFAULT false';
    } else if (col === 'sort_order' || col === 'sortorder' || col === 'importance') {
      type = 'INT DEFAULT 0';
    }
    
    // No quotes, just lowercase
    sql += `    ${col} ${type}${i === cols.length - 1 ? '' : ','}\n`;
  }
  sql += `);\n\n`;
}

// Just output to a new file so we can run it against the DB directly
fs.writeFileSync('create_missing_tables.sql', sql);
console.log('Created create_missing_tables.sql');
