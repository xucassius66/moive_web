<template>
  <div class="flex gap-2">
    <button class="btn-secondary text-xs" @click="exportData">⬇️ 导出备份</button>
    <label class="btn-secondary text-xs cursor-pointer">
      ⬆️ 导入数据
      <input type="file" accept=".json" class="hidden" @change="importData" />
    </label>
  </div>
</template>

<script setup>
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'
import { supabase } from '@/lib/supabase.js'

const questionsStore = useQuestionsStore()
const subjectsStore = useSubjectsStore()

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    questions: questionsStore.questions,
    subjects: subjectsStore.subjects,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wrongbooks-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData(e) {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.questions) return alert('文件格式不正确')

  if (!confirm(`将导入 ${data.questions.length} 条错题，是否继续？`)) return

  for (const q of data.questions) {
    await supabase.from('questions').upsert({
      id: q.id,
      subject_id: q.subject_id,
      type: q.type,
      content: q.content,
      my_answer: q.my_answer,
      correct_answer: q.correct_answer,
      analysis: q.analysis,
      mastery: q.mastery,
      wrong_count: q.wrong_count,
      created_at: q.created_at,
    })
  }

  await questionsStore.fetchAll()
  alert('导入完成！')
}
</script>
