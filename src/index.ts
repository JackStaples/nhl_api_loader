// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { close, loadPlaysData, loadGameData, loadPersonData, loadSeasonData, loadTeamData, setupDatabase, loadRosterSpots } from './db.js';
import { fetchPlayByPlayData } from './api/api.js';


async function loadDatabase() {
    await setupDatabase();
    const res = await fetchPlayByPlayData('2023020201');  
    if (res) {
        await loadGameData(res);
        await loadTeamData(res);
        await loadSeasonData(res.season.toString());
        await loadPersonData(res);
        await loadPlaysData(res);
        await loadRosterSpots(res);

        console.log('Complete load, closing database connection');
        close();
    }
}

console.log('Beginning of run');

loadDatabase();

console.log('End of run');