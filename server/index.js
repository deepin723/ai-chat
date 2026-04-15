import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()

// 允许前端开发服务器跨域访问
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/chat
 * body: { messages: [{ role: 'user'|'assistant', content: string }] }
 *
 * 返回 SSE 流：
 *   data: {"text": "..."}\n\n   —— 每个文本片段
 *   data: [DONE]\n\n            —— 结束标志
 */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '消息格式不正确' })
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    // 调用 OpenAI 流式接口
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // 便宜且够用，可改成 gpt-4o 等
      messages: [
        {
          role: 'system',
          content: '你是一个有帮助的 AI 助手。用用户使用的语言回答问题。',
        },
        ...messages,
      ],
      stream: true,
    })

    // 逐块转发给前端
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误'
    console.error('[/api/chat error]', message)
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

// 健康检查接口（部署时有用）
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
