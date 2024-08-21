export const setupSql = `
-- Drop tables if they exist
DROP TABLE IF EXISTS Play CASCADE;
DROP TABLE IF EXISTS Game CASCADE;
DROP TABLE IF EXISTS Team CASCADE;
DROP TABLE IF EXISTS Period CASCADE;
DROP TABLE IF EXISTS RosterSpot CASCADE;
DROP TABLE IF EXISTS PersonPosition CASCADE;
DROP TABLE IF EXISTS Player CASCADE;
DROP TABLE IF EXISTS PositionCodes CASCADE;
DROP TABLE IF EXISTS Season CASCADE;
DROP TABLE IF EXISTS gameLog CASCADE;
DROP TABLE IF EXISTS goalieGameLog CASCADE;
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

CREATE TABLE Player (
    id INT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    position VARCHAR(1) NOT NULL,
    heightInCentimeters INT NOT NULL,
    weightInKilograms INT NOT NULL,
    birthDate DATE NOT NULL,
    birthCountry VARCHAR(50) NOT NULL,
    shootsCatches VARCHAR(1) NOT NULL,
    draftDetails JSONB,
    headshot VARCHAR(255),
    heroImage VARCHAR(255)
);

CREATE TABLE Season (
    season INT PRIMARY KEY
);

CREATE TABLE Period (
    number INT PRIMARY KEY,
    periodType VARCHAR(10) NOT NULL
);

INSERT INTO Period (number, periodType) VALUES (1, 'REG');
INSERT INTO Period (number, periodType) VALUES (2, 'REG');
INSERT INTO Period (number, periodType) VALUES (3, 'REG');
INSERT INTO Period (number, periodType) VALUES (4, 'OT');
INSERT INTO Period (number, periodType) VALUES (5, 'SO');

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
    teamId INT,
    playerId INT,
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
    season INT,
    PRIMARY KEY (personId, PositionCode, season),
    FOREIGN KEY (personId) REFERENCES Player(id),
    FOREIGN KEY (PositionCode) REFERENCES PositionCodes(PositionCode),
    FOREIGN KEY (season) REFERENCES Season(season)
);

CREATE TABLE gameLog (
    id SERIAL PRIMARY KEY,
    playerId INTEGER NOT NULL,
    gameId INTEGER NOT NULL,
    teamAbbrev VARCHAR(3) NOT NULL,
    homeRoadFlag CHAR(1) NOT NULL,
    gameDate DATE NOT NULL,
    goals INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    commonName VARCHAR(50) NOT NULL,
    opponentCommonName VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    plusMinus INTEGER NOT NULL,
    powerPlayGoals INTEGER NOT NULL,
    powerPlayPoints INTEGER NOT NULL,
    gameWinningGoals INTEGER NOT NULL,
    otGoals INTEGER NOT NULL,
    shots INTEGER NOT NULL,
    shifts INTEGER NOT NULL,
    shorthandedGoals INTEGER NOT NULL,
    shorthandedPoints INTEGER NOT NULL,
    opponentAbbrev VARCHAR(3) NOT NULL,
    pim INTEGER NOT NULL,
    toi VARCHAR(8) NOT NULL
);

CREATE TABLE goalieGameLog (
    id SERIAL PRIMARY KEY,
    playerId INTEGER NOT NULL,
    gameId INTEGER NOT NULL,
    teamAbbrev VARCHAR(3) NOT NULL,
    homeRoadFlag CHAR(1) NOT NULL,
    gameDate DATE NOT NULL,
    goals INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    commonName VARCHAR(50) NOT NULL,
    opponentCommonName VARCHAR(50) NOT NULL,
    gamesStarted INTEGER NOT NULL,
    decision VARCHAR(1) NOT NULL,
    shotsAgainst INTEGER NOT NULL,
    goalsAgainst INTEGER NOT NULL,
    savePctg DECIMAL(5,3) NOT NULL,
    shutouts INTEGER NOT NULL,
    opponentAbbrev VARCHAR(3) NOT NULL,
    pim INTEGER NOT NULL,
    toi VARCHAR(8) NOT NULL
);
`;

export const insertGameQuery = `
    INSERT INTO Game (id, season, gameType, limitedScoring, gameDate, venue, venueLocation, startTimeUTC,
        easternUTCOffset, venueUTCOffset, gameState, gameScheduleState, displayPeriod,
        maxPeriods, shootoutInUse, otInUse, regPeriods
    ) VALUES 
        $insert
    
`;

