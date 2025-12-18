import { MiauIndex, DataSource } from './index';

async function main() {
  console.log('🐱 Miau-Index Example\n');

  // Initialize MiauIndex
  // Works perfectly without ANY API keys - uses open sources (AniList, Kitsu)
  // MyAnimeList is OPTIONAL and only used if API key is provided
  const miauIndex = new MiauIndex({
    malApiKey: process.env.MAL_CLIENT_ID, // Optional: only if you have MAL API key
    enabledProviders: {
      myAnimeList: true, // Will be skipped if no API key
      aniList: true, // ✓ Open source - no API key required
      kitsu: true, // ✓ Open source - no API key required
    },
    preferOpenSources: true, // Prioritize AniList and Kitsu (default: true)
    enableLogging: true,
  });

  try {
    // Example 1: Check provider health
    console.log('📊 Checking providers health...');
    const health = await miauIndex.checkProviders();
    console.log('Provider Status:', health);
    console.log();

    // Example 2: Search for anime using AniList
    console.log('🔍 Searching for "Cowboy Bebop"...');
    const searchResults = await miauIndex.searchAnime('Cowboy Bebop', 5);
    console.log(`Found ${searchResults.length} results:`);
    searchResults.forEach((anime, i) => {
      console.log(
        `  ${i + 1}. ${anime.title.romaji || anime.title.english} (${anime.type}) - Score: ${anime.ratings[0]?.score || 'N/A'}`
      );
    });
    console.log();

    // Example 3: Get seasonal anime
    console.log('📅 Fetching Winter 2024 anime...');
    const seasonalAnime = await miauIndex.getSeasonalAnime(2024, 'winter');
    console.log(`Found ${seasonalAnime.length} seasonal anime:`);
    seasonalAnime.slice(0, 5).forEach((anime, i) => {
      console.log(`  ${i + 1}. ${anime.title.romaji || anime.title.english}`);
    });
    console.log();

    // Example 4: Fetch specific anime from AniList
    console.log('📖 Fetching Fullmetal Alchemist: Brotherhood from AniList...');
    const fmab = await miauIndex.fetchAnime([{ source: DataSource.ANILIST, id: '5114' }]);
    console.log('Title:', fmab.title.romaji);
    console.log('English Title:', fmab.title.english);
    console.log('Type:', fmab.type);
    console.log('Status:', fmab.status);
    console.log('Episodes:', fmab.episodes);
    console.log('Genres:', fmab.genres.join(', '));
    console.log('Score:', fmab.ratings[0]?.score || 'N/A');
    console.log();

    // Example 5: Get statistics
    console.log('📈 Repository statistics:');
    const stats = await miauIndex.getStats();
    console.log('Total anime:', stats.totalAnime);
    console.log('By type:', stats.byType);
    console.log('By status:', stats.byStatus);
    console.log();

    // Example 6: Search local repository
    console.log('💾 Searching local repository for "Fullmetal"...');
    const localResults = await miauIndex.searchLocal('Fullmetal', 5);
    console.log(`Found ${localResults.length} local results`);
    localResults.forEach((anime, i) => {
      console.log(`  ${i + 1}. ${anime.title.romaji || anime.title.english}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
main();
