import type { PlayByPlayResponse } from "../types/PlayByPlay.types.js";

export async function fetchPlayByPlayData(game: string): Promise<PlayByPlayResponse | null> {
    console.log(`Fetching play-by-play data for game ${game}`);
    const url = `https://api-web.nhle.com/v1/gamecenter/${game}/play-by-play`;

    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data) {
        console.log(`Fetched play-by-play data for game ${game}`);
        return data as PlayByPlayResponse;
      }
  
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  
    return null;
  }
