-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  education TEXT,
  gender TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'professional', 'expert', 'admin')),
  branch TEXT,
  stream TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('approved', 'rejected', 'pending')),
  is_active BOOLEAN DEFAULT TRUE,
  linkedin_url TEXT,
  resume_url TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  question_level TEXT NOT NULL,
  question_domain TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('spoken', 'coding')),
  audio_path TEXT
);

-- INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT,
  level TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Overall Analysis Metrics
  fluency DOUBLE PRECISION,
  confidence DOUBLE PRECISION,
  lexical DOUBLE PRECISION,
  grammar_language DOUBLE PRECISION,
  subject_knowledge DOUBLE PRECISION
);

-- INTERVIEW_QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  question_number INTEGER,
  question_text TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('spoken', 'coding')),
  video_path TEXT,
  code_answer TEXT,

  -- Fluency metrics
  speech_rate_wpm DOUBLE PRECISION,
  pause_ratio DOUBLE PRECISION,
  tempo_variation DOUBLE PRECISION,

  -- Confidence metrics
  avg_pitch DOUBLE PRECISION,
  pitch_variation DOUBLE PRECISION,
  prosody_slope DOUBLE PRECISION,
  jitter DOUBLE PRECISION,
  shimmer DOUBLE PRECISION,

  -- Clarity metrics
  loudness DOUBLE PRECISION,
  energy_variability DOUBLE PRECISION,
  formant_f1 DOUBLE PRECISION,
  formant_f2 DOUBLE PRECISION,

  -- Lexical features
  type_token_ratio DOUBLE PRECISION,
  advanced_vocab_words JSONB,
  advanced_vocab_usage DOUBLE PRECISION,
  redundant_words JSONB,
  keyword_matches JSONB,
  keyword_density DOUBLE PRECISION,
  pronoun_usage_count INTEGER,
  pronoun_density DOUBLE PRECISION,
  function_word_density DOUBLE PRECISION,
  lexical_sophistication_index DOUBLE PRECISION,

  -- Grammar and Language
  grammar_issues INTEGER,
  readability_score DOUBLE PRECISION,
  syllables_per_word DOUBLE PRECISION,
  tense_consistency DOUBLE PRECISION,

  -- Answer Evaluation
  improvised_answer TEXT,
  answer_accuracy DOUBLE PRECISION,
  answer_completeness DOUBLE PRECISION,
  depth_of_knowledge DOUBLE PRECISION
);
