import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase.js'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/questions', name: 'Questions', component: () => import('@/views/QuestionsView.vue') },
  { path: '/questions/add', name: 'AddQuestion', component: () => import('@/views/AddQuestionView.vue') },
  { path: '/questions/:id', name: 'QuestionDetail', component: () => import('@/views/QuestionDetailView.vue') },
  { path: '/practice', name: 'Practice', component: () => import('@/views/PracticeView.vue') },
  { path: '/analysis', name: 'Analysis', component: () => import('@/views/AnalysisView.vue') },
  { path: '/print', name: 'Print', component: () => import('@/views/PrintView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { name: 'Login' }
  return true
})

export default router
