<template>
  <div class="card hover:shadow-md transition-shadow cursor-pointer group" @click="$emit('click', question)">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span
          class="badge text-white text-xs"
          :style="{ backgroundColor: question.subject_color }"
        >{{ question.subject_name || '未分类' }}</span>
        <span class="badge bg-gray-100 text-gray-600">{{ TYPE_LABELS[question.type] || question.type }}</span>
        <span
          v-if="question.mastery > 0"
          class="badge"
          :class="masteryClass"
        >{{ MASTERY_LABELS[question.mastery] }}</span>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" @click.stop>
        <button class="btn-ghost px-2 py-1 text-xs" @click="$emit('edit', question)">编辑</button>
        <button class="btn-ghost px-2 py-1 text-xs text-red-400 hover:bg-red-50" @click="$emit('delete', question)">删除</button>
      </div>
    </div>

    <p class="mt-3 text-sm text-gray-800 line-clamp-3">{{ question.content }}</p>

    <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
      <div class="flex gap-2 flex-wrap">
        <span v-for="tag in question.tags" :key="tag" class="badge bg-blue-50 text-blue-600">{{ tag }}</span>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span v-if="question.wrong_count > 1" class="text-red-400">错误 {{ question.wrong_count }} 次</span>
        <span>{{ formatDate(question.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ question: Object })
defineEmits(['click', 'edit', 'delete'])

const TYPE_LABELS = { choice: '选择题', fill: '填空题', solution: '解答题', essay: '作文' }
const MASTERY_LABELS = { 1: '学习中', 2: '基本掌握', 3: '完全掌握' }

const masteryClass = computed(() => {
  const map = { 1: 'bg-yellow-50 text-yellow-600', 2: 'bg-blue-50 text-blue-600', 3: 'bg-green-50 text-green-600' }
  return map[props.question.mastery] || ''
})

function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}
</script>
