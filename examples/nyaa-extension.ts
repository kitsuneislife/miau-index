/**
 * Example: Using Nyaa Torrent Extension
 *
 * This example shows how to use the optional Nyaa extension to index and search
 * anime torrents from Nyaa.si
 */

import { MiauIndex } from '../src/MiauIndex';
import { DataSource } from '../src/types/common';
import { TorrentQuality, TorrentLanguage, Torrent } from '../src/models/Torrent';

async function nyaaExample() {
  // Initialize MiauIndex with Nyaa extension enabled
  const miauIndex = new MiauIndex({
    enableLogging: true,
    enableNyaa: true, // OPTIONAL: Enable Nyaa torrent extension
    nyaaOptions: {
      autoIndex: true, // Automatically save indexed torrents
      minSeeders: 5, // Minimum seeders required
      trustedOnly: false, // Include all uploaders
      maxResults: 100,
      preferredQuality: TorrentQuality.FULL_HD_1080p,
      preferredLanguages: [TorrentLanguage.JAPANESE, TorrentLanguage.ENGLISH],
    },
  });

  console.log('🌸 Nyaa extension enabled:', miauIndex.isNyaaEnabled);

  // First, fetch anime data from regular sources
  const anime = await miauIndex.fetchAnime([
    { source: DataSource.ANILIST, id: '21' }, // One Piece
  ]);

  console.log('\n📺 Fetched anime:', anime.title.romaji);

  // ========================================
  // 1. Index ALL torrents for this anime
  // ========================================
  console.log('\n🔍 Indexing torrents for anime...');
  const allTorrents = await miauIndex.indexTorrents(anime);
  console.log(`Found ${allTorrents.length} torrents`);

  // Show some examples
  allTorrents.slice(0, 3).forEach((torrent: Torrent) => {
    console.log(`  - ${torrent.title}`);
    console.log(`    Quality: ${torrent.metadata.quality}`);
    console.log(`    Seeders: ${torrent.seeders} | Size: ${torrent.size}`);
    console.log(`    Audio: ${torrent.metadata.audioLanguages.join(', ')}`);
    console.log(`    Subs: ${torrent.metadata.subtitleLanguages.join(', ')}`);
  });

  // ========================================
  // 2. Index torrents for specific episode
  // ========================================
  console.log('\n🔍 Indexing torrents for episode 1...');
  const episode1Torrents = await miauIndex.indexEpisodeTorrents(anime, 1);
  console.log(`Found ${episode1Torrents.length} torrents for episode 1`);

  // ========================================
  // 3. Search torrents with filters
  // ========================================
  console.log('\n🔍 Searching for 1080p torrents with English subs...');
  const filteredTorrents = await miauIndex.searchTorrents(anime, {
    quality: TorrentQuality.FULL_HD_1080p,
    subtitleLanguage: TorrentLanguage.ENGLISH,
    minSeeders: 10,
  });

  console.log(`Found ${filteredTorrents.length} matching torrents`);
  filteredTorrents.slice(0, 5).forEach((torrent: Torrent) => {
    console.log(`  - ${torrent.title}`);
    console.log(`    Seeders: ${torrent.seeders} | Size: ${torrent.size}`);
  });

  // ========================================
  // 4. Get best torrent for episode
  // ========================================
  console.log('\n⭐ Getting best torrent for episode 1...');
  const bestTorrent = await miauIndex.getBestTorrent(anime, 1);

  if (bestTorrent) {
    console.log('Best torrent found:');
    console.log(`  Title: ${bestTorrent.title}`);
    console.log(`  Quality: ${bestTorrent.metadata.quality}`);
    console.log(`  Seeders: ${bestTorrent.seeders}`);
    console.log(`  Size: ${bestTorrent.size}`);
    console.log(`  Magnet: ${bestTorrent.magnetLink.substring(0, 60)}...`);
    console.log(`  Release Group: ${bestTorrent.metadata.releaseGroup || 'Unknown'}`);
  }

  // ========================================
  // 5. Get torrent statistics
  // ========================================
  console.log('\n📊 Getting torrent statistics...');
  const stats = await miauIndex.getTorrentStats(anime.id);

  console.log('Statistics:');
  console.log(`  Total torrents: ${stats.totalTorrents}`);
  console.log(`  Average seeders: ${Math.round(stats.averageSeeders)}`);
  console.log(`  Total size: ${(stats.totalSize / 1024 ** 3).toFixed(2)} GB`);
  console.log('\n  By quality:');
  Object.entries(stats.byQuality).forEach(([quality, count]) => {
    console.log(`    ${quality}: ${count}`);
  });
  console.log('\n  By language:');
  Object.entries(stats.byLanguage).forEach(([lang, count]) => {
    console.log(`    ${lang}: ${count}`);
  });

  // ========================================
  // 6. Advanced: Search by episode range (batch torrents)
  // ========================================
  console.log('\n🔍 Searching for batch torrents (episodes 1-12)...');
  const batchTorrents = await miauIndex.searchTorrents(anime, {
    episodeNumber: 1, // Will match if torrent includes this episode
  });

  const batches = batchTorrents.filter(
    (t: Torrent) => t.episodeRange && t.episodeRange.start === 1,
  );

  console.log(`Found ${batches.length} batch torrents starting from episode 1`);
  batches.slice(0, 3).forEach((torrent: Torrent) => {
    console.log(`  - ${torrent.title}`);
    console.log(
      `    Episodes: ${torrent.episodeRange?.start}-${torrent.episodeRange?.end}`,
    );
    console.log(`    Quality: ${torrent.metadata.quality} | Size: ${torrent.size}`);
  });

  // ========================================
  // 7. Search by different qualities
  // ========================================
  console.log('\n🔍 Comparing different quality options...');
  const qualities = [
    TorrentQuality.SD_480p,
    TorrentQuality.HD_720p,
    TorrentQuality.FULL_HD_1080p,
  ];

  for (const quality of qualities) {
    const torrents = await miauIndex.searchTorrents(anime, {
      quality,
      episodeNumber: 1,
      minSeeders: 1,
    });

    if (torrents.length > 0) {
      const best = torrents[0];
      console.log(`  ${quality}:`);
      console.log(`    Available: ${torrents.length} torrents`);
      console.log(`    Best: ${best.size} - ${best.seeders} seeders`);
    }
  }

  // ========================================
  // 8. Search by audio/subtitle language
  // ========================================
  console.log('\n🔍 Searching by language preferences...');

  // Dual audio torrents
  const dualAudio = await miauIndex.searchTorrents(anime, {
    episodeNumber: 1,
  });
  const dual = dualAudio.filter((t: Torrent) => t.metadata.isDual);
  console.log(`  Dual audio torrents: ${dual.length}`);

  // Portuguese subtitles
  const ptBrSubs = await miauIndex.searchTorrents(anime, {
    subtitleLanguage: TorrentLanguage.PORTUGUESE_BR,
    episodeNumber: 1,
  });
  console.log(`  Portuguese (BR) subs: ${ptBrSubs.length}`);

  // ========================================
  // 9. Refresh torrent info (update seeders/leechers)
  // ========================================
  if (bestTorrent) {
    console.log('\n🔄 Refreshing torrent information...');
    const refreshed = await miauIndex.refreshTorrent(bestTorrent.id);
    if (refreshed) {
      console.log(`  Seeders updated: ${bestTorrent.seeders} → ${refreshed.seeders}`);
      console.log(
        `  Last checked: ${refreshed.lastChecked?.toISOString() || 'Never'}`,
      );
    }
  }
}

