// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { close, loadPlaysData, loadGameData, loadPersonData, loadSeasonData, loadTeamData, setupDatabase, loadRosterSpots, createPlayTypesView, createStatsMaterializedViews } from './db.js';
import { fetchPlayByPlayData, fetchTeams } from './api/api.js';
import { PlayByPlayResponse } from './types/PlayByPlay.types.js';

// const seasons = ['2020', '2021', '2022', '2023', '2024'];
const seasons = ['2023'];

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
        const res = await fetchPlayByPlayData(`${season}020201`);  
        if (res) await loadGame(res);
    }
    
    await createPlayTypesView();
    await createStatsMaterializedViews();
    console.log('Complete load, closing database connection');
    close();
}

console.log('Beginning of run');

loadDatabase();

console.log('End of run');