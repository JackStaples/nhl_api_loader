import pg from 'pg';
import config from './config.js';
import { setupSql, insertGameQuery, insertTeamQuery, insertPersonQuery, insertPersonPositionQuery, insertSeasonQuery, insertPlayQuery, insertPeriodQuery, insterRosterSpotQuery, createPlayTypesViewQuery, createStatsMaterializedViewsQuery, insertGameLogQuery, insertGoalieGameLogQuery, createWeeklyStatMaterializedView } from './sql/scripts.js';
import { Person, Play, PlayByPlayResponse, RosterSpot, Team } from './types/PlayByPlay.types.js';
import { fetchGameLogForPlayer } from './api/api.js';
import { GameLog, GameLogResponse, GoalieGameLog, isGoalieGameLog } from './types/GameLog.types.js';
import { exit } from 'process';

const pool = new pg.Pool(config);

const teamMap: Map<number, boolean> = new Map();
const personMap: Map<number, boolean> = new Map();
const personPositionMap: Map<number, Map<string, boolean>> = new Map();
const seasonMap: Map<number, boolean> = new Map();
const periodMap: Map<number, boolean> = new Map();
const gameLogPlayerMap: Map<string, boolean> = new Map();

export function query<T>(text: string, params?: T[]) {
    return pool.query(text, params);
}

/**
 * runs the database setup scripts found in ./sql/creation.sql
 */
