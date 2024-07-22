import pg from 'pg';
import config from './config.js';
import { setupSql, insertGameQuery } from './sql/setupSql.js';
import { PlayByPlayResponse } from './types/PlayByPlay.types.js';

const pool = new pg.Pool(config);

export function query(text: string, params?: any[]) {
    return pool.query(text, params);
};

/**
 * runs the database setup scripts found in ./sql/creation.sql
 */
export async function setupDatabase() {
    try {
        await query(setupSql);
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

export async function loadGameData(game: PlayByPlayResponse) {
    console.log(`Beginning to load game data for game ${game.id}`);
    const gameData = [
        game.id,
        game.season,
        game.gameType,
        game.limitedScoring,
        game.gameDate,
        game.venue.default,
        game.venueLocation.default,
        game.startTimeUTC,
        game.easternUTCOffset,
        game.venueUTCOffset,
        game.gameState,
        game.gameScheduleState,
        game.displayPeriod,
        game.maxPeriods,
        game.shootoutInUse,
        game.otInUse,
        game.regPeriods
    ]

    try {
        console.log(`Inserting game data for game ${game.id}`);
        await query(insertGameQuery, gameData);
        console.log(`Game data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting game data:', error);
    }
}


export default pool;