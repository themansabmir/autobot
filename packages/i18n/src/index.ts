/**
 * @typebot.io/i18n
 *
 * Enterprise-grade internationalization package for bot content translation.
 * Provides:
 * - Translation extraction from bot journeys
 * - Google Translate integration (official @google-cloud/translate)
 * - Database storage for translated journeys (PostgreSQL JSONB)
 * - Caching layer (Redis + memory fallback)
 *
 * Usage:
 * Import directly from submodules:
 * - `@typebot.io/i18n/storage/i18nDatabaseClient`
 * - `@typebot.io/i18n/translation/googleTranslateClient`
 * - `@typebot.io/i18n/extraction/extractTranslatableContent`
 * - `@typebot.io/i18n/cache/translationCache`
 * - `@typebot.io/i18n/services/translationGenerationService`
 */

export * from "./cache/translationCache";
export * from "./extraction/extractTranslatableContent";
export * from "./services/translationGenerationService";
export * from "./storage/i18nDatabaseClient";
export * from "./translation/googleTranslateClient";
