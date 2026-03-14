import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useQuestionsStore = defineStore('questions', () => {
  const questions = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const filterSubject = ref(null)
  const filterTag = ref(null)
  const filterMastery = ref(null)

  const filtered = computed(() => {
    let list = questions.value
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(item =>
        item.content.toLowerCase().includes(q) ||
        item.subject_name?.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filterSubject.value) list = list.filter(i => i.subject_id === filterSubject.value)
    if (filterTag.value) list = list.filter(i => i.tags?.includes(filterTag.value))
    if (filterMastery.value !== null && filterMastery.value !== undefined) {
      list = list.filter(i => i.mastery === filterMastery.value)
    }
    return list
  })

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase
      .from('questions')
      .select(`*, subjects(name, color), question_tags(tags(name))`)
      .order('created_at', { ascending: false })
    loading.value = false
    if (error) throw error
    questions.value = data.map(normalizeQuestion)
  }

  async function fetchById(id) {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, subjects(name, color), question_tags(tags(name))`)
      .eq('id', id)
      .single()
    if (error) throw error
    return normalizeQuestion(data)
  }

  async function create(payload, tagNames = []) {
    const { tagIds } = await upsertTags(tagNames)
    const { data, error } = await supabase
      .from('questions')
      .insert({
        subject_id: payload.subject_id,
        type: payload.type,
        content: payload.content,
        my_answer: payload.my_answer,
        correct_answer: payload.correct_answer,
        analysis: payload.analysis,
        image_url: payload.image_url,
      })
      .select()
      .single()
    if (error) throw error

    if (tagIds.length > 0) {
      await supabase.from('question_tags').insert(
        tagIds.map(tag_id => ({ question_id: data.id, tag_id }))
      )
    }

    await fetchAll()
    return data
  }

  async function update(id, payload, tagNames = []) {
    const { tagIds } = await upsertTags(tagNames)
    const { error } = await supabase
      .from('questions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await supabase.from('question_tags').delete().eq('question_id', id)
    if (tagIds.length > 0) {
      await supabase.from('question_tags').insert(
        tagIds.map(tag_id => ({ question_id: id, tag_id }))
      )
    }
    await fetchAll()
  }

  async function remove(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) throw error
    questions.value = questions.value.filter(q => q.id !== id)
  }

  async function updateMastery(id, mastery) {
    const { error } = await supabase
      .from('questions')
      .update({ mastery, last_practiced_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    const q = questions.value.find(q => q.id === id)
    if (q) q.mastery = mastery
  }

  async function incrementWrongCount(id) {
    const q = questions.value.find(q => q.id === id)
    const newCount = (q?.wrong_count || 1) + 1
    await supabase.from('questions').update({ wrong_count: newCount }).eq('id', id)
    if (q) q.wrong_count = newCount
  }

  async function saveAiAnalysis(id, aiAnalysis) {
    await supabase.from('questions').update({ ai_analysis: aiAnalysis }).eq('id', id)
    const q = questions.value.find(q => q.id === id)
    if (q) q.ai_analysis = aiAnalysis
  }

  async function upsertTags(tagNames) {
    if (!tagNames.length) return { tagIds: [] }
    const tagIds = []
    for (const name of tagNames) {
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('name', name)
        .maybeSingle()
      if (existing) {
        tagIds.push(existing.id)
      } else {
        const { data: created } = await supabase
          .from('tags')
          .insert({ name })
          .select()
          .single()
        tagIds.push(created.id)
      }
    }
    return { tagIds }
  }

  function normalizeQuestion(q) {
    return {
      ...q,
      subject_name: q.subjects?.name || '',
      subject_color: q.subjects?.color || '#6b7280',
      tags: q.question_tags?.map(qt => qt.tags?.name).filter(Boolean) || [],
    }
  }

  // Stats for charts
  const statsBySubject = computed(() => {
    const map = {}
    for (const q of questions.value) {
      const key = q.subject_name || '未分类'
      map[key] = (map[key] || 0) + 1
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  })

  const statsByTag = computed(() => {
    const map = {}
    for (const q of questions.value) {
      for (const tag of q.tags) {
        map[tag] = (map[tag] || 0) + q.wrong_count
      }
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })

  const statsByWeek = computed(() => {
    const map = {}
    for (const q of questions.value) {
      const week = q.created_at?.slice(0, 10)
      if (week) map[week] = (map[week] || 0) + 1
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }))
  })

  return {
    questions, loading, searchQuery, filterSubject, filterTag, filterMastery,
    filtered, statsBySubject, statsByTag, statsByWeek,
    fetchAll, fetchById, create, update, remove,
    updateMastery, incrementWrongCount, saveAiAnalysis,
  }
})
