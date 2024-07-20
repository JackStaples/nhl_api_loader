// import fetch from 'node-fetch';
// import { PlayByPlayResponse } from './types/PlayByPlay.types';
import { setupDatabase } from './db';

// async function fetchData(url: string): Promise<PlayByPlayResponse | null> {
//   try {
//     const response = await fetch(url);
//     const data = await response.json();

//     return data;
//   } catch (error) {
//     console.error('Error fetching data:', error);
//   }

//   return null;
// }
console.log("starting")

setupDatabase();

// // Use top-level await to call the fetchData function
// const res = await fetchData('https://api-web.nhle.com/v1/gamecenter/2023020204/play-by-play');
// if (res) {
//   console.log(res);
// }
