import fetch from 'node-fetch';

async function fetchData(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Use top-level await to call the fetchData function
await fetchData('https://api-web.nhle.com/v1/gamecenter/2023020204/play-by-play');
