<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User, Send, Smile } from 'lucide-vue-next';
import 'emoji-picker-element';
import { db } from '../db';

const props = defineProps<{
  parentId?: number;
}>();

const emit = defineEmits<{
  (e: 'posted'): void;
}>();

const content = ref('');
const isFocused = ref(false);
const showEmojiPicker = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const addPost = async () => {
  if (!content.value.trim()) return;

  try {
    await db.posts.add({
      content: content.value,
      createdAt: new Date(),
      parentId: props.parentId
    });
    content.value = '';
    showEmojiPicker.value = false;
    emit('posted');
  } catch (error) {
    console.error('Failed to add post:', error);
  }
};

const onEmojiClick = (event: any) => {
  const emoji = event.detail.unicode;
  if (textareaRef.value) {
    const start = textareaRef.value.selectionStart;
    const end = textareaRef.value.selectionEnd;
    content.value = content.value.substring(0, start) + emoji + content.value.substring(end);
    // カーソル位置を調整
    setTimeout(() => {
      if (textareaRef.value) {
        textareaRef.value.selectionStart = textareaRef.value.selectionEnd = start + emoji.length;
        textareaRef.value.focus();
      }
    }, 0);
  } else {
    content.value += emoji;
  }
  showEmojiPicker.value = false;
};

// クリック外で閉じる処理
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (showEmojiPicker.value && !target.closest('.emoji-picker-container') && !target.closest('.emoji-trigger')) {
    showEmojiPicker.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 relative">
    <div class="flex gap-4">
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
          <User class="w-6 h-6 text-slate-500" />
        </div>
      </div>
      <div class="flex-1">
        <textarea
          ref="textareaRef"
          v-model="content"
          @focus="isFocused = true"
          @blur="isFocused = false"
          class="w-full p-2 text-lg placeholder-slate-400 border-none focus:ring-0 resize-none bg-transparent"
          rows="3"
          :placeholder="parentId ? '返信をツイート' : 'いまどうしてる？'"
        ></textarea>
        <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 relative">
          <div class="flex items-center gap-2">
            <button 
              @click="showEmojiPicker = !showEmojiPicker"
              class="emoji-trigger p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="絵文字"
            >
              <Smile class="w-5 h-5" />
            </button>
            
            <!-- Emoji Picker Popover -->
            <div v-if="showEmojiPicker" class="emoji-picker-container absolute top-full left-0 z-50 mt-2 shadow-xl rounded-lg overflow-hidden">
              <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
            </div>
          </div>
          
          <button
            @click="addPost"
            class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            :disabled="!content.trim()"
          >
            <span>{{ parentId ? '返信' : 'ツイート' }}</span>
            <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