export const insertTeamQuery = `
      INSERT INTO Team (
        id, name, abbrev, logo, placeName
      ) VALUES 
        $insert
      
`;

export const insertPlayerQuery = `
INSERT INTO Player (id, firstName, lastName, position, heightInCentimeters, weightInKilograms, birthDate, birthCountry, shootsCatches, draftDetails, headshot, heroImage)
VALUES $insert
`;
    
export const insertPersonPositionQuery = `
        INSERT INTO PersonPosition (personId, positionCode, season)
        VALUES ($1, $2, $3)
      `;

export const insertSeasonQuery = 'INSERT INTO Season (season) VALUES ($insert)';

export const insertPlayQuery = `
      INSERT INTO Play (
        gameId, periodNumber, timeInPeriod, timeRemaining, situationCode,
        homeTeamDefendingSide, typeCode, typeDescKey, sortOrder, details
      ) VALUES
        $insert;
    `;

export const insterRosterSpotQuery = `
        INSERT INTO RosterSpot (teamId, playerId, gameId, positionCode)
        VALUES $insert;
    `;

export const insertGameLogQuery = `
INSERT INTO gameLog (
    playerId,
    gameId, 
    teamAbbrev, 
    homeRoadFlag, 
    gameDate, 
    goals, 
    assists, 
    commonName, 
    opponentCommonName, 
    points, 
    plusMinus, 
    powerPlayGoals, 
    powerPlayPoints, 
    gameWinningGoals, 
    otGoals, 
    shots, 
    shifts, 
    shorthandedGoals, 
    shorthandedPoints, 
    opponentAbbrev, 
    pim, 
    toi
)  VALUES
    $insert
;
`;

export const insertGoalieGameLogQuery = `
INSERT INTO goalieGameLog (
    playerId,
    gameId, 
    teamAbbrev, 
    homeRoadFlag, 
    gameDate, 
    goals, 
    assists, 
    commonName, 
    opponentCommonName, 
    gamesStarted, 
    decision, 
    shotsAgainst, 
    goalsAgainst, 
    savePctg, 
    shutouts, 
    opponentAbbrev, 
    pim, 
    toi
) VALUES
    $insert
;
`;


export const createPlayTypesViewQuery = `    
CREATE MATERIALIZED VIEW playtypes AS
SELECT DISTINCT typeCode, typeDescKey
FROM Play;`;

export const createStatsMaterializedViewsQuery = `


`;


