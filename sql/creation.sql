-- Drop tables if they exist
DROP TABLE IF EXISTS Play CASCADE;
DROP TABLE IF EXISTS Game CASCADE;
DROP TABLE IF EXISTS Team CASCADE;
DROP TABLE IF EXISTS PeriodDescriptor CASCADE;
DROP TABLE IF EXISTS RosterSpot CASCADE;
DROP TABLE IF EXISTS GameInfo CASCADE;
DROP TABLE IF EXISTS GameReports CASCADE;
DROP TABLE IF EXISTS Linescore CASCADE;

-- Table for storing games
CREATE TABLE Game (
    id INT PRIMARY KEY,
    season INT NOT NULL,
    gameType INT NOT NULL,
    limitedScoring BOOLEAN NOT NULL,
    gameDate TIMESTAMP NOT NULL,
    venue VARCHAR(255) NOT NULL,
    venueLocation VARCHAR(255) NOT NULL,
    startTimeUTC TIMESTAMP NOT NULL,
    easternUTCOffset VARCHAR(10) NOT NULL,
    venueUTCOffset VARCHAR(10) NOT NULL,
    gameState VARCHAR(50) NOT NULL,
    gameScheduleState VARCHAR(50) NOT NULL,
    displayPeriod INT NOT NULL,
    maxPeriods INT NOT NULL,
    shootoutInUse BOOLEAN NOT NULL,
    otInUse BOOLEAN NOT NULL,
    regPeriods INT NOT NULL
);

-- Table for storing teams
CREATE TABLE Team (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbrev VARCHAR(10) NOT NULL,
    logo VARCHAR(255),
    placeName VARCHAR(255),
);

-- Table for storing period descriptors
CREATE TABLE PeriodDescriptor (
    id SERIAL PRIMARY KEY,
    number INT NOT NULL,
    periodType VARCHAR(10) NOT NULL,
    maxRegulationPeriods INT NOT NULL
);

-- Table for storing plays
CREATE TABLE Play (
    eventId INT PRIMARY KEY,
    gameId INT REFERENCES Game(id),
    periodDescriptorId INT REFERENCES PeriodDescriptor(id),
    timeInPeriod VARCHAR(10) NOT NULL,
    timeRemaining VARCHAR(10) NOT NULL,
    situationCode VARCHAR(50) NOT NULL,
    homeTeamDefendingSide VARCHAR(10) NOT NULL,
    typeCode INT NOT NULL,
    typeDescKey VARCHAR(50) NOT NULL,
    sortOrder INT NOT NULL,
    details JSONB
);

-- Table for storing roster spots
CREATE TABLE RosterSpot (
    teamId INT REFERENCES Team(id),
    playerId INT,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    sweaterNumber INT NOT NULL,
    positionCode VARCHAR(2) NOT NULL,
    headshot VARCHAR(255),
    PRIMARY KEY (teamId, playerId)
);

-- Table for storing game info
CREATE TABLE GameInfo (
    gameId INT REFERENCES Game(id),
    referees JSONB NOT NULL,
    linesmen JSONB NOT NULL,
    awayTeam JSONB NOT NULL,
    homeTeam JSONB NOT NULL,
    PRIMARY KEY (gameId)
);

-- Table for storing game reports
CREATE TABLE GameReports (
    gameId INT REFERENCES Game(id),
    gameSummary TEXT NOT NULL,
    eventSummary TEXT NOT NULL,
    playByPlay TEXT NOT NULL,
    faceoffSummary TEXT NOT NULL,
    faceoffComparison TEXT NOT NULL,
    rosters TEXT NOT NULL,
    shotSummary TEXT NOT NULL,
    shiftChart TEXT NOT NULL,
    toiAway TEXT NOT NULL,
    toiHome TEXT NOT NULL,
    PRIMARY KEY (gameId)
);

-- Table for storing linescores
CREATE TABLE Linescore (
    gameId INT REFERENCES Game(id),
    byPeriod JSONB NOT NULL,
    totals JSONB NOT NULL,
    PRIMARY KEY (gameId)
);
