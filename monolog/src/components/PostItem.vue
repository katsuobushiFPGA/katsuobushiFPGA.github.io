<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { User, MessageCircle, SmilePlus, Trash2, MoreHorizontal } from 'lucide-vue-next';
import { liveQuery, type Subscription } from 'dexie';
import 'emoji-picker-element';
import { db, type Post } from '../db';
import PostInput from './PostInput.vue';

defineOptions({
  name: 'PostItem'
});

const props = defineProps<{
  post: Post;
}>();

const emit = defineEmits<{
  (e: 'delete', id: number): void;
}>();

const showReplyInput = ref(false);
const showReactionPicker = ref(false);
const showMenu = ref(false);
const replies = ref<Post[]>([]);
const now = ref(new Date());
let subscription: Subscription;
let timer: number;

onMounted(() => {
  if (props.post.id) {
    const observable = liveQuery(() => 
      db.posts.where('parentId').equals(props.post.id!).sortBy('createdAt')
    );
    subscription = observable.subscribe({
      next: (result) => {
        replies.value = result;
      },
      error: (error) => console.error(error)
    });
  }
  
  // 1分ごとに現在時刻を更新して、相対時間を再計算させる
  timer = window.setInterval(() => {
    now.value = new Date();
  }, 60000);

  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe();
  }
  if (timer) {
    clearInterval(timer);
  }
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (showReactionPicker.value && !target.closest('.reaction-picker-container') && !target.closest('.reaction-trigger')) {
    showReactionPicker.value = false;
  }
  if (showMenu.value && !target.closest('.menu-container') && !target.closest('.menu-trigger')) {
    showMenu.value = false;
  }
};

const timeAgo = computed(() => {
  // now.valueを参照することで、1分ごとの更新をトリガーにする
  now.value;
  return formatDistanceToNow(props.post.createdAt, { addSuffix: true, locale: ja });
});

const exactDate = computed(() => {
  return format(props.post.createdAt, 'yyyy/MM/dd HH:mm');
});

const handleDelete = () => {
  if (props.post.id && confirm('削除しますか？')) {
    emit('delete', props.post.id);
  }
};

const handleReplyClick = () => {
  showReplyInput.value = !showReplyInput.value;
};

const onReplyPosted = () => {
  showReplyInput.value = false;
};

const handleChildDelete = async (id: number) => {
  try {
    await db.posts.delete(id);
  } catch (error) {
    console.error('Failed to delete post:', error);
  }
};

const addReaction = async (event: any) => {
  if (!props.post.id) return;
  const emoji = event.detail.unicode;
  
  const currentReactions = props.post.reactions || [];
  if (!currentReactions.includes(emoji)) {
    await db.posts.update(props.post.id, {
      reactions: [...currentReactions, emoji]
    });
  }
  showReactionPicker.value = false;
};

const removeReaction = async (emoji: string) => {
  if (!props.post.id) return;
  const currentReactions = props.post.reactions || [];
  await db.posts.update(props.post.id, {
    reactions: currentReactions.filter(r => r !== emoji)
  });
};
</script>

<template>
  <div class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
    <div class="p-4">
      <div class="flex gap-3">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
            <User class="w-6 h-6 text-slate-500" />
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900">自分</span>
              <span class="text-slate-500 text-sm">@me</span>
              <span class="text-slate-400 text-sm">·</span>
              <span class="text-slate-500 text-sm hover:underline" :title="exactDate">{{ timeAgo }}</span>
            </div>
            <div class="relative">
              <button 
                @click.stop="showMenu = !showMenu"
                class="menu-trigger text-slate-400 hover:text-blue-500 rounded-full p-1 hover:bg-blue-50 transition-colors"
              >
                <MoreHorizontal class="w-4 h-4" />
              </button>
              <!-- Dropdown Menu -->
              <div v-if="showMenu" class="menu-container absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 z-10 overflow-hidden">
                <button
                  @click.stop="handleDelete"
                  class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 class="w-4 h-4" />
                  削除
                </button>
              </div>
            </div>
          </div>
          
          <div class="mt-1 text-slate-900 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {{ post.content }}
          </div>

          <!-- Reactions Display -->
          <div v-if="post.reactions && post.reactions.length > 0" class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="emoji in post.reactions"
              :key="emoji"
              @click.stop="removeReaction(emoji)"
              class="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-sm border border-slate-200 transition-colors"
            >
              {{ emoji }} <span class="ml-1 text-xs text-slate-500">1</span>
            </button>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-between mt-3 max-w-md text-slate-500 relative">
            <button 
              @click.stop="handleReplyClick"
              class="group flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              <div class="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <MessageCircle class="w-4 h-4" />
              </div>
              <span v-if="replies.length > 0" class="text-xs">{{ replies.length }}</span>
            </button>
            
            <!-- Reaction Button -->
            <div class="relative">
              <button 
                @click.stop="showReactionPicker = !showReactionPicker"
                class="reaction-trigger group flex items-center gap-2 hover:text-pink-500 transition-colors"
              >
                <div class="p-2 rounded-full group-hover:bg-pink-50 transition-colors">
                  <SmilePlus class="w-4 h-4" />
                </div>
              </button>
              <!-- Reaction Picker Popover -->
              <div v-if="showReactionPicker" class="reaction-picker-container absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 shadow-xl rounded-lg overflow-hidden" @click.stop>
                <emoji-picker @emoji-click="addReaction"></emoji-picker>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reply Input -->
    <div v-if="showReplyInput" class="px-4 pb-4 pl-16 border-t border-slate-100 pt-4 bg-slate-50">
      <PostInput :parent-id="post.id" @posted="onReplyPosted" />
    </div>

    <!-- Replies -->
    <div v-if="replies.length > 0" class="pl-12 border-t border-slate-100">
       <PostItem 
         v-for="reply in replies" 
         :key="reply.id" 
         :post="reply" 
         @delete="handleChildDelete" 
       />
    </div>
  </div>
</template>
