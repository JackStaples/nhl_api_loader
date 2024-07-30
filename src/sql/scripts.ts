export const setupSql = `
-- Drop tables if they exist
DROP TABLE IF EXISTS Play CASCADE;
DROP TABLE IF EXISTS Game CASCADE;
DROP TABLE IF EXISTS Team CASCADE;
DROP TABLE IF EXISTS Period CASCADE;
DROP TABLE IF EXISTS RosterSpot CASCADE;
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
    seasonName VARCHAR(8) NOT NULL
);

CREATE TABLE Period (
    number INT PRIMARY KEY,
    periodType VARCHAR(10) NOT NULL
);

CREATE TABLE Play (
    id INT PRIMARY KEY,
    gameId INT REFERENCES Game(id),
    periodNumber INT REFERENCES Period(number),
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
    positionCode VARCHAR(2) NOT NULL,
    PRIMARY KEY (teamId, playerId, gameId)
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
    INSERT INTO Game (id, season, gameType, limitedScoring, gameDate, venue, venueLocation, startTimeUTC,
        easternUTCOffset, venueUTCOffset, gameState, gameScheduleState, displayPeriod,
        maxPeriods, shootoutInUse, otInUse, regPeriods
    ) VALUES (
        $insert
    )
`;

export const getTeamByIdQuery = `
    SELECT * FROM Team
    WHERE id = $1
`;


export const insertTeamQuery = `
      INSERT INTO Team (
        id, name, abbrev, logo, placeName
      ) VALUES (
        $1, $2, $3, $4, $5
      )
`;

export const insertPersonQuery = `
INSERT INTO Person (id, firstName, lastName)
VALUES ($1, $2, $3)
`;
    
export const insertPersonPositionQuery = `
        INSERT INTO PersonPosition (personId, positionCode, seasonId)
        VALUES ($1, $2, (SELECT id FROM Season where seasonName = $3))
      `;

export const insertSeasonQuery = 'INSERT INTO Season (seasonName) VALUES ($1)';

export const insertPlayQuery = `
      INSERT INTO Play (
        id, gameId, periodNumber, timeInPeriod, timeRemaining, situationCode,
        homeTeamDefendingSide, typeCode, typeDescKey, sortOrder, details
      ) VALUES
        $insert;
    `;

export const insertPeriodQuery = `
        INSERT INTO Period (number, periodType)
        VALUES ($1, $2)
    `;

export const insterRosterSpotQuery = `
        INSERT INTO RosterSpot (teamId, playerId, gameId, positionCode)
        VALUES ($1, $2, $3, $4)
    `;