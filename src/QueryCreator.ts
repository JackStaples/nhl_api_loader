import { fetchPlayByPlayData, fetchPlayerLandingData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { createGameQuery, createPlayerQuery, createTeamQuery } from './db.js';
import { insertGameQuery, insertPersonQuery, insertTeamQuery } from './sql/scripts.js';
import { PlayByPlayResponse, RosterSpot, Team } from './types/PlayByPlay.types.js';

export default class QueryCreator {
    private gameQueries: string[] = [];

    private playerQueries: string[] = [];
    private playerMap: Map<number, boolean> = new Map();
    

    private teamMap: Map<number, boolean> = new Map();
    private teamQueries: string[] = [];

    private seasonQueries: string[] = [];

    public async createQueriesForSeasons(seasons: number[]) {
        for (const season of seasons) {
            await this.createQueriesForSeason(season);
        }
    }

    public async createQueriesForSeason(season: number) {
        console.log(`Fetching data for season ${season}`);
        const teams = await fetchTeams();
        if (!teams) return;
        this.loadSeasonQuery(season);
        const seasonString = `${season}${season+1}`;

        const gameMap = new Set<number>();
        for (const team of teams.data) {
            const { triCode } = team;
            const schedule = await fetchTeamSchedule(triCode, seasonString);
            if (!schedule) continue;

            for (const game of schedule.games) {
                if (game.gameType !== 2) continue;
                if (!gameMap.has(game.id)) {
                    gameMap.add(game.id);
                    await this.createQueriesForGame(game.id);
                }
            }
        }
        console.log(`Fetched data for season ${season}`);
    }

    private async createQueriesForGame(gameId: number) {
        console.log(`Loading data for game ${gameId}`);

        const game = await fetchPlayByPlayData(gameId);
        if (!game) return;

        const { rosterSpots } = game;
        this.loadGameQueryForGame(game);
        await this.loadPlayerQueriesForGame(rosterSpots);
        this.loadTeamQueryForGame(game.homeTeam);
        this.loadTeamQueryForGame(game.awayTeam);

        console.log(`Loaded data for game ${gameId}`);
    }

    private loadSeasonQuery(season: number) {
        this.seasonQueries.push(`(${season}),`);
    }

    private loadTeamQueryForGame(team: Team) {
        if (this.teamMap.has(team.id)) return;
        this.teamQueries.push(createTeamQuery(team));
    }

    private loadGameQueryForGame(game: PlayByPlayResponse) {
        this.gameQueries.push(createGameQuery(game));
    }

    private async loadPlayerQueriesForGame(rosterSpots: RosterSpot[]) {
        for (const rosterSpot of rosterSpots) {
            const { playerId } = rosterSpot;
            if (this.playerMap.has(playerId)) return;
            this.playerMap.set(playerId, true);
            
            const player = await fetchPlayerLandingData(playerId);
            if (!player) continue;

            this.playerQueries.push(createPlayerQuery(player));
        }
    }

    public getLoadGameQuery() {
        return insertGameQuery.replace('$instert', this.gameQueries.join(','));
    }

    public getLoadPlayerQuery() {
        return insertPersonQuery.replace('$instert', this.playerQueries.join(','));
    }

    public getLoadTeamQuery() {
        return insertTeamQuery.replace('$instert', this.teamQueries.join(','));
    }

}