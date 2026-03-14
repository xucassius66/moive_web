<template>
  <div>
    <!-- Print controls (hidden when printing) -->
    <div class="no-print bg-white border-b px-6 py-3 flex items-center gap-4">
      <button class="btn-ghost" @click="router.back()">← 返回</button>
      <h2 class="font-medium">打印预览</h2>
      <div class="ml-auto flex gap-3 items-center">
        <select v-model="filterSubjectId" class="input w-32 text-sm">
          <option value="">全部科目</option>
          <option v-for="s in subjects.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" v-model="showAnswers" class="rounded" />
          显示答案
        </label>
        <button class="btn-primary" @click="window.print()">🖨️ 打印</button>
      </div>
    </div>

    <!-- Print content -->
    <div class="max-w-3xl mx-auto p-8 print-content">
      <div class="print-only text-center mb-6">
        <h1 class="text-xl font-bold">错题本</h1>
        <p class="text-sm text-gray-500 mt-1">打印时间：{{ today }}</p>
      </div>

      <div v-if="printList.length === 0" class="no-print text-center py-12 text-gray-400">
        没有可打印的错题
      </div>

      <div
        v-for="(q, idx) in printList"
        :key="q.id"
        class="mb-6 pb-6 border-b border-gray-200 break-inside-avoid"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-medium text-gray-500">{{ idx + 1 }}.</span>
          <span class="badge text-white text-xs" :style="{ backgroundColor: q.subject_color }">{{ q.subject_name }}</span>
          <span class="badge bg-gray-100 text-gray-600 text-xs">{{ TYPE_LABELS[q.type] }}</span>
          <span v-if="q.tags?.length" class="text-xs text-gray-400">
            {{ q.tags.join(' / ') }}
          </span>
        </div>

        <p class="text-sm text-gray-800 whitespace-pre-wrap mb-2">{{ q.content }}</p>

        <div v-if="showAnswers && q.correct_answer" class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <strong>答案：</strong>{{ q.correct_answer }}
        </div>
        <div v-if="showAnswers && q.analysis" class="mt-1 text-xs text-gray-500">
          <strong>解析：</strong>{{ q.analysis }}
        </div>

        <!-- Answer blank when not showing answers -->
        <div v-if="!showAnswers" class="mt-3 border border-dashed border-gray-200 rounded h-16"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'

const router = useRouter()
const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

const filterSubjectId = ref('')
const showAnswers = ref(false)
const today = new Date().toLocaleDateString('zh-CN')
const TYPE_LABELS = { choice: '选择题', fill: '填空题', solution: '解答题', essay: '作文' }

const printList = computed(() => {
  if (!filterSubjectId.value) return questionsStore.questions
  return questionsStore.questions.filter(q => q.subject_id === filterSubjectId.value)
})

onMounted(async () => {
  await Promise.all([questionsStore.fetchAll(), subjects.fetch()])
})
</script>

<style>
@media print {
  .print-content { padding: 0; }
  .break-inside-avoid { break-inside: avoid; }
}
</style>
