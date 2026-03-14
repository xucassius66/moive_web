<template>
  <AppLayout>
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-semibold">错题本</h2>
        <div class="flex gap-2">
          <ExportImport />
          <router-link to="/questions/add" class="btn-primary">+ 添加错题</router-link>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="flex flex-wrap gap-3">
          <input
            v-model="questionsStore.searchQuery"
            class="input max-w-xs"
            placeholder="🔍 搜索题目内容、标签..."
          />
          <select v-model="questionsStore.filterSubject" class="input w-36">
            <option :value="null">全部科目</option>
            <option v-for="s in subjects.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <select v-model="questionsStore.filterMastery" class="input w-32">
            <option :value="null">全部状态</option>
            <option :value="0">未掌握</option>
            <option :value="1">学习中</option>
            <option :value="2">基本掌握</option>
            <option :value="3">完全掌握</option>
          </select>
          <button class="btn-ghost text-sm" @click="clearFilters">清除筛选</button>
        </div>
      </div>

      <!-- Stats bar -->
      <p class="text-sm text-gray-500 mb-4">
        共 {{ questionsStore.filtered.length }} 条错题
        <span v-if="questionsStore.searchQuery || questionsStore.filterSubject">（已筛选）</span>
      </p>

      <!-- List -->
      <div v-if="questionsStore.loading" class="text-center py-12 text-gray-400">加载中...</div>
      <div v-else-if="questionsStore.filtered.length === 0" class="text-center py-16 text-gray-400">
        <div class="text-4xl mb-3">📭</div>
        <p>暂无错题记录</p>
        <router-link to="/questions/add" class="btn-primary mt-4 inline-flex">添加第一道错题</router-link>
      </div>
      <div v-else class="space-y-3">
        <QuestionCard
          v-for="q in questionsStore.filtered"
          :key="q.id"
          :question="q"
          @click="router.push(`/questions/${q.id}`)"
          @edit="router.push(`/questions/add?id=${q.id}`)"
          @delete="deleteQuestion(q)"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import QuestionCard from '@/components/question/QuestionCard.vue'
import ExportImport from '@/components/common/ExportImport.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'

const router = useRouter()
const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

onMounted(async () => {
  await Promise.all([questionsStore.fetchAll(), subjects.fetch()])
})

function clearFilters() {
  questionsStore.searchQuery = ''
  questionsStore.filterSubject = null
  questionsStore.filterTag = null
  questionsStore.filterMastery = null
}

async function deleteQuestion(q) {
  if (!confirm(`确认删除「${q.content.slice(0, 20)}...」？`)) return
  await questionsStore.remove(q.id)
}
</script>
