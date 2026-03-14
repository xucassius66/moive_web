<template>
  <div>
    <div class="flex flex-wrap gap-1.5 mb-2">
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="badge bg-blue-50 text-blue-600 gap-1"
      >
        {{ tag }}
        <button @click="remove(tag)" class="hover:text-red-500 ml-0.5">✕</button>
      </span>
    </div>
    <div class="flex gap-2">
      <input
        v-model="input"
        class="input flex-1"
        placeholder="输入标签后按 Enter 添加"
        @keydown.enter.prevent="add"
        @keydown.comma.prevent="add"
      />
      <button type="button" class="btn-secondary px-3" @click="add">添加</button>
    </div>
    <p class="text-xs text-gray-400 mt-1">例：方程、函数、实词（按 Enter 或逗号分隔）</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])
const input = ref('')

function add() {
  const val = input.value.trim().replace(/,/g, '')
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  input.value = ''
}

function remove(tag) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}
</script>
