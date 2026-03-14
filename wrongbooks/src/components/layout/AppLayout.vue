<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-56 bg-brand-dark text-white flex flex-col shrink-0 no-print">
      <div class="px-5 py-5 border-b border-white/10">
        <h1 class="text-lg font-bold text-red-400">WrongBooks</h1>
        <p class="text-xs text-gray-400 mt-0.5">{{ auth.user?.email }}</p>
      </div>

      <nav class="flex-1 py-4 space-y-1 px-3">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          active-class="bg-red-500/20 text-white font-medium"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="px-3 py-4 border-t border-white/10 space-y-1">
        <router-link to="/print" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all">
          <span>🖨️</span> 打印错题
        </router-link>
        <button
          @click="auth.signOut().then(() => router.push('/login'))"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <span>🚪</span> 退出登录
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 bg-gray-50">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { to: '/',           icon: '📊', label: '仪表板' },
  { to: '/questions',  icon: '📝', label: '错题本' },
  { to: '/questions/add', icon: '➕', label: '添加错题' },
  { to: '/practice',   icon: '🎯', label: '练习模式' },
  { to: '/analysis',   icon: '🧠', label: 'AI 分析' },
]
</script>
