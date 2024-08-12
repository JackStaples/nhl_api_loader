import pg from 'pg';
import config from './config.js';
import { setupSql, insertSeasonQuery, insterRosterSpotQuery, createPlayTypesViewQuery, createStatsMaterializedViewsQuery, insertGameLogQuery, insertGoalieGameLogQuery, createWeeklyStatMaterializedView } from './sql/scripts.js';
import { Play, PlayByPlayResponse, Team } from './types/PlayByPlay.types.js';
import { GameLog, GameLogResponse, GoalieGameLog, isGoalieGameLog } from './types/GameLog.types.js';
import { exit } from 'process';
import { Player } from './types/Player.types.js';

const pool = new pg.Pool(config);

const personMap: Map<number, boolean> = new Map();
const personPositionMap: Map<number, Map<string, boolean>> = new Map();
const seasonMap: Map<number, boolean> = new Map();
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

function escapeStringForSQL(value: string): string {
    return value.replace(/'/g, '\'\'');
}

export function addPersonToMap(personId: number) {
    if (
        !personMap.has(personId)
    ) {
        personMap.set(personId, true);
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

export function getPersonMap() {
    return personMap;
}

export async function loadGameLog(gameLog: GameLogResponse, playerId: number) {
    const { gameLog: games } = gameLog;
    if (gameLogPlayerMap.has(`${playerId}-${gameLog.seasonId}`)) return;
    gameLogPlayerMap.set(`${playerId}-${gameLog.seasonId}`, true);

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

export async function loadGameLogs(gameLogs: {
    gameLog: GameLogResponse,
    playerId: number,
}[]) {
    if (!gameLogs || gameLogs.length === 0) return;

    const insertionStrings: string[] = [];
    const goalieInsertionStrings: string[] = [];
    for (const { gameLog, playerId } of gameLogs) {
        const { gameLog: games } = gameLog;
        if (!games || games.length === 0) return;

        if (personPositionMap.has(playerId) && personPositionMap.get(playerId)?.has('G')) {
            for (const game of games) {
                goalieInsertionStrings.push(createGameLogInsertString(game, playerId));
            }
            continue;
        }
        
        for (const game of games) {
            insertionStrings.push(createGameLogInsertString(game, playerId));
        }
    }

    const insertString = insertionStrings.join(',\n');
    const query = insertGameLogQuery.replace('$insert', insertString);
    const goalieQuery = insertGoalieGameLogQuery.replace('$insert', goalieInsertionStrings.join(',\n'));
    try {
        await pool.query(query);
        await pool.query(goalieQuery);
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

export function createPlayerQuery(player: Player) {
    return `${player.playerId}, '${player.firstName.default}', '${player.lastName.default}', '${player.position}', '${player.heightInCentimeters}', '${player.weightInKilograms}', '${player.birthDate}', '${player.birthCountry}', '${player.shootsCatches}', '${player.draftDetails}', ${player.headshot}, ${player.heroImage}`;
}

export function createGameQuery(game: PlayByPlayResponse) {
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

export function createTeamQuery(team: Team) {
    return `${team.id}, '${team.name.default}', '${team.abbrev}', '${team.logo}', '${team.placeName?.default}'`;
}

export function createPlayQuery(play: Play, gameId: number) {
    return `(${gameId}, ${play.periodDescriptor.number}, '${play.timeInPeriod}', '${play.timeRemaining}', '${play.situationCode}', '${play.homeTeamDefendingSide}', ${play.typeCode}, '${play.typeDescKey}', ${play.sortOrder}, '${play.details ? JSON.stringify(play.details):'{}'}')`;
}

export function close() {
    pool.end();
}

export default pool;