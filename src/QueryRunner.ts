import { query } from './db.js';
import QueryCreator from './QueryCreator.js';

export default class QueryRunner {
    static async runQueries(queryCreator: QueryCreator) {
        try {
            const gameQuery = queryCreator.getLoadGameQuery();
            await query(gameQuery);
        } catch (error) {
            console.error('Error loading game data', error);
        }

        try {
            const playerQuery = queryCreator.getLoadPlayerQuery();
            await query(playerQuery);
        } catch (error) {
            console.error('Error loading player data', error);
        }

        try {
            const teamQuery = queryCreator.getLoadTeamQuery();
            await query(teamQuery);
        } catch (error) {
            console.error('Error loading team data', error);
        }

        try {
            const playQuery = queryCreator.getLoadPlaysQuery();
            await query(playQuery);
        } catch (error) {
            console.error('Error loading play data', error);
        }

        try {
            const rosterSpotQuery = queryCreator.getLoadRosterSpotQuery();
            await query(rosterSpotQuery);
        } catch (error) {
            console.error('Error loading roster spot data', error);
        }
    }
}