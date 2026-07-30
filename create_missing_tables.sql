
-- Auto-generated missing generic tables
DROP TABLE IF EXISTS starting_formats;
CREATE TABLE starting_formats (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    short_description TEXT,
    long_description TEXT,
    audience_tags JSONB,
    category_tags JSONB,
    recommended_for TEXT,
    sample_output_hint TEXT,
    age_range TEXT,
    visibility_state TEXT,
    show_in_onboarding BOOLEAN DEFAULT false,
    show_in_homeschool BOOLEAN DEFAULT false,
    show_in_teacher_flows BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    icon TEXT
);

DROP TABLE IF EXISTS creator_flows;
CREATE TABLE creator_flows (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    short_description TEXT,
    best_for TEXT,
    output_hint TEXT,
    related_formats JSONB,
    visibility_state TEXT,
    show_in_onboarding BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0
);

DROP TABLE IF EXISTS story_goals;
CREATE TABLE story_goals (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    short_description TEXT,
    category TEXT,
    tags JSONB,
    related_formats JSONB,
    related_creator_flows JSONB,
    importance INT DEFAULT 0,
    visibility_state TEXT,
    show_in_wizard BOOLEAN DEFAULT false,
    show_in_homeschool BOOLEAN DEFAULT false,
    show_in_teacher_flows BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0
);

DROP TABLE IF EXISTS usage_modes;
CREATE TABLE usage_modes (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    label TEXT,
    shortdescription TEXT,
    generationbehaviorhint TEXT,
    safetynotes TEXT,
    visibleinwizard BOOLEAN DEFAULT false,
    sortorder INT DEFAULT 0,
    status TEXT
);

DROP TABLE IF EXISTS personas;
CREATE TABLE personas (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    displayname TEXT,
    shortdescription TEXT,
    longdescription TEXT,
    personatype TEXT,
    roledefaults TEXT,
    agegroup TEXT,
    audience_tags JSONB,
    language_tags JSONB,
    stylepreference TEXT,
    visualsummary TEXT,
    generationsafedescription TEXT,
    usagemode TEXT,
    referenceimagestatus TEXT,
    recurringcharacter TEXT,
    visibilityscope TEXT,
    consentstatus TEXT,
    moderationstatus TEXT,
    approvedforgeneration TEXT,
    sort_order INT DEFAULT 0,
    status TEXT
);

DROP TABLE IF EXISTS styles;
CREATE TABLE styles (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    shortdescription TEXT,
    longdescription TEXT,
    visualmood TEXT,
    audiencetags JSONB,
    usecasetags JSONB,
    stylefamily TEXT,
    recommendationtags JSONB,
    visibleinstudio BOOLEAN DEFAULT false,
    visibleinhomeschool BOOLEAN DEFAULT false,
    visibleinteacherflow BOOLEAN DEFAULT false,
    visibilitystate TEXT,
    featured BOOLEAN DEFAULT false,
    sortorder INT DEFAULT 0,
    internaltestingonly BOOLEAN DEFAULT false,
    artworkreference TEXT
);

DROP TABLE IF EXISTS prompt_templates;
CREATE TABLE prompt_templates (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    workflowtype TEXT,
    formatmappings JSONB,
    creatorflowmappings JSONB,
    stylemodifiers JSONB,
    educationalmode TEXT,
    bilingualhandlinghint TEXT,
    personaconsistencyhint TEXT,
    status TEXT,
    visibleinadmin BOOLEAN DEFAULT false,
    internaltestingonly BOOLEAN DEFAULT false
);

DROP TABLE IF EXISTS languages;
CREATE TABLE languages (
    id VARCHAR(255) PRIMARY KEY,
    code TEXT,
    slug TEXT,
    displayname TEXT,
    nativename TEXT,
    direction TEXT,
    status TEXT,
    visibleinstudio BOOLEAN DEFAULT false,
    visibleinkidstory BOOLEAN DEFAULT false,
    visibleincomicstudio BOOLEAN DEFAULT false,
    visibleinteacherflow BOOLEAN DEFAULT false,
    visibleinhomeschool BOOLEAN DEFAULT false,
    supportsbilingual BOOLEAN DEFAULT false,
    supportsnarration BOOLEAN DEFAULT false,
    supportstranslation BOOLEAN DEFAULT false,
    internaltestingonly BOOLEAN DEFAULT false,
    educationalnotes TEXT,
    sortorder INT DEFAULT 0,
    featured BOOLEAN DEFAULT false
);

DROP TABLE IF EXISTS glossary_entries;
CREATE TABLE glossary_entries (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    sourceterm TEXT,
    preferredtranslation TEXT,
    sourcelanguagecode TEXT,
    targetlanguagecode TEXT,
    termtype TEXT,
    preserveterm BOOLEAN DEFAULT false,
    scopetype TEXT,
    internaltestingonly BOOLEAN DEFAULT false,
    status TEXT,
    sortorder INT DEFAULT 0
);

DROP TABLE IF EXISTS translation_workflows;
CREATE TABLE translation_workflows (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    workflowtype TEXT,
    eligiblesourcelanguages JSONB,
    eligibletargetlanguages JSONB,
    glossarysupport TEXT,
    protectedtermsupport TEXT,
    bilingualoutputsupport TEXT,
    narrationcompatibility TEXT,
    status TEXT,
    internaltestingonly BOOLEAN DEFAULT false
);

DROP TABLE IF EXISTS voices;
CREATE TABLE voices (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    displayname TEXT,
    providerid TEXT,
    modelid TEXT,
    languagecodes JSONB,
    primarylanguagecode TEXT,
    accentlabel TEXT,
    tonelabel TEXT,
    agedescriptor TEXT,
    narratorsuitability TEXT,
    childsafe TEXT,
    classroomsafe TEXT,
    supportsbilingualworkflows BOOLEAN DEFAULT false,
    visibleinstudio BOOLEAN DEFAULT false,
    visibleinkidstory BOOLEAN DEFAULT false,
    visibleincomicstudio BOOLEAN DEFAULT false,
    visibleinteacherflow BOOLEAN DEFAULT false,
    visibleinhomeschool BOOLEAN DEFAULT false,
    internaltestingonly BOOLEAN DEFAULT false,
    status TEXT,
    featured BOOLEAN DEFAULT false,
    sortorder INT DEFAULT 0
);

DROP TABLE IF EXISTS soundtrack_items;
CREATE TABLE soundtrack_items (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    category TEXT,
    mood TEXT,
    educationalsuitability TEXT,
    familysuitability TEXT,
    classroomsuitability TEXT,
    languageneutral TEXT,
    status TEXT,
    internaltestingonly BOOLEAN DEFAULT false,
    sortorder INT DEFAULT 0
);

DROP TABLE IF EXISTS narration_workflows;
CREATE TABLE narration_workflows (
    id VARCHAR(255) PRIMARY KEY,
    slug TEXT,
    title TEXT,
    workflowtype TEXT,
    eligiblelanguages JSONB,
    eligiblevoices JSONB,
    soundtracksupport TEXT,
    bilingualcompatibility TEXT,
    exportcompatibility TEXT,
    status TEXT,
    internaltestingonly BOOLEAN DEFAULT false
);

