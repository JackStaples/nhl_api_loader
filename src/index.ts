import { setupDatabase } from './db.js';
import { fetchPlayByPlayData } from './api/api.js';


async function loadDatabase() {
    setupDatabase();
    const res = await fetchPlayByPlayData('2023020204');  
}

console.log("starting")

loadDatabase();