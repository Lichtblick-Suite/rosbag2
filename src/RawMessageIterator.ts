import { fromNanoSec } from "@lichtblick/rostime";

import type { RawMessage, TopicDefinition } from "./types";

export type MessageRow = {
  topic_id: bigint;
  timestamp: bigint;
  data: Uint8Array;
};

export class RawMessageIterator implements AsyncIterableIterator<RawMessage> {
  #dbIterator: IterableIterator<MessageRow>;
  #topicsMap: Map<bigint, TopicDefinition>;

  constructor(dbIterator: IterableIterator<MessageRow>, topicsMap: Map<bigint, TopicDefinition>) {
    this.#dbIterator = dbIterator;
    this.#topicsMap = topicsMap;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<RawMessage> {
    return this;
  }

  async next(): Promise<IteratorResult<RawMessage>> {
    const res = this.#dbIterator.next();
    if (res.done === true) {
      return { value: undefined, done: true };
    } else {
      const row = res.value;

      // Resolve topicId to a parsed topic row
      const topic = this.#topicsMap.get(row.topic_id);
      if (topic == undefined) {
        throw new Error(`Cannot find topic_id ${row.topic_id} in ${this.#topicsMap.size} topics`);
      }

      const timestamp = fromNanoSec(row.timestamp);
      const value: RawMessage = { topic, timestamp, data: row.data };
      return { value, done: false };
    }
  }
}
