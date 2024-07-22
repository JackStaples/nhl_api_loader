import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { PlayByPlayResponse } from '../types/PlayByPlay.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheDir = path.resolve(__dirname, '../../cache'); // Adjust path as needed


export async function fetchPlayByPlayData(game: string): Promise<PlayByPlayResponse | null> {
    console.log(`Fetching play-by-play data for game ${game}`);
    
    // check if we have the data cached
    if (fs.existsSync(`${cacheDir}/${game}.json`)) {
        console.log(`Found cached play-by-play data for game ${game}`);
        const data = fs.readFileSync(`./cache/${game}.json`, 'utf-8');
        
        console.log(`Returning cached play-by-play data for game ${game}`);
        return JSON.parse(data) as PlayByPlayResponse;
    }
    
    console.log(`No cached play-by-play data found for game ${game}, fetching from API`);
    const url = `https://api-web.nhle.com/v1/gamecenter/${game}/play-by-play`;
    try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (data) {
            console.log(`Fetched play-by-play data for game ${game}`);
            // if we have data write it to the cache folder
            console.log(`Writing play-by-play data to cache for game ${game}`);
            fs.writeFileSync(`${cacheDir}/${game}.json`, JSON.stringify(data, null, 2));

            return data as PlayByPlayResponse;
        }
  
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  
    return null;
}
