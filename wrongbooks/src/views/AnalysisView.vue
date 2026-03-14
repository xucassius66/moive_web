<template>
  <AppLayout>
    <div class="p-6 max-w-3xl mx-auto w-full">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">🧠 AI 薄弱点分析</h2>
        <button class="btn-primary" @click="runAnalysis" :disabled="analyzing">
          {{ analyzing ? '分析中...' : '开始分析' }}
        </button>
      </div>

      <div v-if="!report && !analyzing" class="card text-center py-16">
        <div class="text-5xl mb-4">🧠</div>
        <h3 class="font-medium text-gray-700 mb-2">AI 智能分析你的薄弱点</h3>
        <p class="text-sm text-gray-400 mb-6">根据你的错题记录，分析主要薄弱知识点并给出学习建议</p>
        <button class="btn-primary" @click="runAnalysis">开始分析</button>
      </div>

      <div v-if="analyzing" class="card text-center py-16">
        <div class="text-4xl mb-4 animate-bounce">⚙️</div>
        <p class="text-gray-500 animate-pulse">AI 正在分析你的 {{ questionsStore.questions.length }} 道错题...</p>
      </div>

      <div v-if="report && !analyzing">
        <!-- Report -->
        <div class="card mb-4">
          <h3 class="font-medium mb-3">分析报告</h3>
          <div class="prose prose-sm max-w-none text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ report }}</div>
        </div>

        <!-- Weak points list with generate button -->
        <div v-if="weakPoints.length" class="card">
          <h3 class="font-medium mb-3">针对薄弱点生成练习题</h3>
          <div class="space-y-3">
            <div v-for="point in weakPoints" :key="point" class="border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">{{ point }}</span>
                <div class="flex items-center gap-2">
                  <select v-model="selectedSubject" class="input w-28 text-xs py-1">
                    <option value="">选择科目</option>
                    <option v-for="s in subjects.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <button
                    class="btn-primary text-xs px-3 py-1"
                    @click="generateQuestions(point)"
                    :disabled="generatingPoint === point"
                  >
                    {{ generatingPoint === point ? '生成中...' : '出练习题' }}
                  </button>
                </div>
              </div>

              <!-- Generated questions -->
              <div v-if="generatedMap[point]" class="mt-3 space-y-2">
                <div
                  v-for="(q, idx) in generatedMap[point]"
                  :key="idx"
                  class="bg-gray-50 rounded-lg p-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm text-gray-800 flex-1">{{ idx + 1 }}. {{ q.content }}</p>
                    <button
                      class="btn-secondary text-xs px-2 py-1 shrink-0"
                      @click="saveGeneratedQuestion(q, point)"
                    >加入错题本</button>
                  </div>
                  <div class="mt-2">
                    <button
                      class="text-xs text-blue-500 hover:underline"
                      @click="q._showAnswer = !q._showAnswer"
                    >{{ q._showAnswer ? '收起答案' : '查看答案' }}</button>
                    <div v-if="q._showAnswer" class="mt-1 text-xs text-gray-600 bg-white rounded p-2 border border-gray-100">
                      <p><strong>答案：</strong>{{ q.correct_answer }}</p>
                      <p v-if="q.analysis" class="mt-1"><strong>解析：</strong>{{ q.analysis }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'
import { analyzeWeakPoints, generatePracticeQuestions } from '@/lib/ai.js'

const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

const report = ref('')
const weakPoints = ref([])
const analyzing = ref(false)
const generatingPoint = ref('')
const generatedMap = reactive({})
const selectedSubject = ref('')

onMounted(async () => {
  await Promise.all([questionsStore.fetchAll(), subjects.fetch()])
})

async function runAnalysis() {
  if (questionsStore.questions.length === 0) {
    alert('请先添加一些错题再进行分析')
    return
  }
  analyzing.value = true
  report.value = ''
  weakPoints.value = []
  try {
    const result = await analyzeWeakPoints(questionsStore.questions)
    report.value = result

    // Extract weak points JSON array from the end of report
    const match = result.match(/\[[\s\S]*?\](?=[^[]*$)/)
    if (match) {
      try {
        weakPoints.value = JSON.parse(match[0])
      } catch { /* ignore */ }
    }
  } catch (e) {
    alert('分析失败：' + e.message)
  } finally {
    analyzing.value = false
  }
}

async function generateQuestions(point) {
  const subjectObj = subjects.subjects.find(s => s.id === selectedSubject.value)
  const subjectName = subjectObj?.name || '通用'
  generatingPoint.value = point
  try {
    const questions = await generatePracticeQuestions(point, subjectName, 3)
    generatedMap[point] = questions.map(q => ({ ...q, _showAnswer: false }))
  } catch (e) {
    alert('生成失败：' + e.message)
  } finally {
    generatingPoint.value = ''
  }
}

async function saveGeneratedQuestion(q, point) {
  const subjectObj = subjects.subjects.find(s => s.id === selectedSubject.value)
  await questionsStore.create({
    subject_id: selectedSubject.value || null,
    type: q.type || 'solution',
    content: q.content,
    my_answer: '',
    correct_answer: q.correct_answer,
    analysis: q.analysis,
  }, [point])
  alert('已加入错题本！')
}
</script>
