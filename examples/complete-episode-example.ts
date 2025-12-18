/**
 * Complete Example: Fetching Anime with Episodes, Seasons, and Torrents
 * 
 * This example demonstrates:
 * - Searching for anime
 * - Fetching complete episode information
 * - Organizing episodes into seasons
 * - Indexing torrents and associating with episodes
 * - Getting torrent recommendations per episode
 */

import { MiauIndex } from '../src/MiauIndex';
import { TorrentQuality } from '../src/models/Torrent';

async function main() {
  // Initialize MiauIndex with Nyaa extension enabled
  const miauIndex = new MiauIndex({
    enableLogging: true,
    enableNyaa: true,
    nyaaOptions: {
      minSeeders: 5,
      trustedOnly: false,
      preferredQuality: TorrentQuality.FULL_HD_1080p,
    },
  });

  console.log('🔍 Searching for anime: "Steins Gate"...\n');

  // Search for anime
  const results = await miauIndex.searchAnime('Steins Gate');
  
  if (results.length === 0) {
    console.log('No results found!');
    return;
  }

  const anime = results[0];
  console.log(`✅ Found: ${anime.title.romaji || anime.title.english}`);
  console.log(`   Type: ${anime.type}`);
  console.log(`   Episodes: ${anime.episodes || 'Unknown'}`);
  console.log(`   Year: ${anime.year || 'Unknown'}`);
  console.log(`   Status: ${anime.status}\n`);

  // Fetch complete episode information
  console.log('📺 Fetching episode information...\n');
  
  const completeData = await miauIndex.getAnimeWithEpisodes(anime.id);
  const { anime: animeData, episodes, seasons } = completeData;

  console.log(`✅ Found ${episodes.length} episodes`);
  
  // Display first 5 episodes
  console.log('\n📋 First 5 Episodes:');
  episodes.slice(0, 5).forEach((ep) => {
    console.log(`   ${ep.number}. ${ep.title || 'Episode ' + ep.number}`);
    if (ep.synopsis) {
      console.log(`      ${ep.synopsis.substring(0, 80)}...`);
    }
    if (ep.aired) {
      console.log(`      Aired: ${ep.aired.toLocaleDateString()}`);
    }
    if (ep.duration) {
      console.log(`      Duration: ${ep.duration} min`);
    }
  });

  // Display season information
  if (seasons && seasons.length > 0) {
    console.log(`\n🎬 Organized into ${seasons.length} season(s):`);
    seasons.forEach((season) => {
      console.log(`   Season ${season.seasonNumber}: ${season.episodeCount} episodes`);
      if (season.title) {
        console.log(`      ${season.title}`);
      }
    });
  }

  // Index torrents for the anime
  console.log('\n🌸 Indexing torrents from Nyaa...\n');
  
  const torrents = await miauIndex.indexTorrents(anime);
  console.log(`✅ Found ${torrents.length} torrents`);

  // Associate torrents with episodes
  const associated = await miauIndex.associateTorrentsWithEpisodes(anime.id);
  console.log(`✅ Associated ${associated} torrents with episodes\n`);

  // Get torrent recommendations for specific episode
  const episodeNumber = 1;
  console.log(`\n🎯 Best torrent for Episode ${episodeNumber}:`);
  
  const bestTorrent = await miauIndex.getBestTorrent(anime, episodeNumber);
  
  if (bestTorrent) {
    console.log(`   Title: ${bestTorrent.title}`);
    console.log(`   Quality: ${bestTorrent.metadata.quality}`);
    console.log(`   Size: ${bestTorrent.size}`);
    console.log(`   Seeders: ${bestTorrent.seeders}`);
    console.log(`   Audio: ${bestTorrent.metadata.audioLanguages.join(', ')}`);
    console.log(`   Subtitles: ${bestTorrent.metadata.subtitleLanguages.join(', ')}`);
    if (bestTorrent.metadata.releaseGroup) {
      console.log(`   Release Group: ${bestTorrent.metadata.releaseGroup}`);
    }
  } else {
    console.log('   No torrent found for this episode');
  }

  // Display torrents by quality
  console.log('\n📊 Torrents by Quality:');
  
  const qualities = [
    TorrentQuality.UHD_4K,
    TorrentQuality.FULL_HD_1080p,
    TorrentQuality.HD_720p,
    TorrentQuality.SD_480p,
  ];

  for (const quality of qualities) {
    const qualityTorrents = await miauIndex.getTorrentsByQuality(anime.id, quality);
    if (qualityTorrents.length > 0) {
      console.log(`   ${quality}: ${qualityTorrents.length} torrents`);
    }
  }

  // Get statistics
  console.log('\n📈 Torrent Statistics:');
  const stats = await miauIndex.getTorrentStats(anime.id);
  console.log(`   Total: ${stats.totalTorrents}`);
  console.log(`   Average Seeders: ${stats.averageSeeders}`);
  console.log(`   Total Size: ${(stats.totalSize / (1024 ** 3)).toFixed(2)} GB`);

  // Display episode-torrent mapping for first 3 episodes
  console.log('\n🔗 Episode-Torrent Mapping (First 3 Episodes):');
  for (let i = 1; i <= Math.min(3, episodes.length); i++) {
    const episode = episodes.find((ep) => ep.number === i);
    if (!episode) continue;

    const episodeTorrents = torrents.filter(
      (t) =>
        t.episodeNumber === i ||
        (t.episodeRange && t.episodeRange.start <= i && t.episodeRange.end >= i)
    );

    console.log(`\n   Episode ${i}: ${episode.title || 'Episode ' + i}`);
    console.log(`   Available torrents: ${episodeTorrents.length}`);
    
    if (episodeTorrents.length > 0) {
      const best = episodeTorrents.sort((a, b) => b.seeders - a.seeders)[0];
      console.log(`   Best: ${best.metadata.quality} - ${best.seeders} seeders`);
    }
  }

  console.log('\n✨ Complete! All data fetched and associated successfully.');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
