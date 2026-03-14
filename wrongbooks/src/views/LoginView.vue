<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-light px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-red-400">WrongBooks</h1>
        <p class="text-gray-400 mt-2 text-sm">错题本 · 查漏补缺，精准提升</p>
      </div>

      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            class="flex-1 py-1.5 text-sm rounded-md transition-all"
            :class="mode === 'login' ? 'bg-white shadow font-medium' : 'text-gray-500'"
            @click="mode = 'login'"
          >登录</button>
          <button
            class="flex-1 py-1.5 text-sm rounded-md transition-all"
            :class="mode === 'register' ? 'bg-white shadow font-medium' : 'text-gray-500'"
            @click="mode = 'register'"
          >注册</button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="label">邮箱</label>
            <input v-model="email" type="email" class="input" placeholder="your@email.com" required />
          </div>
          <div>
            <label class="label">密码</label>
            <input v-model="password" type="password" class="input" placeholder="至少 6 位" required minlength="6" />
          </div>

          <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
          <p v-if="success" class="text-green-500 text-xs">{{ success }}</p>

          <button type="submit" class="btn-primary w-full" :disabled="submitting">
            {{ submitting ? '处理中...' : (mode === 'login' ? '登录' : '注册') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const mode = ref('login')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  success.value = ''
  submitting.value = true
  try {
    if (mode.value === 'login') {
      await auth.signIn(email.value, password.value)
      router.push('/')
    } else {
      await auth.signUp(email.value, password.value)
      success.value = '注册成功！请检查邮箱验证后登录。'
    }
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>
