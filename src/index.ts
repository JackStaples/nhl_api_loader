import { close, setupDatabase, createPlayTypesView, createStatsMaterializedViews, loadWeeklyMaterializedView, loadGameLogs } from './db.js';
import { fetchGameLogForPlayer, fetchPlayerLandingData, fetchTeams } from './api/api.js';
import { exit } from 'process';
import { GameLogResponse } from './types/GameLog.types.js';
import QueryCreator from './QueryCreator.js';
import QueryRunner from './QueryRunner.js';

// before 2009 play by play data is not available, so blocked shots and hits are not available
const seasons = [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const queryCreator = new QueryCreator();

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
        await queryCreator.createQueriesForSeason(season);
        await QueryRunner.loadSeasonalQueries(queryCreator);
    }

    await QueryRunner.loadFullRunQueries(queryCreator);

    console.log('begin loading player game logs data');
    await loadPlayerData(queryCreator.getPlayers());

    console.log('Creating views');
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
        position: string
    }[] = [];
    
    await Promise.all(playerIds.map(async (playerId) => {
        const player = await fetchPlayerLandingData(playerId);
        if (!player) return;

        const position = player.position;

        const { seasonTotals } = player;
        const seenSeasons = new Set();
        for (const seasonTotal of seasonTotals) {
            if (seenSeasons.has(seasonTotal.season)) continue;
            seenSeasons.add(seasonTotal.season);

            if (seasonTotal.leagueAbbrev !== 'NHL') continue;

            const { season } = seasonTotal;

            const seasonStart = parseInt(season.toString().slice(0, 4));
            const gameLog = await fetchGameLogForPlayer(playerId, seasonStart);
            if (!gameLog) continue;
            
            gamelogs.push({gameLog, playerId, position});
        }
    }));

    await loadGameLogs(gamelogs);
}