// ========================================
// Multiple anime example
// ========================================
async function multipleAnimeExample() {
  const miauIndex = new MiauIndex({
    enableNyaa: true,
    enableLogging: false,
  });

  console.log('\n\n🎬 Indexing torrents for multiple anime...\n');

  const animeList = [
    { source: DataSource.ANILIST, id: '21', name: 'One Piece' },
    { source: DataSource.ANILIST, id: '1535', name: 'Death Note' },
    { source: DataSource.ANILIST, id: '20', name: 'Naruto' },
  ];

  for (const animeInfo of animeList) {
    const anime = await miauIndex.fetchAnime([
      { source: animeInfo.source, id: animeInfo.id },
    ]);

    const torrents = await miauIndex.indexTorrents(anime);
    const stats = await miauIndex.getTorrentStats(anime.id);

    console.log(`📺 ${animeInfo.name}:`);
    console.log(`  Torrents found: ${torrents.length}`);
    console.log(`  Average seeders: ${Math.round(stats.averageSeeders)}`);
    console.log(
      `  Total size: ${(stats.totalSize / 1024 ** 3).toFixed(2)} GB\n`,
    );
  }
}

// Run examples
if (require.main === module) {
  nyaaExample()
    .then(() => multipleAnimeExample())
    .then(() => console.log('\n✅ Examples completed!'))
    .catch((error) => {
      console.error('❌ Error running examples:', error);
      process.exit(1);
    });
}

export { nyaaExample, multipleAnimeExample };
