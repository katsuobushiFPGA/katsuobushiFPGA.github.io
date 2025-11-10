import { ref, watch } from 'vue';
import type { Todo } from '../types/todo';

const STORAGE_KEY = 'todos';

export function useTodos() {
  // LocalStorageからTODOを読み込む
  const loadTodos = (): Todo[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load todos:', error);
      return [];
    }
  };

  // TODOリストの状態
  const todos = ref<Todo[]>(loadTodos());

  // LocalStorageに保存
  const saveTodos = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value));
    } catch (error) {
      console.error('Failed to save todos:', error);
    }
  };

  // TODOリストの変更を監視して自動保存
  watch(todos, saveTodos, { deep: true });

  // TODOを追加
  const addTodo = (text: string) => {
    if (!text.trim()) return;
    
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    
    todos.value.unshift(newTodo);
  };

  // TODOを削除
  const removeTodo = (id: string) => {
    todos.value = todos.value.filter(todo => todo.id !== id);
  };

  // TODOの完了状態を切り替え
  const toggleTodo = (id: string) => {
    const todo = todos.value.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodo,
  };
}
