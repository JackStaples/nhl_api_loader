export const setupSql = `
-- Drop tables if they exist
DROP TABLE IF EXISTS Play CASCADE;
DROP TABLE IF EXISTS Game CASCADE;
DROP TABLE IF EXISTS Team CASCADE;
DROP TABLE IF EXISTS Period CASCADE;
DROP TABLE IF EXISTS RosterSpot CASCADE;
DROP TABLE IF EXISTS Linescore CASCADE;
DROP TABLE IF EXISTS PersonPosition CASCADE;
DROP TABLE IF EXISTS Person CASCADE;
DROP TABLE IF EXISTS PositionCodes CASCADE;
DROP TABLE IF EXISTS Season CASCADE;

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

CREATE TABLE Team (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbrev VARCHAR(10) NOT NULL,
    logo VARCHAR(255),
    placeName VARCHAR(255)
);

CREATE TABLE Person (
    id INT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL
);

CREATE TABLE Season (
    id SERIAL PRIMARY KEY,
    season VARCHAR(8) NOT NULL
);

CREATE TABLE Period (
    id SERIAL PRIMARY KEY,
    number INT NOT NULL,
    periodType VARCHAR(10) NOT NULL
);

CREATE TABLE Play (
    id INT PRIMARY KEY,
    gameId INT REFERENCES Game(id),
    periodId INT REFERENCES Period(id),
    timeInPeriod VARCHAR(10) NOT NULL,
    timeRemaining VARCHAR(10) NOT NULL,
    situationCode VARCHAR(50) NOT NULL,
    homeTeamDefendingSide VARCHAR(10) NOT NULL,
    typeCode INT NOT NULL,
    typeDescKey VARCHAR(50) NOT NULL,
    sortOrder INT NOT NULL,
    details JSONB
);

CREATE TABLE RosterSpot (
    teamId INT REFERENCES Team(id),
    playerId INT REFERENCES Person(id),
    gameId int References Game(id),
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    sweaterNumber INT NOT NULL,
    positionCode VARCHAR(2) NOT NULL,
    headshot VARCHAR(255),
    PRIMARY KEY (teamId, playerId, gameId)
);

CREATE TABLE Linescore (
    gameId INT REFERENCES Game(id),
    byPeriod JSONB NOT NULL,
    totals JSONB NOT NULL,
    PRIMARY KEY (gameId)
);

CREATE TABLE PositionCodes (
    PositionCode VARCHAR(1) PRIMARY KEY
);
INSERT INTO PositionCodes (PositionCode) VALUES ('C');
INSERT INTO PositionCodes (PositionCode) VALUES ('D');
INSERT INTO PositionCodes (PositionCode) VALUES ('G');
INSERT INTO PositionCodes (PositionCode) VALUES ('L');
INSERT INTO PositionCodes (PositionCode) VALUES ('R');

CREATE TABLE PersonPosition (
    personId INT,
    positionCode VARCHAR(1),
    seasonId INT,
    PRIMARY KEY (personId, PositionCode, seasonId),
    FOREIGN KEY (personId) REFERENCES Person(id),
    FOREIGN KEY (PositionCode) REFERENCES PositionCodes(PositionCode),
    FOREIGN KEY (seasonId) REFERENCES Season(id)
);
`;

export const insertGameQuery = `
    INSERT INTO Game (
        id, season, gameType, limitedScoring, gameDate, venue, venueLocation, startTimeUTC,
        easternUTCOffset, venueUTCOffset, gameState, gameScheduleState, displayPeriod,
        maxPeriods, shootoutInUse, otInUse, regPeriods
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    )
`;

// export default { setupSql, insertGameQuery };