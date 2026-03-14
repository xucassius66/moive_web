import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

const DEFAULT_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899']
const DEFAULT_SUBJECTS = ['语文','数学','英语','物理','化学','生物','历史','地理','政治']

export const useSubjectsStore = defineStore('subjects', () => {
  const subjects = ref([])

  async function fetch() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at')
    if (error) throw error
    subjects.value = data
  }

  async function create(name, color) {
    const idx = subjects.value.length % DEFAULT_COLORS.length
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, color: color || DEFAULT_COLORS[idx] })
      .select()
      .single()
    if (error) throw error
    subjects.value.push(data)
    return data
  }

  async function remove(id) {
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) throw error
    subjects.value = subjects.value.filter(s => s.id !== id)
  }

  async function ensureDefaults() {
    if (subjects.value.length > 0) return
    for (let i = 0; i < DEFAULT_SUBJECTS.length; i++) {
      await create(DEFAULT_SUBJECTS[i], DEFAULT_COLORS[i % DEFAULT_COLORS.length])
    }
  }

  return { subjects, fetch, create, remove, ensureDefaults, DEFAULT_SUBJECTS }
})
