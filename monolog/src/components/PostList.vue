<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { liveQuery, type Subscription } from 'dexie';
import { format } from 'date-fns';
import { db, type Post } from '../db';
import PostItem from './PostItem.vue';

const props = defineProps<{
  selectedDate: string | null;
}>();

const posts = ref<Post[]>([]);
let subscription: Subscription;

const setupSubscription = () => {
  if (subscription) {
    subscription.unsubscribe();
  }

  const observable = liveQuery(() => 
    db.posts
      .orderBy('createdAt')
      .reverse()
      .filter(post => {
        // ルート投稿のみ
        if (post.parentId) return false;
        
        // 日付フィルタ
        if (props.selectedDate) {
          const postDate = format(post.createdAt, 'yyyy-MM-dd');
          return postDate === props.selectedDate;
        }
        
        return true;
      })
      .toArray()
  );

  subscription = observable.subscribe({
    next: (result) => {
      posts.value = result;
    },
    error: (error) => console.error(error)
  });
};

watch(() => props.selectedDate, () => {
  setupSubscription();
});

onMounted(() => {
  setupSubscription();
});

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe();
  }
});


const deletePost = async (id: number) => {
  try {
    await db.posts.delete(id);
  } catch (error) {
    console.error('Failed to delete post:', error);
  }
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div v-if="posts.length === 0" class="p-12 text-center">
      <div class="text-slate-400 mb-2">まだ投稿がありません</div>
      <div class="text-sm text-slate-300">最初のツイートをしてみましょう</div>
    </div>
    <PostItem
      v-for="post in posts"
      :key="post.id"
      :post="post"
      @delete="deletePost"
    />
  </div>
</template>
