-- CreateTable
CREATE TABLE "LocalizationTranslation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typebotId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "translatedData" JSONB NOT NULL,

    CONSTRAINT "LocalizationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocalizationTranslation_typebotId_idx" ON "LocalizationTranslation"("typebotId");

-- CreateIndex
CREATE INDEX "LocalizationTranslation_language_idx" ON "LocalizationTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "LocalizationTranslation_typebotId_language_key" ON "LocalizationTranslation"("typebotId", "language");

-- AddForeignKey
ALTER TABLE "LocalizationTranslation" ADD CONSTRAINT "LocalizationTranslation_typebotId_fkey" FOREIGN KEY ("typebotId") REFERENCES "Typebot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
