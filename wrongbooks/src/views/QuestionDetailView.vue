<template>
  <AppLayout>
    <div class="p-6 max-w-3xl mx-auto w-full">
      <div v-if="loading" class="text-center py-12 text-gray-400">加载中...</div>
      <div v-else-if="question">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-5">
          <button class="btn-ghost" @click="router.back()">← 返回</button>
          <div class="flex gap-2 ml-auto">
            <button class="btn-secondary text-sm" @click="router.push(`/questions/add?id=${question.id}`)">编辑</button>
            <button class="btn-secondary text-sm text-red-400" @click="deleteQ">删除</button>
          </div>
        </div>

        <!-- Question card -->
        <div class="card mb-4">
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="badge text-white text-xs" :style="{ backgroundColor: question.subject_color }">
              {{ question.subject_name }}
            </span>
            <span class="badge bg-gray-100 text-gray-600">{{ TYPE_LABELS[question.type] }}</span>
            <span class="badge bg-orange-50 text-orange-600">错误 {{ question.wrong_count }} 次</span>
            <span v-if="question.mastery" class="badge bg-green-50 text-green-600">
              {{ MASTERY_LABELS[question.mastery] }}
            </span>
          </div>

          <h3 class="font-medium text-gray-700 text-sm mb-2">题目</h3>
          <p class="text-gray-800 whitespace-pre-wrap">{{ question.content }}</p>

          <img v-if="question.image_url" :src="question.image_url" class="mt-3 max-w-full rounded-lg border" alt="题目图片" />

          <div v-if="question.my_answer" class="mt-4 p-3 bg-red-50 rounded-lg">
            <p class="text-xs text-red-400 font-medium mb-1">我的错误答案</p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ question.my_answer }}</p>
          </div>

          <div v-if="question.correct_answer" class="mt-3 p-3 bg-green-50 rounded-lg">
            <p class="text-xs text-green-500 font-medium mb-1">正确答案</p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ question.correct_answer }}</p>
          </div>

          <div v-if="question.analysis" class="mt-3 p-3 bg-blue-50 rounded-lg">
            <p class="text-xs text-blue-500 font-medium mb-1">解析</p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ question.analysis }}</p>
          </div>

          <div v-if="question.tags?.length" class="mt-4 flex gap-1.5 flex-wrap">
            <span v-for="tag in question.tags" :key="tag" class="badge bg-blue-50 text-blue-600">{{ tag }}</span>
          </div>
        </div>

        <!-- Mastery -->
        <div class="card mb-4">
          <h3 class="font-medium text-sm mb-3">掌握程度</h3>
          <div class="flex gap-2">
            <button
              v-for="(label, level) in MASTERY_LABELS"
              :key="level"
              class="btn-secondary flex-1 text-xs"
              :class="{ 'bg-brand-dark text-white border-brand-dark': question.mastery === Number(level) }"
              @click="questionsStore.updateMastery(question.id, Number(level))"
            >{{ label }}</button>
          </div>
        </div>

        <!-- AI Analysis -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-sm">🧠 AI 错因分析</h3>
            <button class="btn-secondary text-xs" @click="getAiAnalysis" :disabled="analyzing">
              {{ analyzing ? '分析中...' : (question.ai_analysis ? '重新分析' : 'AI 分析') }}
            </button>
          </div>
          <div v-if="question.ai_analysis" class="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm">
            {{ question.ai_analysis }}
          </div>
          <p v-else class="text-sm text-gray-400">点击「AI 分析」获取针对性学习建议</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { analyzeQuestion } from '@/lib/ai.js'

const router = useRouter()
const route = useRoute()
const questionsStore = useQuestionsStore()

const question = ref(null)
const loading = ref(true)
const analyzing = ref(false)

const TYPE_LABELS = { choice: '选择题', fill: '填空题', solution: '解答题', essay: '作文' }
const MASTERY_LABELS = { 1: '学习中', 2: '基本掌握', 3: '完全掌握' }

onMounted(async () => {
  question.value = await questionsStore.fetchById(route.params.id)
  loading.value = false
})

async function getAiAnalysis() {
  analyzing.value = true
  try {
    const result = await analyzeQuestion(question.value)
    await questionsStore.saveAiAnalysis(question.value.id, result)
    question.value.ai_analysis = result
  } catch (e) {
    alert('AI 分析失败：' + e.message)
  } finally {
    analyzing.value = false
  }
}

async function deleteQ() {
  if (!confirm('确认删除该错题？')) return
  await questionsStore.remove(question.value.id)
  router.push('/questions')
}
</script>
