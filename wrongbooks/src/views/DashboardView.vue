<template>
  <AppLayout>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">仪表板</h2>
        <span class="text-sm text-gray-400">{{ today }}</span>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center">
          <p class="text-3xl font-bold text-red-500">{{ total }}</p>
          <p class="text-xs text-gray-500 mt-1">总错题数</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-orange-400">{{ unmastered }}</p>
          <p class="text-xs text-gray-500 mt-1">待掌握</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-blue-400">{{ mastered }}</p>
          <p class="text-xs text-gray-500 mt-1">已掌握</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-green-400">{{ subjects.subjects.length }}</p>
          <p class="text-xs text-gray-500 mt-1">科目数</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Subject distribution pie -->
        <div class="card">
          <h3 class="font-medium text-sm mb-4">各科目错题分布</h3>
          <v-chart class="h-56" :option="pieOption" autoresize />
        </div>

        <!-- Trend line -->
        <div class="card">
          <h3 class="font-medium text-sm mb-4">近 14 天错题趋势</h3>
          <v-chart class="h-56" :option="lineOption" autoresize />
        </div>
      </div>

      <!-- Weak tags bar -->
      <div class="card">
        <h3 class="font-medium text-sm mb-4">薄弱知识点 Top 10</h3>
        <div v-if="questionsStore.statsByTag.length === 0" class="text-center py-8 text-gray-400 text-sm">
          添加带标签的错题后将自动统计
        </div>
        <v-chart v-else class="h-56" :option="barOption" autoresize />
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useQuestionsStore } from '@/stores/questions.js'
import { useSubjectsStore } from '@/stores/subjects.js'

use([CanvasRenderer, PieChart, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const questionsStore = useQuestionsStore()
const subjects = useSubjectsStore()

onMounted(() => {
  questionsStore.fetchAll()
  subjects.fetch()
})

const today = new Date().toLocaleDateString('zh-CN')
const total = computed(() => questionsStore.questions.length)
const unmastered = computed(() => questionsStore.questions.filter(q => q.mastery < 2).length)
const mastered = computed(() => questionsStore.questions.filter(q => q.mastery >= 2).length)

const pieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 题 ({d}%)' },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie',
    radius: ['35%', '65%'],
    center: ['50%', '45%'],
    data: questionsStore.statsBySubject.map(s => ({ name: s.name, value: s.count })),
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 12 } },
  }],
}))

const lineOption = computed(() => {
  const data = questionsStore.statsByWeek
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.map(d => d.date.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10 } },
    series: [{
      type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: '#ef4444' },
    }],
  }
})

const barOption = computed(() => {
  const data = questionsStore.statsByTag
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: data.map(d => d.name).reverse(), axisLabel: { fontSize: 10 } },
    series: [{
      type: 'bar',
      data: data.map(d => d.count).reverse(),
      itemStyle: { color: '#ef4444', borderRadius: [0, 4, 4, 0] },
    }],
  }
})
</script>
