import raw from '../data/content.json';

export type Cue = 'near' | 'far' | 'point';

export type Scene = {
  id: string;
  emoji: string;
  utterance: string;
  audioId: string;
  promptZh: string;
  cue?: Cue;
};

export type Chunk = {
  id: string;
  chunk: string;
  glossZh: string;
  week: number;
  textbook: string;
  scenes: Scene[];
};

export type Option = { id: string; emoji: string };

export type ComprehensionItem = {
  id: string;
  utterance: string;
  audioId: string;
  options: Option[];
  answer: string;
  level: number;
};

export type DecodingItem = { id: string; display: string };
export type ListeningItem = { id: string; utterance: string; audioId: string };
export type ProductionItem = { id: string; emoji: string; utterance: string; audioId: string };

export type Content = {
  chunks: Chunk[];
  baseline: {
    comprehension: ComprehensionItem[];
    decoding: DecodingItem[];
    listening: ListeningItem[];
    production: ProductionItem[];
  };
};

export const content = raw as unknown as Content;

export const allScenes: Scene[] = content.chunks.flatMap((chunk) => chunk.scenes);

export function chunkById(id: string): Chunk {
  const found = content.chunks.find((chunk) => chunk.id === id);
  if (!found) throw new Error(`Unknown chunk: ${id}`);
  return found;
}
