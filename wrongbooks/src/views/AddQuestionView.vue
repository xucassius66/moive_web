<template>
  <AppLayout>
    <div class="p-6 max-w-2xl mx-auto w-full">
      <div class="flex items-center gap-3 mb-6">
        <button class="btn-ghost" @click="router.back()">← 返回</button>
        <h2 class="text-xl font-semibold">{{ isEdit ? '编辑错题' : '添加错题' }}</h2>
      </div>

      <!-- Image uploader -->
      <div v-if="!isEdit" class="card mb-4">
        <h3 class="font-medium text-sm mb-3 text-gray-700">📷 图片识别（可选）</h3>
        <ImageUploader @recognized="onRecognized" />
      </div>

      <!-- Form -->
      <div class="card">
        <form @submit.prevent="submit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">科目 *</label>
              <select v-model="form.subject_id" class="input" required>
                <option value="">请选择科目</option>
                <option v-for="s in subjects.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">题型 *</label>
              <select v-model="form.type" class="input" required>
                <option value="choice">选择题</option>
                <option value="fill">填空题</option>
                <option value="solution">解答题</option>
                <option value="essay">作文</option>
              </select>
            </div>
          </div>

          <div>
            <label class="label">题目内容 *</label>
            <textarea v-model="form.content" class="input resize-none" rows="4" placeholder="输入题目原文..." required></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">我的错误答案</label>
              <textarea v-model="form.my_answer" class="input resize-none" rows="2" placeholder="填写你当时的错误答案..."></textarea>
            </div>
            <div>
              <label class="label">正确答案</label>
              <textarea v-model="form.correct_answer" class="input resize-none" rows="2" placeholder="正确答案..."></textarea>
            </div>
          </div>

          <div>
            <label class="label">解析</label>
            <textarea v-model="form.analysis" class="input resize-none" rows="3" placeholder="知识点解析、解题思路..."></textarea>
          </div>

          <div>
            <label class="label">标签</label>
            <TagInput v-model="form.tags" />
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary flex-1" :disabled="saving">
              {{ saving ? '保存中...' : '保存错题' }}
            </button>
            <button type="button" class="btn-secondary" @click="router.back()">取消</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ImageUploader from '@/components/question/ImageUploader.vue'
import TagInput from '@/components/common/TagInput.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'

const router = useRouter()
const route = useRoute()
const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

const isEdit = !!route.query.id
const saving = ref(false)
const error = ref('')

const form = reactive({
  subject_id: '',
  type: 'solution',
  content: '',
  my_answer: '',
  correct_answer: '',
  analysis: '',
  tags: [],
})

onMounted(async () => {
  await subjects.fetch()
  if (isEdit) {
    const q = await questionsStore.fetchById(route.query.id)
    Object.assign(form, {
      subject_id: q.subject_id,
      type: q.type,
      content: q.content,
      my_answer: q.my_answer || '',
      correct_answer: q.correct_answer || '',
      analysis: q.analysis || '',
      tags: q.tags || [],
    })
  }
})

function onRecognized(data) {
  if (data.content) form.content = data.content
  if (data.type) form.type = data.type
  if (data.correct_answer) form.correct_answer = data.correct_answer
  if (data.analysis) form.analysis = data.analysis
}

async function submit() {
  error.value = ''
  saving.value = true
  try {
    if (isEdit) {
      await questionsStore.update(route.query.id, { ...form }, form.tags)
    } else {
      await questionsStore.create({ ...form }, form.tags)
    }
    router.push('/questions')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
