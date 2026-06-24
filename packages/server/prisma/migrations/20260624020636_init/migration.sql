-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "defaultPublic" BOOLEAN NOT NULL DEFAULT true,
    "racketHand" TEXT NOT NULL DEFAULT 'right',
    "mainEvent" TEXT NOT NULL DEFAULT 'single',
    "role" TEXT NOT NULL DEFAULT 'user',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "feeling" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "duration" INTEGER,
    "distance" REAL,
    "weight" REAL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "location" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "creatorId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "partnerId" TEXT,
    "opponentIds" TEXT NOT NULL DEFAULT '[]',
    "scores" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Exercise_creatorId_deletedAt_idx" ON "Exercise"("creatorId", "deletedAt");

-- CreateIndex
CREATE INDEX "Workout_userId_deletedAt_idx" ON "Workout"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Workout_isPublic_deletedAt_idx" ON "Workout"("isPublic", "deletedAt");

-- CreateIndex
CREATE INDEX "Set_workoutId_idx" ON "Set"("workoutId");

-- CreateIndex
CREATE INDEX "Set_exerciseId_idx" ON "Set"("exerciseId");

-- CreateIndex
CREATE INDEX "Event_creatorId_deletedAt_idx" ON "Event"("creatorId", "deletedAt");

-- CreateIndex
CREATE INDEX "Event_isPublic_deletedAt_idx" ON "Event"("isPublic", "deletedAt");

-- CreateIndex
CREATE INDEX "Match_userId_deletedAt_idx" ON "Match"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Match_eventId_deletedAt_idx" ON "Match"("eventId", "deletedAt");

-- CreateIndex
CREATE INDEX "Match_isPublic_deletedAt_idx" ON "Match"("isPublic", "deletedAt");
