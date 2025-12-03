<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell, BellOff } from 'lucide-vue-next';
import PostInput from './components/PostInput.vue';
import PostList from './components/PostList.vue';
import DateSidebar from './components/DateSidebar.vue';
import { db } from './db';

const selectedDate = ref<string | null>(null);
const notificationPermission = ref<NotificationPermission>(Notification.permission);
const checkInterval = ref<number | null>(null);
const lastNotifiedPostId = ref<number | null>(null);
const isNotificationEnabled = ref(localStorage.getItem('monolog_notification') !== 'false');

const handleDateSelect = (date: string | null) => {
  selectedDate.value = date;
};

const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  notificationPermission.value = permission;
  if (permission === 'granted') {
    isNotificationEnabled.value = true;
    localStorage.setItem('monolog_notification', 'true');
    startNotificationCheck();
  }
};

const toggleNotification = () => {
  isNotificationEnabled.value = !isNotificationEnabled.value;
  localStorage.setItem('monolog_notification', String(isNotificationEnabled.value));
};

const checkLastPostTime = async () => {
  if (notificationPermission.value !== 'granted' || !isNotificationEnabled.value) return;

  try {
    const lastPost = await db.posts.orderBy('createdAt').last();
    
    if (!lastPost) return;

    const now = new Date();
    const diff = now.getTime() - lastPost.createdAt.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    // 1時間経過していて、かつこの投稿に対してまだ通知していない場合
    if (diff >= oneHourInMs && lastNotifiedPostId.value !== lastPost.id) {
      new Notification('Monolog', {
        body: '最後の投稿から1時間が経過しました。今の気持ちを記録しませんか？',
        icon: '/logo.svg'
      });
      lastNotifiedPostId.value = lastPost.id ?? null;
    } else if (diff < oneHourInMs) {
      // 1時間未満なら通知済みフラグをリセット（新しい投稿があった場合など）
      // ただし、同じ投稿IDに対して何度もリセットしないように注意が必要だが、
      // ここでは「新しい投稿があればIDが変わる」ので、IDが変われば通知対象になる。
      // lastNotifiedPostIdが古いIDのままでも、次のチェックで新しいIDと比較されるので問題ない。
      // むしろ、ここでリセットする必要はないかも。
    }
  } catch (error) {
    console.error('Failed to check last post time:', error);
  }
};

const startNotificationCheck = () => {
  // すでに動いていればクリア
  if (checkInterval.value) clearInterval(checkInterval.value);
  
  // 初回チェック
  checkLastPostTime();

  // 1分ごとにチェック
  checkInterval.value = window.setInterval(checkLastPostTime, 60 * 1000);
};

onMounted(() => {
  if (notificationPermission.value === 'granted') {
    startNotificationCheck();
  }
});

onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center">
          <img src="/logo.svg" alt="Logo" class="w-8 h-8 mr-3 rounded-lg shadow-sm" />
          <h1 class="text-xl font-bold text-slate-800">Monolog</h1>
        </div>
        
        <button 
          v-if="notificationPermission === 'default'"
          @click="requestNotificationPermission"
          class="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-full"
        >
          <Bell class="w-4 h-4" />
          <span>通知をONにする</span>
        </button>
        
        <button 
          v-else-if="notificationPermission === 'granted'" 
          @click="toggleNotification"
          class="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-100"
          :title="isNotificationEnabled ? '通知をOFFにする' : '通知をONにする'"
        >
          <Bell v-if="isNotificationEnabled" class="w-5 h-5 text-blue-500" />
          <BellOff v-else class="w-5 h-5" />
        </button>

        <div v-else class="text-slate-300" title="通知がブロックされています">
          <BellOff class="w-5 h-5" />
        </div>
      </div>
    </header>
    
    <main class="max-w-5xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Sidebar (Left) -->
        <div class="md:col-span-4 lg:col-span-3">
          <DateSidebar 
            :selected-date="selectedDate" 
            @select="handleDateSelect" 
          />
        </div>

        <!-- Main Content (Right) -->
        <div class="md:col-span-8 lg:col-span-9">
          <PostInput />
          <div class="mb-4 flex items-center justify-between" v-if="selectedDate">
            <h2 class="text-lg font-bold text-slate-700">
              {{ selectedDate.replace(/-/g, '/') }} の記録
            </h2>
            <button 
              @click="selectedDate = null"
              class="text-sm text-blue-500 hover:underline"
            >
              すべて表示
            </button>
          </div>
          <PostList :selected-date="selectedDate" />
        </div>
      </div>
    </main>
  </div>
</template>
