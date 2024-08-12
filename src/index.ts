import { close, loadPlaysData, loadSeasonData, setupDatabase, loadRosterSpots, createPlayTypesView, createStatsMaterializedViews, loadWeeklyMaterializedView, getPersonMap, loadGameLogs } from './db.js';
import { fetchGameLogForPlayer, fetchPlayByPlayData, fetchPlayerLandingData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { PlayByPlayResponse } from './types/PlayByPlay.types.js';
import { exit } from 'process';
import { GameLogResponse } from './types/GameLog.types.js';
import QueryCreator from './QueryCreator.js';

const seasons = [2023];
const queryCreator = new QueryCreator();
// const seasons = [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

async function loadInitialGameData(game: PlayByPlayResponse) {
    // console.log(`Loading initial data for game ${game.id}`);
    await loadSeasonData(game.season);
    // console.log(`Loaded initial data for game ${game.id}`);
}

async function loadDependantData(game: PlayByPlayResponse) {
    await loadPlaysData(game);
    await loadRosterSpots(game);
}

async function loadGame(game: PlayByPlayResponse) {
    await loadInitialGameData(game);
    await loadDependantData(game);
}

async function loadDatabase() {
    try {
        await setupDatabase();
    } catch (error) {
        console.error('Error setting up database:', error);
        exit(1);
    }

    const teams = await fetchTeams();
    if (!teams) return;

    queryCreator.createQueriesForSeasons(seasons);
    for (const season of seasons) {
        console.log(`Loading data for season ${season}`);

        const gameMap = new Map<number, boolean>();

        for (const team of teams.data) {
            const { triCode } = team;
            const seasonString = `${season}${season+1}`;
            const schedule = await fetchTeamSchedule(triCode, seasonString);
            if (!schedule) continue;
            for (const game of schedule.games) {
                if (game.gameType !== 2) continue;
                gameMap.set(game.id, true);
            }
        }

        let i = 1;
        for (const gameId of gameMap.keys()) {
            await fetchAndLoadGame(i++, gameMap, gameId);
        }
        console.log(`Loaded data for season ${season}`);
    }

    console.log('begin loading player map');
    const personMap = getPersonMap();
    await loadPlayerData(Array.from(personMap.keys()));
    console.log('end loading player map');

    await createPlayTypesView();
    await createStatsMaterializedViews();
    await loadWeeklyMaterializedView();

    console.log('Complete load, closing database connection');
    close();
}

console.log('Beginning of run');

loadDatabase();

console.log('End of run');

async function fetchAndLoadGame(i: number, gameMap: Map<number, boolean>, gameId: number) {
    // console.log(`Loading data for game ${i} of ${gameMap.size}`);
    const game = await fetchPlayByPlayData(gameId);
    if (game) await loadGame(game);
    // console.log(`Loaded data for game ${i} of ${gameMap.size}, ${Math.floor(i / gameMap.size * 100)}% complete`);
}

async function loadPlayerData(playerIds: number[]) {
    const gamelogs: {
        gameLog: GameLogResponse,
        playerId: number,
    }[] = [];
    for (const playerId of playerIds) {
        const player = await fetchPlayerLandingData(playerId);
        if (!player) return;

        const { seasonTotals } = player;
        for (const seasonTotal of seasonTotals) {
            const { season } = seasonTotal;
            const gameLog = await fetchGameLogForPlayer(playerId, season);
            if (!gameLog) continue;
            gamelogs.push({gameLog, playerId});
        }
    }
    await loadGameLogs(gamelogs);
}

