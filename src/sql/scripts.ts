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
DROP MATERIALIZED VIEW IF EXISTS PlayTypes;
DROP SEQUENCE IF EXISTS play_id_seq CASCADE;

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

CREATE SEQUENCE play_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE Play (
    id INT PRIMARY KEY DEFAULT nextval('play_id_seq'),
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
        gameId, periodNumber, timeInPeriod, timeRemaining, situationCode,
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

export const createPlayTypesViewQuery = `    
CREATE MATERIALIZED VIEW playtypes AS
SELECT DISTINCT typeCode, typeDescKey
FROM Play;`;

export const createStatsMaterializedViewsQuery = `
DROP MATERIALIZED VIEW IF EXISTS public.seasonStats;

DROP MATERIALIZED VIEW IF EXISTS public.goals;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.goals
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'scoringPlayerId' AS INTEGER) AS personid,
    count(1) AS goals,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 505
  GROUP BY CAST(play.details -> 'scoringPlayerId' AS INTEGER), game.season
WITH DATA;

DROP MATERIALIZED VIEW IF EXISTS public.primaryAssists;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.primaryAssists
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'assist1PlayerId' AS INTEGER) AS personid,
    count(1) AS assists,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 505
  GROUP BY CAST(play.details -> 'assist1PlayerId' AS INTEGER), game.season
WITH DATA;

DROP MATERIALIZED VIEW IF EXISTS public.secondaryAssists;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.secondaryAssists
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'assist2PlayerId' AS INTEGER) AS personid,
    count(1) AS assists,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 505
  GROUP BY CAST(play.details -> 'assist2PlayerId' AS INTEGER), game.season
WITH DATA;

DROP MATERIALIZED VIEW IF EXISTS public.shots;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.shots
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'shootingPlayerId' AS INTEGER) AS personid,
    count(1) AS shots,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 506
  GROUP BY CAST(play.details -> 'shootingPlayerId' AS INTEGER), game.season
WITH DATA;

DROP MATERIALIZED VIEW IF EXISTS public.hits;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.hits
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'hittingPlayerId' AS INTEGER) AS personid,
    count(1) AS hits,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 503
  GROUP BY CAST(play.details -> 'hittingPlayerId' AS INTEGER), game.season
WITH DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonStats
TABLESPACE pg_default
AS
SELECT 
	playerSeasons.playerId AS personId,
	playerSeasons.season,
	COALESCE(goals, 0) AS goals,
	COALESCE(primaryAssists.assists, 0) + COALESCE(secondaryAssists.assists, 0) AS assists,
	COALESCE(primaryAssists.assists, 0) AS primaryAssists,
	COALESCE(secondaryAssists.assists, 0) AS secondaryAssists,
	COALESCE(shots.shots, 0) AS shots,
	COALESCE(hits.hits, 0) AS hits
FROM ( 
	SELECT DISTINCT season, playerId FROM game
	INNER JOIN rosterspot
	ON rosterspot.gameid = game.id
) AS playerSeasons
LEFT JOIN goals
	ON playerSeasons.playerId = goals.personid
	AND playerSeasons.season = goals.season 
LEFT JOIN primaryAssists
	ON playerSeasons.playerId = primaryAssists.personId 
	AND playerSeasons.season = primaryAssists.season 
LEFT JOIN secondaryAssists
	ON playerSeasons.playerId = secondaryAssists.personId 
	AND playerSeasons.season = secondaryAssists.season 
LEFT JOIN shots
	ON playerSeasons.playerId = shots.personId 
	AND playerSeasons.season = shots.season
LEFT JOIN hits
	ON playerSeasons.playerId = hits.personId 
	AND playerSeasons.season = hits.season;
`;