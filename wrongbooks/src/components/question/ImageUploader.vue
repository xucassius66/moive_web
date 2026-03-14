<template>
  <div>
    <div
      class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-red-300 transition-colors cursor-pointer"
      :class="{ 'border-red-400 bg-red-50': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <div v-if="!previewUrl">
        <div class="text-3xl mb-2">📷</div>
        <p class="text-sm text-gray-500">拖拽图片或点击上传</p>
        <p class="text-xs text-gray-400 mt-1">支持 JPG、PNG、WEBP，最大 10MB</p>
      </div>
      <div v-else class="relative inline-block">
        <img :src="previewUrl" class="max-h-48 rounded-lg mx-auto" alt="预览" />
        <button
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          @click.stop="clear"
        >✕</button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

    <button
      v-if="previewUrl && !recognizing && !result"
      class="btn-primary mt-3 w-full"
      @click="recognize"
    >🔍 AI 识别题目</button>

    <div v-if="recognizing" class="mt-3 text-center text-sm text-gray-500 animate-pulse">
      正在识别中...
    </div>

    <div v-if="error" class="mt-2 text-red-500 text-xs">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { recognizeQuestionImage } from '@/lib/ai.js'

const emit = defineEmits(['recognized'])

const fileInput = ref(null)
const previewUrl = ref('')
const base64Data = ref('')
const mimeType = ref('image/jpeg')
const dragging = ref(false)
const recognizing = ref(false)
const result = ref(null)
const error = ref('')

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function processFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    error.value = '图片不能超过 10MB'
    return
  }
  mimeType.value = file.type || 'image/jpeg'
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    base64Data.value = e.target.result.split(',')[1]
  }
  reader.readAsDataURL(file)
  error.value = ''
  result.value = null
}

async function recognize() {
  recognizing.value = true
  error.value = ''
  try {
    const data = await recognizeQuestionImage(base64Data.value, mimeType.value)
    result.value = data
    emit('recognized', data)
  } catch (e) {
    error.value = `识别失败：${e.message}`
  } finally {
    recognizing.value = false
  }
}

function clear() {
  previewUrl.value = ''
  base64Data.value = ''
  result.value = null
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>
