import pg from 'pg';
import config from './config.js';
import { setupSql, insertGameQuery, insertTeamQuery, insertPersonQuery, insertPersonPositionQuery, insertSeasonQuery, insertPlayQuery, insertPeriodQuery } from './sql/scripts.js';
import { Person, Play, PlayByPlayResponse, Team } from './types/PlayByPlay.types.js';

const pool = new pg.Pool(config);

const teamMap: Map<number, boolean> = new Map();
const personMap: Map<number, boolean> = new Map();
const personPositionMap: Map<number, Map<string, boolean>> = new Map();
const seasonMap: Map<string, boolean> = new Map();
const periodMap: Map<number, boolean> = new Map();

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
    const insertString = getInsertGameString(game);
    const query = insertGameQuery.replace('$insert', insertString);

    try {
        console.log(`Inserting game data for game ${game.id}`);
        console.log(query);
        await pool.query(query);
        console.log(`Game data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting game data:', error);
    }
}

function getInsertGameString(game: PlayByPlayResponse) {
    return `${game.id}, ${game.season}, ${game.gameType}, ${game.limitedScoring}, '${game.gameDate}', '${game.venue.default}', '${game.venueLocation.default}', '${game.startTimeUTC}', '${game.easternUTCOffset}', '${game.venueUTCOffset}', '${game.gameState}', '${game.gameScheduleState}', ${game.displayPeriod}, ${game.maxPeriods}, ${game.shootoutInUse}, ${game.otInUse}, ${game.regPeriods}`;
}

export async function loadTeamData(game: PlayByPlayResponse) {
    console.log(`Beginning to load team data for game ${game.id}`);
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
            console.log(`Inserting team data for team ${team.id}`);
            await query(insertTeamQuery, teamData);
            console.log(`Team data inserted for team ${team.id}`);
            teamMap.set(team.id, true);
        } catch (error) {
            console.error('Error inserting team data:', error);
        }
    }
}

export async function loadSeasonData(season: string) {
    if (
        !seasonMap.has(season)
    ) {
        const seasonData = [
            season
        ];
        try {
            console.log(`Inserting season data for season ${season}`);
            await query(insertSeasonQuery, seasonData);
            console.log(`Season data inserted for season ${season}`);
            seasonMap.set(season, true);
        } catch (error) {
            console.error('Error inserting season data:', error);
        }
    }
}


export async function loadPersonData(game: PlayByPlayResponse) {
    const { rosterSpots } = game;
    for (const spot of rosterSpots) {
        await insertPerson({
            id: spot.playerId,
            firstName: spot.firstName,
            lastName: spot.lastName
        });
        await insertPersonPosition(spot.playerId, spot.positionCode, game.season.toString());
    }
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
            console.log(`Inserting person data for person ${person.id}`);
            await query(insertPersonQuery, personData);
            console.log(`Person data inserted for person ${person.id}`);
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
            console.log(`Inserting person position data for person ${personId}`);
            await query(insertPersonPositionQuery, personPositionData);
            console.log(`Person position data inserted for person ${personId}`);
            personPositionMap.get(personId)?.set(position, true);
        } catch (error) {
            console.error('Error inserting person position data:', error);
        }
    }

}

export async function loadPlaysData(game: PlayByPlayResponse) {
    const { plays } = game;
    const insertionStrings: string[] = [];
    for (const play of plays ) {
        await insertPeriod(play);
        insertionStrings.push(getInsertPlayString(play, game.id));
    }
    const insertString = insertionStrings.join(',\n');
    const query = insertPlayQuery.replace('$insert', insertString);
    console.log(query);
    try {
        console.log(`Inserting play data for game ${game.id}`);
        await pool.query(query);
        console.log(`Play data inserted for game ${game.id}`);
    } catch (error) {
        console.error('Error inserting play data:', error);
    }
}

async function insertPeriod(play: Play) {
    if (!periodMap.has(play.periodDescriptor.number)) {
        const periodData = [
            play.periodDescriptor.number,
            play.periodDescriptor.periodType
        ];
        try {
            console.log(`Inserting period data for period ${play.periodDescriptor.number}`);
            await query(insertPeriodQuery, periodData);
            console.log(`Period data inserted for period ${play.periodDescriptor.number}`);
            periodMap.set(play.periodDescriptor.number, true);
        } catch (error) {
            console.error('Error inserting period data:', error);
        }
    }
}

function getInsertPlayString(play: Play, gameId: number) {
    return `(${play.eventId}, ${gameId}, ${play.periodDescriptor.number}, '${play.timeInPeriod}', '${play.timeRemaining}', '${play.situationCode}', '${play.homeTeamDefendingSide}', ${play.typeCode}, '${play.typeDescKey}', ${play.sortOrder}, '${play.details ? JSON.stringify(play.details):'{}'}')`;
}

export function close() {
    pool.end();
}

export default pool;