-- Migration: Enable multi-language support for blogs
-- Remove the unique constraint on slug
ALTER TABLE snapai_insights DROP CONSTRAINT IF EXISTS snapai_insights_slug_key;

-- Add a composite unique constraint on (slug, lang)
ALTER TABLE snapai_insights ADD CONSTRAINT snapai_insights_slug_lang_key UNIQUE (slug, lang);

-- Comment
COMMENT ON TABLE snapai_insights IS 'SnapAI generated insights. Uniqueness is now enforced by (slug, lang) pair.';
