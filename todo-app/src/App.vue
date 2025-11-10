<script setup lang="ts">
import { ref, computed } from 'vue';
import TodoItem from './components/TodoItem.vue';
import { useTodos } from './composables/useTodos';

const { todos, addTodo, removeTodo, toggleTodo } = useTodos();
const newTodoText = ref('');

const completedCount = computed(() => todos.value.filter(t => t.completed).length);
const pendingCount = computed(() => todos.value.filter(t => !t.completed).length);
const progressPercentage = computed(() => 
  todos.value.length > 0 ? (completedCount.value / todos.value.length) * 100 : 0
);

const handleAddTodo = () => {
  if (newTodoText.value.trim()) {
    addTodo(newTodoText.value);
    newTodoText.value = '';
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleAddTodo();
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
    <div class="max-w-3xl mx-auto">
      <!-- ヘッダー -->
      <header class="text-center mb-10">
        <div class="inline-block bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-4 shadow-sm">
          <span class="text-slate-600 text-sm font-medium">✨ タスク管理アプリ</span>
        </div>
        <h1 class="text-5xl font-bold text-slate-800 mb-3">TODOリスト</h1>
        <p class="text-slate-600 text-lg">シンプルで美しいタスク管理を</p>
      </header>

      <!-- 進捗バー -->
      <div v-if="todos.length > 0" class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-700 font-medium">進捗状況</span>
          <span class="text-slate-800 font-bold text-lg">{{ Math.round(progressPercentage) }}%</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between mt-3 text-sm text-slate-600">
          <span>🎯 未完了: {{ pendingCount }}件</span>
          <span>✅ 完了: {{ completedCount }}件</span>
          <span>📝 合計: {{ todos.length }}件</span>
        </div>
      </div>

      <!-- 入力フォーム -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
        <div class="flex gap-3">
          <input
            v-model="newTodoText"
            @keypress="handleKeyPress"
            type="text"
            placeholder="新しいタスクを入力してください..."
            class="flex-1 px-5 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all bg-white"
          />
          <button
            @click="handleAddTodo"
            class="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            ➕ 追加
          </button>
        </div>
      </div>

      <!-- TODOリスト -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-200">
        <div v-if="todos.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4 opacity-40">📭</div>
          <p class="text-slate-500 text-xl font-medium mb-2">タスクがありません</p>
          <p class="text-slate-400">上のフォームから新しいタスクを追加してください</p>
        </div>
        <div v-else>
          <h2 class="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span class="text-2xl">📋</span>
            タスク一覧
          </h2>
          <ul class="space-y-3">
            <TodoItem
              v-for="todo in todos"
              :key="todo.id"
              :todo="todo"
              @toggle="toggleTodo"
              @remove="removeTodo"
            />
          </ul>
        </div>
      </div>

      <!-- フッター -->
      <footer class="text-center mt-8 text-slate-500 text-sm">
        <p>Vue.js 3 + TypeScript + Tailwind CSS で作成</p>
      </footer>
    </div>
  </div>
</template>
