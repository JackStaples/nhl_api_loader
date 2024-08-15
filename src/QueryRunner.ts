import { query } from './db.js';
import QueryCreator from './QueryCreator.js';
import fs from 'fs';

export default class QueryRunner {
    static async loadSeasonalQueries(queryCreator: QueryCreator) {

        try {
            console.log('Loading game data');
            const gameQuery = queryCreator.getLoadGameQuery();
            queryCreator.resetGameQueries();
            await query(gameQuery);
        } catch (error) {
            fs.writeFileSync('gameQuery.sql', queryCreator.getLoadGameQuery());
            console.error('Error loading game data', error);
        }

        try {
            console.log('Loading play data');
            const playQuery = queryCreator.getLoadPlaysQuery();
            queryCreator.resetPlaysQueries();
            await query(playQuery);
        } catch (error) {
            fs.writeFileSync('playQuery.sql', queryCreator.getLoadPlaysQuery());
            console.error('Error loading play data', error);
        }

        try {
            console.log('Loading roster spot data');
            const rosterSpotQuery = queryCreator.getLoadRosterSpotQuery();
            queryCreator.resetRosterSpotQueries();
            await query(rosterSpotQuery);
        } catch (error) {
            fs.writeFileSync('rosterSpotQuery.sql', queryCreator.getLoadRosterSpotQuery());
            console.error('Error loading roster spot data', error);
        }
        
    }

    static async loadFullRunQueries(queryCreator: QueryCreator) {
        try {
            console.log('Loading player data');
            const playerQuery = queryCreator.getLoadPlayerQuery();
            await query(playerQuery);
        } catch (error) {
            fs.writeFileSync('playerQuery.sql', queryCreator.getLoadPlayerQuery());
            console.error('Error loading player data', error);
        }

        try {
            console.log('Loading team data');
            const teamQuery = queryCreator.getLoadTeamQuery();
            await query(teamQuery);
        } catch (error) {
            fs.writeFileSync('teamQuery.sql', queryCreator.getLoadTeamQuery());
            console.error('Error loading team data', error);
        }
    }
}