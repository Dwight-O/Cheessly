/// <reference lib="webworker" />
import { chooseMove } from './search';
import type { AiRequest, AiResponse } from './protocol';

const worker = self as unknown as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<AiRequest>) => {
  const { id, state, options } = event.data;
  try {
    const result = chooseMove(state, options);
    const response: AiResponse = { id, result };
    worker.postMessage(response);
  } catch (error) {
    const response: AiResponse = {
      id,
      result: { move: null, score: 0, depthReached: 0, nodes: 0, elapsedMs: 0, mistake: false },
      error: error instanceof Error ? error.message : String(error),
    };
    worker.postMessage(response);
  }
};
