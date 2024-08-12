import { fetchPlayByPlayData, fetchPlayerLandingData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { createPlayerQuery } from './db.js';
import { insertPersonQuery } from './sql/scripts.js';
import { RosterSpot } from './types/PlayByPlay.types.js';

export default class QueryCreator {
    private playerQueries: string[] = [];
    private playerMap: Map<number, boolean> = new Map();

    public async fetchSeasonData(season: number) {
        console.log(`Fetching data for season ${season}`);
        const teams = await fetchTeams();
        if (!teams) return;

        const seasonString = `${season}${season+1}`;

        for (const team of teams.data) {
            const { triCode } = team;
            const schedule = await fetchTeamSchedule(triCode, seasonString);
            if (!schedule) continue;

            const gameMap = new Set<number>();
            for (const game of schedule.games) {
                if (game.gameType !== 2) continue;
                if (!gameMap.has(game.id)) gameMap.add(game.id);
            }

            for (const gameId of gameMap) {
                await this.createQueriesForGame(gameId);
            }  
        }

        console.log(`Fetched data for season ${season}`);
    }

    private async createQueriesForGame(gameId: number) {
        console.log(`Loading data for game ${gameId}`);

        const game = await fetchPlayByPlayData(gameId);
        if (!game) return;

        const { rosterSpots } = game;
        await this.createPlayerQueries(rosterSpots);

        console.log(`Loaded data for game ${gameId}`);
    }

    public async createPlayerQueries(rosterSpots: RosterSpot[]) {
        for (const rosterSpot of rosterSpots) {
            const { playerId } = rosterSpot;
            if (this.playerMap.has(playerId)) return;
            this.playerMap.set(playerId, true);
            
            const player = await fetchPlayerLandingData(playerId);
            if (!player) continue;

            this.playerQueries.push(createPlayerQuery(player));
        }
    }

    public getLoadPlayerQuery() {
        return insertPersonQuery.replace('$instert', this.playerQueries.join(','));
    }

}