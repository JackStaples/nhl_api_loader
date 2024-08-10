import { close, loadPlaysData, loadGameData, loadPersonData, loadSeasonData, loadTeamData, setupDatabase, loadRosterSpots, createPlayTypesView, createStatsMaterializedViews, loadGameLogForPlayerMap, loadWeeklyMaterializedView } from './db.js';
import { fetchPlayByPlayData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { PlayByPlayResponse } from './types/PlayByPlay.types.js';
import { exit } from 'process';

// const seasons = [2009];
const seasons = [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

async function loadInitialGameData(game: PlayByPlayResponse) {
    // console.log(`Loading initial data for game ${game.id}`);
    await loadGameData(game);
    await loadTeamData(game);
    await loadSeasonData(game.season);
    await loadPersonData(game);
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
    await loadGameLogForPlayerMap(seasons);
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
    const game = await fetchPlayByPlayData(String(gameId));
    if (game) await loadGame(game);
    // console.log(`Loaded data for game ${i} of ${gameMap.size}, ${Math.floor(i / gameMap.size * 100)}% complete`);
}
