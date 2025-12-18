import { NyaaService } from '../src/services/NyaaService';
import { InMemoryTorrentRepository } from '../src/repositories/TorrentRepository';

/**
 * Quick smoke test for NyaaService
 */
describe('NyaaService - Smoke Test', () => {
  let service: NyaaService;
  let repository: InMemoryTorrentRepository;

  beforeEach(() => {
    repository = new InMemoryTorrentRepository();
    service = new NyaaService(repository);
  });

  it('should create service instance', () => {
    expect(service).toBeDefined();
    expect(service.isNyaaEnabled).toBe(true);
  });

  it('should have working repository', async () => {
    const count = await repository.count();
    expect(count).toBe(0);
  });
});
