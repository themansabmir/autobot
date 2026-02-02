/**
 * @typebot.io/i18n
 *
 * Enterprise-grade internationalization package for bot content translation.
 * Provides:
 * - Translation extraction from bot journeys
 * - Google Translate integration (free, using google-translate-api-x)
 * - MinIO storage for translated journeys
 * - Caching layer (Redis + memory fallback)
 *
 * Usage:
 * Import directly from submodules:
 * - `@typebot.io/i18n/storage/i18nMinioClient`
 * - `@typebot.io/i18n/translation/googleTranslateClient`
 * - `@typebot.io/i18n/extraction/extractTranslatableContent`
 * - `@typebot.io/i18n/cache/translationCache`
 * - `@typebot.io/i18n/services/translationGenerationService`
 */

export * from "./storage/i18nMinioClient";
export * from "./translation/googleTranslateClient";
export * from "./extraction/extractTranslatableContent";
export * from "./cache/translationCache";
export * from "./services/translationGenerationService";
