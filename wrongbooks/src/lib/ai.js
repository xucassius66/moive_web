/**
 * AI service abstraction layer
 * Supports: claude (via Supabase Edge Function proxy) | qwen | glm
 *
 * In production (China mainland), calls go through Supabase Edge Functions
 * to avoid direct Claude API connectivity issues.
 */

import { supabase } from './supabase.js'

const provider = import.meta.env.VITE_AI_PROVIDER || 'claude'

// ─── Internal helpers ────────────────────────────────────────────────────────

async function callClaudeEdge(action, payload) {
  const { data, error } = await supabase.functions.invoke(`ai-proxy`, {
    body: { action, ...payload },
  })
  if (error) throw new Error(error.message)
  return data
}

async function callQwen(messages) {
  const resp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      input: { messages },
    }),
  })
  const data = await resp.json()
  return data.output?.text || ''
}

async function callGLM(messages) {
  const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_GLM_API_KEY}`,
    },
    body: JSON.stringify({ model: 'glm-4v', messages }),
  })
  const data = await resp.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Recognize a question from a base64 image.
 * Returns { content, type, correct_answer, analysis }
 */
export async function recognizeQuestionImage(base64Image, mimeType = 'image/jpeg') {
  const prompt = `你是一个专业的题目识别助手。请从图片中提取题目信息，输出严格 JSON 格式（不含 markdown 代码块）：
{"content":"题目原文","type":"choice|fill|solution|essay","correct_answer":"正确答案（如有，否则空字符串）","analysis":"解析（如有，否则空字符串）"}
只输出 JSON，不要任何其他文字。`

  if (provider === 'claude') {
    return callClaudeEdge('recognize', { image: base64Image, mimeType, prompt })
  }

  if (provider === 'qwen') {
    const text = await callQwen([
      { role: 'user', content: [{ image: `data:${mimeType};base64,${base64Image}` }, { text: prompt }] },
    ])
    return JSON.parse(text)
  }

  if (provider === 'glm') {
    const text = await callGLM([
      { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }, { type: 'text', text: prompt }] },
    ])
    return JSON.parse(text)
  }

  throw new Error(`Unknown AI provider: ${provider}`)
}

/**
 * Analyze weak points from a list of wrong questions.
 * Returns markdown string.
 */
export async function analyzeWeakPoints(questions) {
  const questionsSummary = questions.slice(0, 30).map(q => ({
    subject: q.subject_name,
    content: q.content.slice(0, 100),
    tags: q.tags,
    wrong_count: q.wrong_count,
  }))

  const prompt = `以下是学生的错题记录（JSON）：
${JSON.stringify(questionsSummary, null, 2)}

请分析并输出 Markdown 格式报告，包含：
1. **主要薄弱知识点**（Top 5，每点列出具体知识点名称）
2. **错误原因归类**（概念模糊/粗心/方法缺失等）
3. **针对性学习建议**（每点不超过 60 字）
4. **薄弱知识点列表**（纯 JSON 数组，放在报告最后，格式：["知识点1","知识点2",...]）`

  if (provider === 'claude') {
    return callClaudeEdge('analyze', { prompt })
  }

  if (provider === 'qwen') {
    return callQwen([{ role: 'user', content: prompt }])
  }

  if (provider === 'glm') {
    return callGLM([{ role: 'user', content: prompt }])
  }
}

/**
 * Generate practice questions for a specific weak point.
 * Returns array of { type, content, correct_answer, analysis }
 */
export async function generatePracticeQuestions(weakPoint, subjectName, count = 3) {
  const prompt = `你是一位专业的${subjectName}老师。学生的薄弱知识点是：【${weakPoint}】。
请出 ${count} 道对应的练习题（难度适中），输出严格 JSON 数组（不含 markdown 代码块）：
[{"type":"choice|fill|solution","content":"题目内容","correct_answer":"正确答案","analysis":"解析（≤80字）"}]
只输出 JSON 数组，不要任何其他文字。`

  if (provider === 'claude') {
    return callClaudeEdge('generate', { prompt })
  }

  if (provider === 'qwen') {
    const text = await callQwen([{ role: 'user', content: prompt }])
    return JSON.parse(text)
  }

  if (provider === 'glm') {
    const text = await callGLM([{ role: 'user', content: prompt }])
    return JSON.parse(text)
  }
}

/**
 * Analyze a single question and give improvement suggestions.
 * Returns markdown string.
 */
export async function analyzeQuestion(question) {
  const prompt = `请分析以下错题并给出学习建议（输出 Markdown，不超过 200 字）：
科目：${question.subject_name || '未知'}
题目：${question.content}
我的答案：${question.my_answer || '未填写'}
正确答案：${question.correct_answer || '未知'}
错误次数：${question.wrong_count}

请分析：错误原因、知识盲点、如何避免同类错误。`

  if (provider === 'claude') {
    return callClaudeEdge('analyze', { prompt })
  }

  if (provider === 'qwen') {
    return callQwen([{ role: 'user', content: prompt }])
  }

  if (provider === 'glm') {
    return callGLM([{ role: 'user', content: prompt }])
  }
}
