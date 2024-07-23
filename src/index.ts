import { close, loadGameData, loadPersonData, loadSeasonData, loadTeamData, setupDatabase } from './db.js';
import { fetchPlayByPlayData } from './api/api.js';


async function loadDatabase() {
    setupDatabase();
    const res = await fetchPlayByPlayData('2023020204');  
    if (res) {
        await loadGameData(res);
        await loadTeamData(res);
        await loadSeasonData(res.season.toString());
        await loadPersonData(res);

        console.log('Complete load, closing database connection');
        close();
    }
}

console.log('Beginning of run');

loadDatabase();

console.log('End of run');