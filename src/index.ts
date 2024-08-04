import { close, loadPlaysData, loadGameData, loadPersonData, loadSeasonData, loadTeamData, setupDatabase, loadRosterSpots, createPlayTypesView, createStatsMaterializedViews, loadGameLogForPlayerMap } from './db.js';
import { fetchPlayByPlayData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { PlayByPlayResponse } from './types/PlayByPlay.types.js';

// const seasons = ['2020', '2021', '2022', '2023', '2024'];
const seasons = [2022, 2023];

async function loadGame(game: PlayByPlayResponse) {
    await loadGameData(game);
    await loadTeamData(game);
    await loadSeasonData(game.season.toString());
    await loadPersonData(game);
    await loadPlaysData(game);
    await loadRosterSpots(game);
}

async function loadDatabase() {
    await setupDatabase();

    const teams = await fetchTeams();
    if (!teams) return;

    for (const season of seasons) {
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
        let gameQuerys = [];
        for (const gameId of gameMap.keys()) {
            gameQuerys.push(fetchAndLoadGame(i, gameMap, gameId));
            if (gameQuerys.length > 7) {
                await Promise.all(gameQuerys);
                gameQuerys = [];
            }
            i++;
        }

        console.log('begin loading player map');
        await loadGameLogForPlayerMap(seasons);
        console.log('end loading player map');
    }
    
    await createPlayTypesView();
    await createStatsMaterializedViews();
    console.log('Complete load, closing database connection');
    close();
}

console.log('Beginning of run');

loadDatabase();

console.log('End of run');

async function fetchAndLoadGame(i: number, gameMap: Map<number, boolean>, gameId: number) {
    console.log(`Loading data for game ${i} of ${gameMap.size}`);
    const game = await fetchPlayByPlayData(String(gameId));
    if (game) await loadGame(game);
    console.log(`Loaded data for game ${i} of ${gameMap.size}`);
}
