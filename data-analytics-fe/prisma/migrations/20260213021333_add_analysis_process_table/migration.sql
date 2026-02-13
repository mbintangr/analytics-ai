-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('AGENT', 'TOOL');

-- CreateEnum
CREATE TYPE "ProcessEvent" AS ENUM ('START', 'END');

-- CreateTable
CREATE TABLE "AnalysisProcess" (
    "id" TEXT NOT NULL,
    "analysisSessionId" TEXT NOT NULL,
    "type" "ProcessType" NOT NULL,
    "name" TEXT NOT NULL,
    "event" "ProcessEvent" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "AnalysisProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisProcess_analysisSessionId_idx" ON "AnalysisProcess"("analysisSessionId");

-- AddForeignKey
ALTER TABLE "AnalysisProcess" ADD CONSTRAINT "AnalysisProcess_analysisSessionId_fkey" FOREIGN KEY ("analysisSessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
