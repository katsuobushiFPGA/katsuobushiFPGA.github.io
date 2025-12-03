import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PostInput from './PostInput.vue';
import { db } from '../db';

describe('PostInput', () => {
  beforeEach(async () => {
    await db.posts.clear();
  });

  it('should render textarea', () => {
    const wrapper = mount(PostInput);
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('should create a post when submitted', async () => {
    const wrapper = mount(PostInput);
    const textarea = wrapper.find('textarea');
    
    await textarea.setValue('New Test Post');
    await wrapper.find('button.bg-blue-500').trigger('click');

    // Wait for async operations (DB add)
    await flushPromises();
    
    const posts = await db.posts.toArray();
    console.log('Posts in DB:', posts);
    console.log('Button HTML:', wrapper.find('button.bg-blue-500').html());

    // Verify the button is disabled (content cleared)
    expect(wrapper.find('button.bg-blue-500').attributes('disabled')).toBeDefined();

    // Verify post is in DB
    expect(posts).toHaveLength(1);
    expect(posts[0]?.content).toBe('New Test Post');
  });
});
