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
DROP MATERIALIZED VIEW IF EXISTS public.seasonFantasyStats;

DROP MATERIALIZED VIEW IF EXISTS public.seasonGoals;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonGoals
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

DROP MATERIALIZED VIEW IF EXISTS public.seasonPrimaryAssists;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonPrimaryAssists
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

DROP MATERIALIZED VIEW IF EXISTS public.seasonSecondaryAssists;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonSecondaryAssists
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

DROP MATERIALIZED VIEW IF EXISTS public.seasonShots;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonShots
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

DROP MATERIALIZED VIEW IF EXISTS public.seasonhits;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonhits
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

DROP MATERIALIZED VIEW IF EXISTS public.seasonBlockedShots;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonBlockedShots
TABLESPACE pg_default
AS
 SELECT CAST(play.details -> 'blockingPlayerId' AS INTEGER) AS personid,
    count(1) AS blocks,
    game.season
   FROM play
     JOIN game ON game.id = play.gameid
  WHERE play.typecode = 508
  GROUP BY CAST(play.details -> 'blockingPlayerId' AS INTEGER), game.season
WITH DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonStats
TABLESPACE pg_default
AS
SELECT 
	playerSeasons.playerId AS personId,
	playerSeasons.season,
	COALESCE(goals, 0) AS goals,
	COALESCE(seasonPrimaryAssists.assists, 0) + COALESCE(seasonSecondaryAssists.assists, 0) AS assists,
	COALESCE(seasonPrimaryAssists.assists, 0) AS primaryAssists,
	COALESCE(seasonSecondaryAssists.assists, 0) AS secondaryAssists,
	COALESCE(seasonShots.shots, 0) AS shots,
	COALESCE(seasonhits.hits, 0) AS hits,
	COALESCE(seasonBlockedShots.blocks, 0) AS blockedShots
FROM ( 
	SELECT DISTINCT season, playerId FROM game
	INNER JOIN rosterspot
	ON rosterspot.gameid = game.id
) AS playerSeasons
LEFT JOIN seasonGoals
	ON playerSeasons.playerId = seasonGoals.personid
	AND playerSeasons.season = seasonGoals.season 
LEFT JOIN seasonPrimaryAssists
	ON playerSeasons.playerId = seasonPrimaryAssists.personId 
	AND playerSeasons.season = seasonPrimaryAssists.season 
LEFT JOIN seasonSecondaryAssists
	ON playerSeasons.playerId = seasonSecondaryAssists.personId 
	AND playerSeasons.season = seasonSecondaryAssists.season 
LEFT JOIN seasonShots
	ON playerSeasons.playerId = seasonShots.personId 
	AND playerSeasons.season = seasonShots.season
LEFT JOIN seasonhits
	ON playerSeasons.playerId = seasonhits.personId 
	AND playerSeasons.season = seasonhits.season
LEFT JOIN seasonBlockedShots
	ON playerSeasons.playerId = seasonBlockedShots.personId 
	AND playerSeasons.season = seasonBlockedShots.season;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonFantasyStats
TABLESPACE pg_default
AS
SELECT 
	playerSeasons.playerId AS personId,
	playerSeasons.season,
	COALESCE(goals, 0) * 6 AS goalPoints,
	(COALESCE(seasonPrimaryAssists.assists, 0) + COALESCE(seasonSecondaryAssists.assists, 0)) * 4 AS assistPoints,
	COALESCE(seasonShots.shots, 0) AS shotPoints,
	COALESCE(seasonhits.hits, 0) * 0.5 AS hitpoints,
	COALESCE(seasonBlockedShots.blocks, 0) AS blockedShotPoints,
	(COALESCE(goals, 0) * 6) + 
	((COALESCE(seasonPrimaryAssists.assists, 0) + COALESCE(seasonSecondaryAssists.assists, 0)) * 4) + 
	COALESCE(seasonShots.shots, 0) +
	(COALESCE(seasonhits.hits, 0) * 0.5) +
	COALESCE(seasonBlockedShots.blocks, 0) AS totalPoints
FROM ( 
	SELECT DISTINCT season, playerId FROM game
	INNER JOIN rosterspot
	ON rosterspot.gameid = game.id
) AS playerSeasons
LEFT JOIN seasonGoals
	ON playerSeasons.playerId = seasonGoals.personid
	AND playerSeasons.season = seasonGoals.season 
LEFT JOIN seasonPrimaryAssists
	ON playerSeasons.playerId = seasonPrimaryAssists.personId 
	AND playerSeasons.season = seasonPrimaryAssists.season 
LEFT JOIN seasonSecondaryAssists
	ON playerSeasons.playerId = seasonSecondaryAssists.personId 
	AND playerSeasons.season = seasonSecondaryAssists.season 
LEFT JOIN seasonShots
	ON playerSeasons.playerId = seasonShots.personId 
	AND playerSeasons.season = seasonShots.season
LEFT JOIN seasonhits
	ON playerSeasons.playerId = seasonhits.personId 
	AND playerSeasons.season = seasonhits.season
LEFT JOIN seasonBlockedShots
	ON playerSeasons.playerId = seasonBlockedShots.personId 
	AND playerSeasons.season = seasonBlockedShots.season;`;