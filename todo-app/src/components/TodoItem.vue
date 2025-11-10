<script setup lang="ts">
import type { Todo } from '../types/todo';

interface Props {
  todo: Todo;
}

interface Emits {
  (e: 'toggle', id: string): void;
  (e: 'remove', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleToggle = () => {
  emit('toggle', props.todo.id);
};

const handleRemove = () => {
  emit('remove', props.todo.id);
};
</script>

<template>
  <li 
    class="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
    :class="{ 'opacity-60': todo.completed }"
  >
    <div class="relative">
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="handleToggle"
        class="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md cursor-pointer transition-all checked:bg-blue-500 checked:border-blue-500 hover:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
      />
      <svg 
        class="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    
    <span
      :class="[
        'flex-1 text-left text-base transition-all',
        todo.completed 
          ? 'line-through text-slate-400' 
          : 'text-slate-700 font-medium'
      ]"
    >
      {{ todo.text }}
    </span>
    
    <button
      @click="handleRemove"
      class="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
      aria-label="削除"
    >
      🗑️ 削除
    </button>
  </li>
</template>
