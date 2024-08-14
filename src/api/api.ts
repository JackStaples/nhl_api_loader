import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { PlayByPlayResponse } from '../types/PlayByPlay.types.js';
import { TeamsResponse } from '../types/Teams.types.js';
import { ScheduleResponse } from '../types/Schedule.types.js';
import { GameLogResponse } from '../types/GameLog.types.js';
import { Player } from '../types/Player.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheDir = path.resolve(__dirname, '../../cache'); // Adjust path as needed


export async function fetchPlayByPlayData(game: number): Promise<PlayByPlayResponse | null> {
    // console.log(`Fetching play-by-play data for game ${game}`);
    
    // check if we have the data cached
    if (fs.existsSync(`${cacheDir}/${game}.json`)) {
        // console.log(`Found cached play-by-play data for game ${game}`);
        const data = fs.readFileSync(`./cache/${game}.json`, 'utf-8');
        
        // console.log(`Returning cached play-by-play data for game ${game}`);
        return JSON.parse(data) as PlayByPlayResponse;
    }
    
    // console.log(`No cached play-by-play data found for game ${game}, fetching from API`);
    const url = `https://api-web.nhle.com/v1/gamecenter/${game}/play-by-play`;
    try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (data) {
            // console.log(`Fetched play-by-play data for game ${game}`);
            // if we have data write it to the cache folder
            // console.log(`Writing play-by-play data to cache for game ${game}`);
            fs.writeFileSync(`${cacheDir}/${game}.json`, JSON.stringify(data, null, 2));

            return data as PlayByPlayResponse;
        }
  
    } catch (error) {
        // console.error('Error fetching data:', error);
    }
  
    return null;
}

export async function fetchTeams(): Promise<TeamsResponse | null> {
    // console.log('Fetching team data');
    
    // check if we have the data cached
    if (fs.existsSync(`${cacheDir}/teams.json`)) {
        // console.log('Found cached team data');
        const data = fs.readFileSync(`${cacheDir}/teams.json`, 'utf-8');
        
        // console.log('Returning cached team data');
        return JSON.parse(data) as TeamsResponse;
    }
    
    // console.log('No cached team data found, fetching from API');
    const url = 'https://api.nhle.com/stats/rest/en/team';
    try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (data) {
            // console.log('Fetched team data');
            // if we have data write it to the cache folder
            // console.log('Writing team data to cache');
            fs.writeFileSync(`${cacheDir}/teams.json`, JSON.stringify(data, null, 2));

            return data as TeamsResponse;
        }
  
    } catch (error) {
        // console.error('Error fetching data:', error);
    }
  
    return null;
}

export async function fetchTeamSchedule(triCode: string, season: string): Promise<ScheduleResponse | null> {
    // check if we have the data cached
    if (fs.existsSync(`${cacheDir}/${triCode}-${season}.json`)) {
        // console.log(`Found cached schedule data for team ${triCode} season ${season}`);
        const data = fs.readFileSync(`${cacheDir}/${triCode}-${season}.json`, 'utf-8');
        
        // console.log(`Returning cached schedule data for team ${triCode} season ${season}`);
        return JSON.parse(data);
    }

    const url = `https://api-web.nhle.com/v1/club-schedule-season/${triCode}/${season}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync(`${cacheDir}/${triCode}-${season}.json`, JSON.stringify(data, null, 2));
  
        if (data) {
            return data as ScheduleResponse;
        }
    } catch (error) {
        // console.error('Error fetching data:', error);
    }

    return null;
}

export async function fetchGameLogForPlayer(playerId: number, season: number): Promise<GameLogResponse | null> {
    // check if we have the data cached
    if (fs.existsSync(`${cacheDir}/${playerId}-${season}.json`)) {
        // console.log(`Found cached game log data for player ${playerId} season ${season}`);
        const data = fs.readFileSync(`${cacheDir}/${playerId}-${season}.json`, 'utf-8');
        
        // console.log(`Returning cached game log data for player ${playerId} season ${season}`);
        return JSON.parse(data);
    }

    const url = `https://api-web.nhle.com/v1/player/${playerId}/game-log/${season}/2`;
    try {
        const response = await fetch(url);
        let data;
        try {
            data = await response.json();
        } catch (error) {}
        
        if (data) {
            fs.writeFileSync(`${cacheDir}/${playerId}-${season}.json`, JSON.stringify(data, null, 2));
            return data as GameLogResponse;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    return null;
}

export async function fetchPlayerLandingData(playerId: number): Promise<Player | null> {
    const url = `https://api-web.nhle.com/v1/player/${playerId}/landing`;

    if (fs.existsSync(`${cacheDir}/${playerId}-landing.json`)) {
        // console.log(`Found cached player landing data for player ${playerId}`);
        const data = fs.readFileSync(`${cacheDir}/${playerId}-landing.json`, 'utf-8');
        
        // console.log(`Returning cached player landing data for player ${playerId}`);
        return JSON.parse(data);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync(`${cacheDir}/${playerId}-landing.json`, JSON.stringify(data, null, 2));
  
        if (data) {
            return data as Player;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    return null;
}