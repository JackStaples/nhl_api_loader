import pg from 'pg';
import config from './config.js';
import { setupSql, createPlayTypesViewQuery, createStatsMaterializedViewsQuery, insertGameLogQuery, insertGoalieGameLogQuery, createWeeklyStatMaterializedView } from './sql/scripts.js';
import { Play, PlayByPlayResponse, RosterSpot, Team } from './types/PlayByPlay.types.js';
import { GameLog, GameLogResponse, GoalieGameLog, isGoalieGameLog } from './types/GameLog.types.js';
import { Player } from './types/Player.types.js';

const pool = new pg.Pool(config);

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

export async function loadGameLogs(gameLogs: {
    gameLog: GameLogResponse,
    playerId: number,
    position: string
}[]) {
    if (!gameLogs || gameLogs.length === 0) return;

    const insertionStrings: string[] = [];
    const goalieInsertionStrings: string[] = [];
    for (const { gameLog, playerId, position } of gameLogs) {
        const { gameLog: games } = gameLog;
        if (!games || games.length === 0) continue;

        if (position === 'G') {
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
    return `(${player.playerId}, '${escapeStringForSQL(player.firstName.default)}', '${escapeStringForSQL(player.lastName.default)}', '${player.position}', '${player.heightInCentimeters ?? 0}', '${player.weightInKilograms ?? 0}', '${player.birthDate}', '${player.birthCountry}', '${player.shootsCatches}', '${player.draftDetails ? JSON.stringify(player.draftDetails) : '{}'}', '${player.headshot}', '${player.heroImage}')`;
}

export function createGameQuery(game: PlayByPlayResponse) {
    return `(${game.id}, ${game.season}, ${game.gameType}, ${game.limitedScoring},'${escapeStringForSQL(game.gameDate.toString())}','${escapeStringForSQL(game.venue.default)}','${escapeStringForSQL(game.venueLocation.default)}','${escapeStringForSQL(game.startTimeUTC.toString())}','${escapeStringForSQL(game.easternUTCOffset)}','${escapeStringForSQL(game.venueUTCOffset)}','${escapeStringForSQL(game.gameState)}','${escapeStringForSQL(game.gameScheduleState)}',${game.displayPeriod},${game.maxPeriods},${game.shootoutInUse},${game.otInUse},${game.regPeriods})`;
}

export function createTeamQuery(team: Team) {
    return `(${team.id}, '${team.name.default}', '${team.abbrev}', '${team.logo}', '${team.placeName?.default}')`;
}

export function createPlayQuery(play: Play, gameId: number) {
    return `(${gameId}, ${play.periodDescriptor.number}, '${play.timeInPeriod}', '${play.timeRemaining}', '${play.situationCode}', '${play.homeTeamDefendingSide}', ${play.typeCode}, '${play.typeDescKey}', ${play.sortOrder}, '${play.details ? JSON.stringify(play.details):'{}'}')`;
}

export function createRosterSpotQuery(rosterSpot: RosterSpot, gameId: number) {
    return `(${rosterSpot.teamId}, ${rosterSpot.playerId}, ${gameId}, '${rosterSpot.positionCode}')`;
}

export function close() {
    pool.end();
}

export default pool;