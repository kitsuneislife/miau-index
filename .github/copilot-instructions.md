# @kitsuneislife/miau-index Project - Copilot Instructions

## Project Overview
Miau-Index is a powerful TypeScript-based anime indexer that aggregates and unifies anime data from multiple sources including MyAnimeList, AniList, and Kitsu.

## Architecture
- **Models**: Data models for Anime, Episode, Character, Studio
- **Providers**: External API integrations (MyAnimeList, AniList, Kitsu)
- **Repositories**: Data persistence layer (currently in-memory)
- **Services**: Business logic including data unification
- **Config**: Environment-based configuration management
- **Utils**: Logger and error handling utilities

## Development Guidelines
- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Write tests for new features
- Document public APIs with JSDoc
- Avoid `any` types, use specific types
- Use async/await for asynchronous operations

## Project Completion Status
- [x] Create .github/copilot-instructions.md file
- [x] Get project setup information
- [x] Scaffold TypeScript project structure
- [x] Create anime data models and types
- [x] Create services and repositories
- [x] Setup configuration and dependencies
- [x] Install dependencies and compile
- [x] Create documentation
