<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { liveQuery, type Subscription } from 'dexie';
import { format } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-vue-next';
import { db } from '../db';

const emit = defineEmits<{
  (e: 'select', date: string | null): void;
}>();

defineProps<{
  selectedDate: string | null;
}>();

interface DateGroup {
  date: string;
  label: string; // 表示用 (例: 2025/12/01)
  count: number;
}

const dateGroups = ref<DateGroup[]>([]);
let subscription: Subscription;

onMounted(() => {
  const observable = liveQuery(async () => {
    // ルート投稿のみを対象にする
    const posts = await db.posts
      .filter(p => !p.parentId)
      .toArray();

    const groups: Record<string, number> = {};
    
    posts.forEach(post => {
      const dateStr = format(post.createdAt, 'yyyy-MM-dd');
      groups[dateStr] = (groups[dateStr] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([date, count]) => ({
        date,
        label: format(new Date(date), 'yyyy/MM/dd'),
        count
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // 新しい順
  });

  subscription = observable.subscribe({
    next: (result) => {
      dateGroups.value = result;
    },
    error: (error) => console.error(error)
  });
});

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe();
  }
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit sticky top-20">
    <div class="p-4 border-b border-slate-100 flex items-center gap-2">
      <Calendar class="w-5 h-5 text-slate-500" />
      <h2 class="font-bold text-slate-700">アーカイブ</h2>
    </div>
    
    <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
      <button
        @click="emit('select', null)"
        class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex justify-between items-center border-b border-slate-50"
        :class="{ 'bg-blue-50 text-blue-600 font-medium': selectedDate === null }"
      >
        <span>すべての投稿</span>
        <ChevronRight v-if="selectedDate === null" class="w-4 h-4" />
      </button>

      <button
        v-for="group in dateGroups"
        :key="group.date"
        @click="emit('select', group.date)"
        class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex justify-between items-center border-b border-slate-50 last:border-0"
        :class="{ 'bg-blue-50 text-blue-600 font-medium': selectedDate === group.date }"
      >
        <span>{{ group.label }}</span>
        <div class="flex items-center gap-2">
          <span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full" :class="{ 'bg-blue-100 text-blue-600': selectedDate === group.date }">
            {{ group.count }}
          </span>
        </div>
      </button>
      
      <div v-if="dateGroups.length === 0" class="p-4 text-center text-sm text-slate-400">
        記録はまだありません
      </div>
    </div>
  </div>
</template>