export async function setupDatabase() {
    try {
        // console.log('Setting up database');
        await query(setupSql);
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

export async function loadGameData(game: PlayByPlayResponse) {
    // console.log(`Beginning to load game data for game ${game.id}`);
    const insertString = getInsertGameString(game);
    const query = insertGameQuery.replace('$insert', insertString);

    try {
        // console.log(`Inserting game data for game ${game.id}`);
        await pool.query(query);
        // console.log(`Game data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting game data:', error, query);
        exit(1);
    }
}

function escapeStringForSQL(value: string): string {
    return value.replace(/'/g, '\'\'');
}

function getInsertGameString(game: PlayByPlayResponse) {
    return `${game.id}, ${game.season}, ${game.gameType}, ${game.limitedScoring}, 
            '${escapeStringForSQL(game.gameDate.toString())}', 
            '${escapeStringForSQL(game.venue.default)}', 
            '${escapeStringForSQL(game.venueLocation.default)}', 
            '${escapeStringForSQL(game.startTimeUTC.toString())}', 
            '${escapeStringForSQL(game.easternUTCOffset)}', 
            '${escapeStringForSQL(game.venueUTCOffset)}', 
            '${escapeStringForSQL(game.gameState)}', 
            '${escapeStringForSQL(game.gameScheduleState)}', 
            ${game.displayPeriod}, 
            ${game.maxPeriods}, 
            ${game.shootoutInUse}, 
            ${game.otInUse}, 
            ${game.regPeriods}`;
}


export async function loadTeamData(game: PlayByPlayResponse) {
    // console.log(`Beginning to load team data for game ${game.id}`);
    const { awayTeam, homeTeam } = game;
    await insertTeam(awayTeam);
    await insertTeam(homeTeam);
}

async function insertTeam(team: Team) {
    if (
        !teamMap.has(team.id)
    ) {
        const teamData = [
            team.id,
            team.name.default,
            team.abbrev,
            team.logo,
            team.placeName?.default
        ];
        try {
            // console.log(`Inserting team data for team ${team.id}`);
            await query(insertTeamQuery, teamData);
            // console.log(`Team data inserted for team ${team.id}`);
            teamMap.set(team.id, true);
        } catch (error) {
            // console.error('Error inserting team data:', error);
        }
    }
}

export async function loadSeasonData(season: number) {
    if (
        !seasonMap.has(season)
    ) {
        const seasonData = [
            season
        ];
        try {
            // console.log(`Inserting season data for season ${season}`);
            await query(insertSeasonQuery, seasonData);
            // console.log(`Season data inserted for season ${season}`);
            seasonMap.set(season, true);
        } catch (error) {
            console.error('Error inserting season data:', error);
        }
    }
}


export async function loadPersonData(game: PlayByPlayResponse) {
    const { rosterSpots } = game;
    const querys = [];
    for (const spot of rosterSpots) {
        querys.push(insertPersonAndPosition(spot, game));
    }
    Promise.all(querys);
}

async function insertPersonAndPosition(spot: RosterSpot, game: PlayByPlayResponse) {
    await insertPerson({
        id: spot.playerId,
        firstName: spot.firstName,
        lastName: spot.lastName
    });
    await insertPersonPosition(spot.playerId, spot.positionCode, game.season.toString());
}

async function insertPerson(person: Person) {
    if (
        !personMap.has(person.id)
    ) {
        const personData = [
            person.id,
            person.firstName.default,
            person.lastName.default
        ];
        try {
            // console.log(`Inserting person data for person ${person.id}`);
            await query(insertPersonQuery, personData);
            // console.log(`Person data inserted for person ${person.id}`);
            personMap.set(person.id, true);
        } catch (error) {
            console.error('Error inserting person data:', error);
        }
    }

}

async function insertPersonPosition(personId: number, position: string, season: string) {
    if (
        !personPositionMap.has(personId)
    ) {
        personPositionMap.set(personId, new Map());
    }

    if (
        !personPositionMap.get(personId)?.has(position)
    ) {
        const personPositionData = [
            personId,
            position,
            season
        ];
        try {
            // console.log(`Inserting person position data for person ${personId}`);
            await query(insertPersonPositionQuery, personPositionData);
            // console.log(`Person position data inserted for person ${personId}`);
            personPositionMap.get(personId)?.set(position, true);
        } catch (error) {
            console.error('Error inserting person position data:', error, insertPersonPositionQuery, personPositionData);
        }
    }

}

export async function loadPlaysData(game: PlayByPlayResponse) {
    const { plays } = game;
    if (!plays || plays.length === 0) return;
    
    const insertionStrings: string[] = [];
    for (const play of plays ) {
        await insertPeriod(play);
        insertionStrings.push(getInsertPlayString(play, game.id));
    }
    const insertString = insertionStrings.join(',\n');
    const query = insertPlayQuery.replace('$insert', insertString);
    try {
        // console.log(`Inserting play data for game ${game.id}`);
        await pool.query(query);
        // console.log(`Play data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting play data:', error, query, game);
    }
}

async function insertPeriod(play: Play) {
    if (!periodMap.has(play.periodDescriptor.number)) {
        const periodData = [
            play.periodDescriptor.number,
            play.periodDescriptor.periodType
        ];
        try {
            // console.log(`Inserting period data for period ${play.periodDescriptor.number}`);
            await query(insertPeriodQuery, periodData);
            // console.log(`Period data inserted for period ${play.periodDescriptor.number}`);
            periodMap.set(play.periodDescriptor.number, true);
        } catch (error) {
            console.error('Error inserting period data:', error);
        }
    }
}

function getInsertPlayString(play: Play, gameId: number) {
    return `(${gameId}, ${play.periodDescriptor.number}, '${play.timeInPeriod}', '${play.timeRemaining}', '${play.situationCode}', '${play.homeTeamDefendingSide}', ${play.typeCode}, '${play.typeDescKey}', ${play.sortOrder}, '${play.details ? JSON.stringify(play.details):'{}'}')`;
}

export async function loadRosterSpots(game: PlayByPlayResponse) {
    // console.log('Inserting roster spot data for players');
    const { rosterSpots } = game;
    const querys: Promise<pg.QueryResult>[] = [];
    for (const spot of rosterSpots) {
        const rosterSpotData = [
            spot.teamId,
            spot.playerId,
            game.id,
            spot.positionCode
        ];
        try {
            querys.push(query(insterRosterSpotQuery, rosterSpotData));
        } catch (error) {
            console.error('Error inserting roster spot data:', error, insterRosterSpotQuery, rosterSpotData);
            exit(1);
        }
    }
    await Promise.all(querys);
    // console.log('Roster spot data inserted for player');
}

export async function createPlayTypesView() {
    try {
        // console.log('Creating PlayTypes view');
        await query(createPlayTypesViewQuery);
        // console.log('PlayTypes view created');
    } catch (error) {
        console.error('Error creating PlayTypes view:', error);
    }
}

export async function createStatsMaterializedViews() {
    try {
        // console.log('Creating Stats materialized views');
        await query(createStatsMaterializedViewsQuery);
        // console.log('Stats materialized views created');
    } catch (error) {
        console.error('Error creating Stats materialized views:', error);
    }
}

export async function loadGameLogForPlayerMap(seasons: number[]) {
    let querys = [];
    for (const season of seasons) {
        for (const playerId of personMap.keys()) {
            querys.push(fetchAndLoadGameLog(playerId, season));

            if (querys.length > 7) {
                await Promise.all(querys);
                querys = [];
            }
        }
    }
}

async function fetchAndLoadGameLog(playerId: number, season: number) {
    if (gameLogPlayerMap.get(`${playerId}-${season}`)) return;
    gameLogPlayerMap.set(`${playerId}-${season}`, true);

    // console.log(`loading game log for player ${playerId} for season ${season}`);
    const gameLog = await fetchGameLogForPlayer(playerId.toString(), season);
    if (gameLog) {
        await loadGameLog(gameLog, playerId);
    }
}

export async function loadGameLog(gameLog: GameLogResponse, playerId: number) {
    const { gameLog: games } = gameLog;
    if (!games || games.length === 0) return;
    const insertionStrings: string[] = [];
    for (const game of games) {
        insertionStrings.push(createGameLogInsertString(game, playerId));
    }
    const insertString = insertionStrings.join(',\n');
    let query;
    if (isGoalieGameLog(games[0])) {
        query = insertGoalieGameLogQuery.replace('$insert', insertString);
    } else {
        query = insertGameLogQuery.replace('$insert', insertString);
    }
    try {
        await pool.query(query);
    } catch (error) {
        console.log(query);
        console.error('Error inserting game log data:', error);
        return;
    }
}

function createGameLogInsertString(game: GameLog | GoalieGameLog, playerId: number): string {
    if (isGoalieGameLog(game)) {
        return `(${playerId}, ${game.gameId}, '${game.teamAbbrev ?? ''}', '${game.homeRoadFlag ?? ''}', '${game.gameDate ?? ''}', ${game.goals ?? 0}, ${game.assists ?? 0}, '${game.commonName.default ?? ''}', '${game.opponentCommonName.default ?? ''}', ${game.gamesStarted ?? 0}, '${game.decision ?? '?'}', ${game.shotsAgainst ?? 0}, ${game.goalsAgainst ?? 0}, ${game.savePctg ?? 0}, ${game.shutouts ?? 0}, '${game.opponentAbbrev ?? ''}', ${game.pim ?? 0}, '${game.toi ?? ''}')`;
    } else {
        return `(${playerId}, ${game.gameId}, '${game.teamAbbrev ?? ''}', '${game.homeRoadFlag ?? ''}', '${game.gameDate ?? ''}', ${game.goals ?? 0}, ${game.assists ?? 0}, '${game.commonName.default ?? ''}', '${game.opponentCommonName.default ?? ''}', ${game.points ?? 0}, ${game.plusMinus ?? 0}, ${game.powerPlayGoals ?? 0}, ${game.powerPlayPoints ?? 0}, ${game.gameWinningGoals ?? 0}, ${game.otGoals ?? 0}, ${game.shots ?? 0}, ${game.shifts ?? 0}, ${game.shorthandedGoals ?? 0}, ${game.shorthandedPoints ?? 0}, '${game.opponentAbbrev ?? ''}', ${game.pim ?? 0}, '${game.toi ?? ''}')`;
    }
}


export async function loadWeeklyMaterializedView() {
    const createString = createWeeklyStatMaterializedView();
    try {
        await query(createString);
    } catch (error) {
        console.error('Error creating season weeks materialized view:', error);
    }
}

export function close() {
    pool.end();
}

export default pool;