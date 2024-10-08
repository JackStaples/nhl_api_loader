import { fetchPlayByPlayData, fetchPlayerLandingData, fetchTeams, fetchTeamSchedule } from './api/api.js';
import { createGameQuery, createPlayerQuery, createPlayQuery, createRosterSpotQuery, createTeamQuery } from './db.js';
import { insertGameQuery, insertPlayerQuery, insertPlayQuery, insertSeasonQuery, insertTeamQuery, insterRosterSpotQuery } from './sql/scripts.js';
import { PlayByPlayResponse, RosterSpot, Team } from './types/PlayByPlay.types.js';

export default class QueryCreator {
    private gameQueries: string[] = [];
    private gameMap = new Set<number>();

    private playerQueries: string[] = [];
    private players: Set<number> = new Set();
    

    private teamMap: Map<number, boolean> = new Map();
    private teamQueries: string[] = [];

    private seasonQueries: string[] = [];

    private playsQueries: string[] = [];

    private rosterSpotQueries: string[] = [];

    public async createQueriesForSeason(season: number) {
        console.log(`Fetching data for season ${season}`);
        const teams = await fetchTeams();
        if (!teams) return;
        this.loadSeasonQuery(season);
        const seasonString = `${season}${season+1}`;

        for (const team of teams.data) {
            const { triCode } = team;
            const schedule = await fetchTeamSchedule(triCode, seasonString);
            if (!schedule) continue;

            for (const game of schedule.games) {
                if (game.gameType !== 2) continue;

                if (!this.gameMap.has(game.id)) {
                    this.gameMap.add(game.id);

                    await this.createQueriesForGame(game.id);
                }
            }
        }
        console.log(`Fetched data for season ${season}`);
    }

    private async createQueriesForGame(gameId: number) {
        const game = await fetchPlayByPlayData(gameId);
        if (!game) return;

        this.loadGameQueryForGame(game);
        const { rosterSpots } = game;
        await Promise.all([this.loadPlaysDataForGame(game), 
            this.loadPlayerQueriesForGame(rosterSpots),
            this.loadRosterSpotsForGame(rosterSpots, game.id)
        ]);
        this.loadTeamQueryForGame(game.homeTeam);
        this.loadTeamQueryForGame(game.awayTeam);
    }

    private async loadRosterSpotsForGame(rosterSpots: RosterSpot[], gameId: number) {
        if (!rosterSpots || rosterSpots.length === 0) return;
        await Promise.all(rosterSpots.map(async (rosterSpot) => 
            this.rosterSpotQueries.push(createRosterSpotQuery(rosterSpot, gameId))
        ));
    }

    private async loadPlayerQueriesForGame(rosterSpots: RosterSpot[]) {
        await Promise.all(rosterSpots.map(async (rosterSpot) => {
            if (rosterSpot.playerId === 0) {
                console.log('Error loading player data', rosterSpot);
                return;
            }
            if (this.players.has(rosterSpot.playerId)) return;
            this.players.add(rosterSpot.playerId);
            
            const player = await fetchPlayerLandingData(rosterSpot.playerId);
            if (!player) {
                console.log('Error fetching player data', rosterSpot.playerId);
                return;
            }

            this.playerQueries.push(createPlayerQuery(player));
        }));
    }

    private async loadPlaysDataForGame(game: PlayByPlayResponse) {
        const { plays } = game;
        if (!plays || plays.length === 0) return;

        await Promise.all(plays.map(async (play) => 
            this.playsQueries.push(createPlayQuery(play, game.id))
        ));
    }

    private loadSeasonQuery(season: number) {
        this.seasonQueries.push(`(${season}),`);
    }

    private loadTeamQueryForGame(team: Team) {
        if (this.teamMap.has(team.id)) return;
        this.teamMap.set(team.id, true);    
        
        this.teamQueries.push(createTeamQuery(team));
    }

    private loadGameQueryForGame(game: PlayByPlayResponse) {
        this.gameQueries.push(createGameQuery(game));
    }

    public getLoadGameQuery() {
        return insertGameQuery.replace('$insert', this.gameQueries.join(','));
    }

    public resetGameQueries() {
        this.gameQueries = [];
        this.gameMap = new Set();
    }

    public getLoadPlayerQuery() {
        return insertPlayerQuery.replace('$insert', this.playerQueries.join(','));
    }

    public getLoadTeamQuery() {
        return insertTeamQuery.replace('$insert', this.teamQueries.join(','));
    }

    public getLoadSeasonQuery() {
        return insertSeasonQuery.replace('$insert', this.seasonQueries.join(','));
    }

    public getLoadPlaysQuery() {
        return insertPlayQuery.replace('$insert', this.playsQueries.join(','));
    }

    public resetPlaysQueries() {
        this.playsQueries = [];
    }

    public getLoadRosterSpotQuery() {
        return insterRosterSpotQuery.replace('$insert', this.rosterSpotQueries.join(','));
    }

    public resetRosterSpotQueries() {
        this.rosterSpotQueries = [];
    }

    public getPlayers() {
        return Array.from(this.players);
    }

}