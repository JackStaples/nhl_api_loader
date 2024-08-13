import { close, setupDatabase, createPlayTypesView, createStatsMaterializedViews, loadWeeklyMaterializedView, getPersonMap, loadGameLogs } from './db.js';
import { fetchGameLogForPlayer, fetchPlayerLandingData, fetchTeams } from './api/api.js';
import { exit } from 'process';
import { GameLogResponse } from './types/GameLog.types.js';
import QueryCreator from './QueryCreator.js';
import QueryRunner from './QueryRunner.js';

const seasons = [2023];
const queryCreator = new QueryCreator();
// const seasons = [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

async function loadDatabase() {
    try {
        await setupDatabase();
    } catch (error) {
        console.error('Error setting up database:', error);
        exit(1);
    }

    const teams = await fetchTeams();
    if (!teams) return;

    await queryCreator.createQueriesForSeasons(seasons);
    await QueryRunner.runQueries(queryCreator);

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

