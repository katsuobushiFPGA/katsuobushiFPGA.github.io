import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

describe('Database', () => {
  beforeEach(async () => {
    await db.posts.clear();
  });

  it('should add a post', async () => {
    const id = await db.posts.add({
      content: 'Hello World',
      createdAt: new Date(),
      reactions: []
    });

    const post = await db.posts.get(id);
    expect(post).toBeDefined();
    expect(post?.content).toBe('Hello World');
  });

  it('should support replies', async () => {
    const parentId = await db.posts.add({
      content: 'Parent Post',
      createdAt: new Date(),
      reactions: []
    });

    const replyId = await db.posts.add({
      content: 'Reply Post',
      createdAt: new Date(),
      parentId: parentId,
      reactions: []
    });

    const reply = await db.posts.get(replyId);
    expect(reply?.parentId).toBe(parentId);
  });
});
