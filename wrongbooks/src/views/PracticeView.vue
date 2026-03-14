<template>
  <AppLayout>
    <div class="p-6 max-w-2xl mx-auto w-full">
      <h2 class="text-xl font-semibold mb-5">🎯 练习模式</h2>

      <!-- Setup -->
      <div v-if="!started" class="card">
        <h3 class="font-medium mb-4">练习设置</h3>
        <div class="space-y-4">
          <div>
            <label class="label">科目</label>
            <select v-model="config.subjectId" class="input">
              <option value="">全部科目</option>
              <option v-for="s in subjects.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">优先练习</label>
            <select v-model="config.masteryMax" class="input">
              <option :value="3">全部错题</option>
              <option :value="1">未掌握的题目</option>
              <option :value="2">未完全掌握的题目</option>
            </select>
          </div>
          <div>
            <label class="label">每次练习题数</label>
            <select v-model="config.count" class="input">
              <option :value="5">5 题</option>
              <option :value="10">10 题</option>
              <option :value="20">20 题</option>
              <option :value="99">全部</option>
            </select>
          </div>
        </div>
        <button class="btn-primary w-full mt-5" @click="startPractice">开始练习</button>
      </div>

      <!-- Practice card -->
      <div v-else-if="!finished">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-gray-500">{{ currentIndex + 1 }} / {{ practiceList.length }}</span>
          <div class="flex-1 mx-4 h-1.5 bg-gray-200 rounded-full">
            <div
              class="h-1.5 bg-red-400 rounded-full transition-all"
              :style="{ width: `${((currentIndex + 1) / practiceList.length) * 100}%` }"
            ></div>
          </div>
          <button class="btn-ghost text-xs" @click="finished = true">结束练习</button>
        </div>

        <div class="card">
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="badge text-white text-xs" :style="{ backgroundColor: current.subject_color }">
              {{ current.subject_name }}
            </span>
            <span class="badge bg-gray-100 text-gray-600 text-xs">{{ TYPE_LABELS[current.type] }}</span>
          </div>

          <p class="text-gray-800 whitespace-pre-wrap mb-6">{{ current.content }}</p>

          <div v-if="!showAnswer">
            <button class="btn-secondary w-full" @click="showAnswer = true">查看答案</button>
          </div>

          <div v-else>
            <div v-if="current.correct_answer" class="p-3 bg-green-50 rounded-lg mb-4">
              <p class="text-xs text-green-500 font-medium mb-1">正确答案</p>
              <p class="text-sm whitespace-pre-wrap">{{ current.correct_answer }}</p>
            </div>
            <div v-if="current.analysis" class="p-3 bg-blue-50 rounded-lg mb-4">
              <p class="text-xs text-blue-500 font-medium mb-1">解析</p>
              <p class="text-sm whitespace-pre-wrap">{{ current.analysis }}</p>
            </div>

            <p class="text-sm font-medium text-gray-700 mb-3">这道题掌握了吗？</p>
            <div class="grid grid-cols-3 gap-2">
              <button class="btn-secondary text-sm py-2.5 hover:bg-red-50 hover:text-red-500 hover:border-red-200" @click="answer(0)">
                😞 没掌握
              </button>
              <button class="btn-secondary text-sm py-2.5 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200" @click="answer(1)">
                🤔 模糊
              </button>
              <button class="btn-secondary text-sm py-2.5 hover:bg-green-50 hover:text-green-600 hover:border-green-200" @click="answer(3)">
                ✅ 掌握了
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Result -->
      <div v-else class="card text-center py-12">
        <div class="text-5xl mb-4">🎉</div>
        <h3 class="text-lg font-semibold mb-2">练习完成！</h3>
        <div class="flex justify-center gap-8 mt-4 mb-6 text-sm">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-500">{{ results.mastered }}</p>
            <p class="text-gray-500">已掌握</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-500">{{ results.learning }}</p>
            <p class="text-gray-500">模糊</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-500">{{ results.unmastered }}</p>
            <p class="text-gray-500">未掌握</p>
          </div>
        </div>
        <div class="flex gap-3 justify-center">
          <button class="btn-primary" @click="restart">再练一次</button>
          <router-link to="/questions" class="btn-secondary">回到错题本</router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'

const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

const TYPE_LABELS = { choice: '选择题', fill: '填空题', solution: '解答题', essay: '作文' }

const config = reactive({ subjectId: '', masteryMax: 1, count: 10 })
const started = ref(false)
const finished = ref(false)
const practiceList = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const results = reactive({ mastered: 0, learning: 0, unmastered: 0 })

const current = computed(() => practiceList.value[currentIndex.value])

onMounted(async () => {
  await Promise.all([questionsStore.fetchAll(), subjects.fetch()])
})

function startPractice() {
  let pool = questionsStore.questions.filter(q => q.mastery <= config.masteryMax)
  if (config.subjectId) pool = pool.filter(q => q.subject_id === config.subjectId)
  if (pool.length === 0) { alert('没有符合条件的错题，请调整筛选条件'); return }

  // Shuffle
  pool = [...pool].sort(() => Math.random() - 0.5).slice(0, config.count)
  practiceList.value = pool
  currentIndex.value = 0
  showAnswer.value = false
  results.mastered = 0
  results.learning = 0
  results.unmastered = 0
  started.value = true
  finished.value = false
}

async function answer(masteryLevel) {
  await questionsStore.updateMastery(current.value.id, masteryLevel)
  if (masteryLevel >= 3) results.mastered++
  else if (masteryLevel === 1) results.learning++
  else results.unmastered++

  if (currentIndex.value < practiceList.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  } else {
    finished.value = true
  }
}

function restart() {
  started.value = false
  finished.value = false
}
</script>