export function createWeeklyStatMaterializedView() {
    return `DROP MATERIALIZED VIEW IF EXISTS public.breakoutseasons;
DROP MATERIALIZED VIEW IF EXISTS public.seasonStats;
DROP MATERIALIZED VIEW IF EXISTS public.seasonGoals;
DROP MATERIALIZED VIEW IF EXISTS seasonfantasystatsplayerinfo;
DROP MATERIALIZED VIEW IF EXISTS weeklyfantasystats;
DROP MATERIALIZED VIEW IF EXISTS weeklystats;
DROP MATERIALIZED VIEW IF EXISTS weeklyblockstats;
DROP MATERIALIZED VIEW IF EXISTS weeklyhitstats;
DROP MATERIALIZED VIEW IF EXISTS weeklygamelogstats;
DROP MATERIALIZED VIEW IF EXISTS seasonweeks;
DROP MATERIALIZED VIEW IF EXISTS seasonfantasypredictor;
DROP MATERIALIZED VIEW IF EXISTS playerdescriptors;
DROP MATERIALIZED VIEW IF EXISTS seasongamesplayed;
DROP MATERIALIZED VIEW IF EXISTS previousseason;
DROP MATERIALIZED VIEW IF EXISTS public.seasonFantasyStats;
DROP MATERIALIZED VIEW IF EXISTS public.seasonStatsGameLog;


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

	  
CREATE MATERIALIZED VIEW seasonStatsGameLog AS
SELECT 
    playerId AS personid,
    season,
    SUM(goals) AS goals,
    SUM(assists) AS assists,
    SUM(powerplaypoints) AS powerplaypoints,
    SUM(shots) AS shots
FROM gamelog
INNER JOIN game ON gameid = game.id
GROUP BY playerid, season;

CREATE MATERIALIZED VIEW seasongamesplayed AS
	SELECT playerId, season, count(1) AS gamesplayed FROM rosterspot rs
	INNER JOIN game ON game.id = rs.gameid
	GROUP BY playerId, season;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.seasonFantasyStats
TABLESPACE pg_default
AS
 SELECT playerseasons.playerid AS personid,
    playerseasons.season,
	sgp.gamesplayed,
    COALESCE(seasonstatsgamelog.goals, 0::bigint) * 6 AS goalpoints,
    COALESCE(seasonstatsgamelog.assists, 0::bigint) * 4 AS assistpoints,
    COALESCE(seasonstatsgamelog.powerplaypoints, 0::bigint)::numeric * 0.5 AS powerplaypoints,
    COALESCE(seasonstatsgamelog.shots, 0::bigint) AS shotpoints,
    COALESCE(seasonblockedshots.blocks, 0::bigint) AS blockedshotpoints,
    COALESCE(seasonhits.hits, 0::bigint)::numeric * 0.5 AS hitpoints,
    (COALESCE(seasonstatsgamelog.goals, 0::bigint) * 6 + COALESCE(seasonstatsgamelog.assists, 0::bigint) * 4)::numeric + COALESCE(seasonstatsgamelog.powerplaypoints, 0::bigint)::numeric * 0.5 + COALESCE(seasonstatsgamelog.shots, 0::bigint)::numeric + COALESCE(seasonblockedshots.blocks, 0::bigint)::numeric + COALESCE(seasonhits.hits, 0::bigint)::numeric * 0.5 AS totalpoints
   FROM ( SELECT DISTINCT game.season,
            rosterspot.playerid
           FROM game
             JOIN rosterspot ON rosterspot.gameid = game.id
          WHERE rosterspot.positioncode::text <> 'G'::text) playerseasons
     LEFT JOIN seasonhits ON playerseasons.playerid = seasonhits.personid AND playerseasons.season = seasonhits.season
     LEFT JOIN seasonblockedshots ON playerseasons.playerid = seasonblockedshots.personid AND playerseasons.season = seasonblockedshots.season
     LEFT JOIN seasonstatsgamelog ON playerseasons.playerid = seasonstatsgamelog.personid AND playerseasons.season = seasonstatsgamelog.season
	 LEFT JOIN seasongamesplayed sgp ON playerseasons.playerid = sgp.playerid AND sgp.season = playerseasons.season
  ORDER BY playerseasons.playerid, playerseasons.season;

DROP MATERIALIZED VIEW IF EXISTS goalieSeasonFantasyStats;
DROP MATERIALIZED VIEW IF EXISTS goalieSeasonStats;

CREATE MATERIALIZED VIEW IF NOT EXISTS goalieSeasonStats AS
SELECT 
	wins.playerId, 
	wins.season,
	SUM(shotsagainst) - SUM(goalsagainst) AS saves,
	SUM(goalsagainst) AS goalsagainst,
	wins
from goaliegamelog
INNER JOIN game
ON game.id = goaliegamelog.gameid
INNER JOIN (
	SELECT playerId, season, count(1) AS wins
	FROM goaliegamelog
	INNER JOIN game
	ON game.id = goaliegamelog.gameid
	WHERE decision = 'W'
	GROUP BY playerId, season
) AS wins
ON wins.playerid = goaliegamelog.playerid
AND wins.season = game.season
GROUP BY wins.playerId, wins.season, wins;

CREATE MATERIALIZED VIEW IF NOT EXISTS goalieSeasonFantasyStats AS
SELECT 
	playerId,
	season,
	(wins * 6) AS winPoints,
	(saves * 0.6) AS savePoints,
	(goalsAgainst * -3) AS goalsAgainstPoints,
	((wins * 6) + (saves * 0.6) + (goalsAgainst * -3)) AS totalPoints
FROM goalieseasonstats
ORDER BY totalpoints DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS seasonweeks AS
 SELECT season,
    row_number() OVER (PARTITION BY season ORDER BY (min(gamedate))) AS week,
    EXTRACT(week FROM gamedate) AS weekofyear,
    min(gamedate) AS firstgameofweek
   FROM game
  GROUP BY season, (EXTRACT(week FROM gamedate))
  ORDER BY season, (row_number() OVER (PARTITION BY season ORDER BY (min(gamedate))));

CREATE MATERIALIZED VIEW weeklyhitstats AS
WITH playerWeeks AS (
	SELECT rs.playerId, sw.week, sw.weekOfYear, sw.season
	FROM rosterspot rs
	INNER JOIN game g ON rs.gameid = g.id
	INNER JOIN seasonweeks sw ON sw.season = g.season
	WHERE rs.positioncode <> 'G'
	GROUP BY rs.playerId, sw.week, sw.weekOfYear, sw.season
	ORDER BY rs.playerId, sw.season, sw.week
),
hitPlays AS (
	SELECT gamedate, details, season FROM play
	FULL JOIN game ON game.id = play.gameid
	WHERE typecode = 503
)
SELECT 
	playerId,
	playerWeeks.season,
	week,
	SUM(CASE WHEN details IS null THEN 0 ELSE 1 END) AS hits
FROM playerWeeks
LEFT JOIN hitPlays
ON EXTRACT(week FROM hitPlays.gamedate) = playerWeeks.weekOfYear
AND CAST(hitPlays.details->'hittingPlayerId' AS INTEGER) = playerWeeks.playerId
AND hitPlays.season = playerWeeks.season
GROUP BY playerId, playerWeeks.season, week
ORDER BY playerId, playerWeeks.season, week ASC;

CREATE MATERIALIZED VIEW weeklyblockstats AS
WITH playerWeeks AS (
	SELECT rs.playerId, sw.week, sw.weekOfYear, sw.season
	FROM rosterspot rs
	INNER JOIN game g ON rs.gameid = g.id
	INNER JOIN seasonweeks sw ON sw.season = g.season
	WHERE rs.positioncode <> 'G'
	GROUP BY rs.playerId, sw.week, sw.weekOfYear, sw.season
	ORDER BY rs.playerId, sw.season, sw.week
),
blockedShotPlays AS (
	SELECT gamedate, details, season FROM play
	FULL JOIN game ON game.id = play.gameid
	WHERE typecode = 508
)
SELECT 
	playerId,
	playerWeeks.season,
	week,
	SUM(CASE WHEN details IS null THEN 0 ELSE 1 END) AS blockedShots
FROM playerWeeks
LEFT JOIN blockedShotPlays
ON EXTRACT(week FROM blockedShotPlays.gamedate) = playerWeeks.weekOfYear
AND CAST(blockedShotPlays.details->'blockingPlayerId' AS INTEGER) = playerWeeks.playerId
AND blockedShotPlays.season = playerWeeks.season
GROUP BY playerId, playerWeeks.season, week
ORDER BY playerId, playerWeeks.season, week ASC;

CREATE MATERIALIZED VIEW weeklygamelogstats AS
WITH playerWeeks AS (
    SELECT rs.playerId, sw.week, sw.weekOfYear, sw.season
    FROM rosterspot rs
    INNER JOIN game g ON rs.gameid = g.id
    INNER JOIN seasonweeks sw ON sw.season = g.season
    WHERE rs.positioncode <> 'G'
    GROUP BY rs.playerId, sw.week, sw.weekOfYear, sw.season
    ORDER BY rs.playerId, sw.season, sw.week
),
gamelogData AS (
    SELECT gl.playerid, EXTRACT(week FROM gl.gamedate) AS weekOfYear, g.season,
           SUM(gl.goals) AS goals, SUM(gl.assists) AS assists,
           SUM(gl.shots) AS shots, SUM(gl.powerplaypoints) AS powerPlayPoints,
           COUNT(1) AS gamesplayed
    FROM gamelog gl
    INNER JOIN game g ON gl.gameid = g.id
    GROUP BY gl.playerid, EXTRACT(week FROM gl.gamedate), g.season
)
SELECT pw.playerId, pw.season, pw.week,
       COALESCE(gd.goals, 0) AS goals,
       COALESCE(gd.assists, 0) AS assists,
       COALESCE(gd.shots, 0) AS shots,
       COALESCE(gd.powerPlayPoints, 0) AS powerPlayPoints,
       COALESCE(gd.gamesplayed, 0) AS gamesplayed
FROM playerWeeks pw
LEFT JOIN gamelogData gd 
       ON pw.playerId = gd.playerid
      AND pw.weekOfYear = gd.weekOfYear
      AND pw.season = gd.season
ORDER BY pw.playerId, pw.season, pw.week ASC;

CREATE MATERIALIZED VIEW weeklystats AS
SELECT 
	wbs.playerId,
	wbs.season,
	wbs.week,
	goals,
	assists,
	shots,
	powerplaypoints,
	blockedshots,
	hits,
	gamesplayed
FROM weeklygamelogstats wgs
INNER JOIN weeklyblockstats wbs
ON wbs.playerId = wgs.playerId
AND wbs.season = wgs.season
AND wbs.week = wgs.week
INNER JOIN weeklyhitstats whs
ON whs.playerId = wgs.playerId
AND whs.season = wgs.season
AND whs.week = wgs.week;

CREATE MATERIALIZED VIEW weeklyfantasystats AS
SELECT 
	playerId,
	season,
	week,
	goals * 6 AS goalPoints,
	assists * 4 AS assistPoints,
	shots AS shotPoints,
	blockedShots as blockedShotPoints,
	powerPlayPoints * 0.5 as powerplayPointPoints,
	hits * 0.5 AS hitPoints,
	(goals * 6) + (assists * 4) + shots + blockedShots + (powerPlayPoints * 0.5) + (hits * 0.5) AS totalPoints,
	gamesplayed
FROM weeklystats;
    
CREATE MATERIALIZED VIEW previousseason AS
SELECT DISTINCT
	sfs.season AS current_season,
	CAST(CAST(CAST(LEFT(CAST(sfs.season AS VARCHAR), 4) AS INTEGER) - 1 AS VARCHAR) || CAST(RIGHT(CAST(sfs.season AS VARCHAR), 4) AS INTEGER) - 1 AS INTEGER) AS previous_season
FROM seasonfantasystats sfs;

CREATE MATERIALIZED VIEW seasonfantasystatsplayerinfo AS
	SELECT 
		sfs.personId, sfs.season, sfs.goalpoints, sfs.assistpoints, sfs.powerplaypoints, sfs.shotpoints, sfs.blockedshotpoints, sfs.hitpoints, sfs.totalpoints, 
		birthdate, position, EXTRACT(year from DATE_TRUNC('year', AGE(DATE(LEFT(CAST(sfs.season AS VARCHAR), 4) || '-10-10'), player.birthdate) + interval '6 mons')) AS age,
		COALESCE(CAST(draftdetails->'overallPick' AS integer), 0) AS draftPosition, ROW_NUMBER() OVER(PARTITION BY sfs.personId ORDER BY sfs.season) AS yearsInLeague,
		heightInCentimeters, weightInKilograms, COALESCE(sgp.gamesplayed, 0) AS gamesPlayedPrev,
		COALESCE(sfs2.goalpoints, 0) AS goalpointsprev, COALESCE(sfs2.assistpoints, 0) AS assistpointsprev, COALESCE(sfs2.powerplaypoints, 0) AS powerplaypointsprev,
		COALESCE(sfs2.shotpoints, 0) AS shotpointsprev, COALESCE(sfs2.blockedshotpoints, 0) AS blockedshotpointsprev, COALESCE(sfs2.hitpoints, 0) AS hitpointsprev, 
		COALESCE(sfs2.totalpoints, 0) AS totalpointsprev
	FROM seasonfantasystats sfs
	INNER JOIN player ON player.id = sfs.personid
	JOIN previousseason ps ON ps.current_season = sfs.season
	LEFT JOIN seasongamesplayed sgp ON sgp.playerId = player.id AND sgp.season = ps.previous_season
	LEFT JOIN seasonfantasystats sfs2 ON sfs.personId = sfs2.personId AND sfs2.season = ps.previous_season;

CREATE MATERIALIZED VIEW playerdescriptors AS
WITH cumulative_games AS (
    SELECT
        sgp.playerId,
        sgp.season,
        COALESCE(SUM(sgp.gamesplayed) OVER (
            PARTITION BY sgp.playerId 
            ORDER BY sgp.season ASC 
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ), 0) AS totalgamesplayed
    FROM
        seasongamesplayed sgp
)
	SELECT 
		sfs.personId, 
		sfs.season, 
		birthdate, 
		position, 
		EXTRACT(year from DATE_TRUNC('year', AGE(DATE(LEFT(CAST(sfs.season AS VARCHAR), 4) || '-10-10'), player.birthdate) + interval '6 mons')) AS age,
		COALESCE(CAST(draftdetails->'overallPick' AS integer), 292) AS draftPosition, 
		ROW_NUMBER() OVER(PARTITION BY sfs.personId ORDER BY sfs.season ASC) AS yearsInLeague,
		heightInCentimeters, 
		weightInKilograms, COALESCE(sgp.gamesplayed, 0) AS gamesPlayedPrev,
		 COALESCE(cg.totalgamesplayed, 0) AS totalgamesplayed, 
		COALESCE(sfs2.goalpoints, 0) AS goalpointsprev, 
		COALESCE(sfs2.assistpoints, 0) AS assistpointsprev, 
		COALESCE(sfs2.powerplaypoints, 0) AS powerplaypointsprev,
		COALESCE(sfs2.shotpoints, 0) AS shotpointsprev, 
		COALESCE(sfs2.blockedshotpoints, 0) AS blockedshotpointsprev, 
		COALESCE(sfs2.hitpoints, 0) AS hitpointsprev, 
		COALESCE(sfs2.totalpoints, 0) AS totalpointsprev, 
		COALESCE(CAST(sfs2.goalpoints AS DECIMAL)/sgp.gamesplayed, 0) AS goalpointspergameprev, 
		COALESCE(CAST(sfs2.assistpoints AS DECIMAL)/sgp.gamesplayed, 0) AS assistpointspergameprev, 
		COALESCE(CAST(sfs2.powerplaypoints AS DECIMAL)/sgp.gamesplayed, 0) AS powerplaypointspergameprev,
		COALESCE(CAST(sfs2.shotpoints AS DECIMAL)/sgp.gamesplayed, 0) AS shotpointspergameprev, 
		COALESCE(CAST(sfs2.blockedshotpoints AS DECIMAL)/sgp.gamesplayed, 0) AS blockedshotpointspergameprev, 
		COALESCE(CAST(sfs2.hitpoints AS DECIMAL)/sgp.gamesplayed, 0) AS hitpointspergameprev, 
		COALESCE(CAST(sfs2.totalpoints AS DECIMAL)/sgp.gamesplayed, 0) AS totalpointspergameprev, 
		ROW_NUMBER() OVER(PARTITION BY sfs2.season, position ORDER BY COALESCE(sfs2.totalPoints, 0) DESC, sfs2.personid) AS positionfinishprev
	FROM seasonfantasystats sfs
	JOIN player ON player.id = sfs.personid
	LEFT JOIN previousseason ps ON ps.current_season = sfs.season
	INNER JOIN seasongamesplayed sgp ON sgp.playerId = player.id AND sgp.season = ps.previous_season
	LEFT JOIN seasonfantasystats sfs2 ON player.id = sfs2.personId AND sfs2.season = ps.previous_season
	LEFT JOIN cumulative_games cg ON cg.playerId = sfs.personId AND cg.season = sfs.season
	WHERE sfs.season <> 20092010;

CREATE MATERIALIZED VIEW seasonfantasypredictor AS
SELECT 
	sfs.personid,
	sfs.season,
	goalpoints,
	assistpoints,
	powerplaypoints,
	shotpoints,
	blockedshotpoints,
	hitpoints, 
	totalpoints,
	birthdate,
	position,
	age,
	draftposition,
	yearsinleague,
	heightincentimeters,
	weightinkilograms,
	totalgamesplayed,
	gamesplayedprev,
	goalpointsprev,
	assistpointsprev,
	powerplaypointsprev,
	shotpointsprev,
	blockedshotpointsprev,
	hitpointsprev,
	totalpointsprev,
	goalpointspergameprev,
	assistpointspergameprev,
	powerplaypointspergameprev,
	shotpointspergameprev,
	blockedshotpointspergameprev,
	hitpointspergameprev,
	totalpointspergameprev,
	positionfinishprev
FROM seasonfantasystats sfs
INNER JOIN playerdescriptors pd ON pd.personid = sfs.personid AND pd.season = sfs.season;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.breakoutseasons
TABLESPACE pg_default
AS
 SELECT personid,
    season,
    goalpoints,
    assistpoints,
    powerplaypoints,
    shotpoints,
    blockedshotpoints,
    hitpoints,
    totalpoints,
    birthdate,
    "position",
    age,
    draftposition,
    yearsinleague,
    heightincentimeters,
    weightinkilograms,
    totalgamesplayed,
    gamesplayedprev,
    goalpointsprev,
    assistpointsprev,
    powerplaypointsprev,
    shotpointsprev,
    blockedshotpointsprev,
    hitpointsprev,
    totalpointsprev,
    goalpointspergameprev,
    assistpointspergameprev,
    powerplaypointspergameprev,
    shotpointspergameprev,
    blockedshotpointspergameprev,
    hitpointspergameprev,
    totalpointspergameprev,
    positionfinishprev
   FROM seasonfantasypredictor
  WHERE totalpoints > 500::numeric AND (totalpoints - totalpointsprev) > 250::numeric
  ORDER BY totalpoints DESC;
   `;



}