import type { GameState } from '../engine';
import type { SearchOptions, SearchResult } from './search';

/** Messages exchanged with the AI Web Worker. `GameState` is plain data, so
 *  it survives structured cloning unchanged. */
export interface AiRequest {
  readonly id: number;
  readonly state: GameState;
  readonly options: SearchOptions;
}

export interface AiResponse {
  readonly id: number;
  readonly result: SearchResult;
  readonly error?: string;
}
