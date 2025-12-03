import Dexie, { type Table } from 'dexie';

export interface Post {
  id?: number;
  content: string;
  createdAt: Date;
  parentId?: number;
  reactions?: string[];
}

export class MyDatabase extends Dexie {
  posts!: Table<Post>;

  constructor() {
    super('OfflineTwitterDB');
    this.version(2).stores({
      posts: '++id, createdAt, parentId' // id is auto-incremented, createdAt and parentId are indexed
    });
  }
}

export const db = new MyDatabase();
