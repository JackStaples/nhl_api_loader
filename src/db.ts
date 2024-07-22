import pg from 'pg';
import config from './config.js';
import { setupSql, insertGameQuery, getTeamByIdQuery, insertTeamQuery } from './sql/scripts.js';
import { PlayByPlayResponse, Team } from './types/PlayByPlay.types.js';

const pool = new pg.Pool(config);

export function query<T>(text: string, params?: T[]) {
    return pool.query(text, params);
}

/**
 * runs the database setup scripts found in ./sql/creation.sql
 */
export async function setupDatabase() {
    try {
        console.log('Setting up database');
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
    ];

    try {
        console.log(`Inserting game data for game ${game.id}`);
        await query(insertGameQuery, gameData);
        console.log(`Game data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting game data:', error);
    }
}

export async function loadTeamData(game: PlayByPlayResponse) {
    console.log(`Beginning to load team data for game ${game.id}`);
    const { awayTeam, homeTeam } = game;
    await insertTeam(awayTeam);
    await insertTeam(homeTeam);
}

async function entityDoesNotExistById(getQuery: string, id: number) {
    const res = await query(getQuery, [id]);
    return res.rows.length === 0;
}

async function insertTeam(team: Team) {
    if (await entityDoesNotExistById(getTeamByIdQuery, team.id)) {
        const teamData = [
            team.id,
            team.name.default,
            team.abbrev,
            team.logo,
            team.placeName?.default
        ];
        try {
            console.log(`Inserting team data for team ${team.id}`);
            await query(insertTeamQuery, teamData);
            console.log(`Team data inserted for team ${team.id}`);
        } catch (error) {
            console.error('Error inserting team data:', error);
        }
    }
}

export function close() {
    pool.end();
}

export default pool;