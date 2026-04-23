<script setup lang="ts">
import { ref, nextTick } from 'vue'

const isEmbed = new URLSearchParams(window.location.search).has('embed')
import type { Message } from './types'
import MessageBubble from './components/MessageBubble.vue'
import ChatInput from './components/ChatInput.vue'

const messages = ref<Message[]>([])
const isLoading = ref(false)
const chatBody = ref<HTMLElement>()

const scrollToBottom = async () => {
  await nextTick()
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}

const sendMessage = async (content: string) => {
  if (!content.trim() || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: content.trim(),
    createdAt: new Date(),
  })

  // 添加空的助手消息占位（流式填充）
  const assistantId = crypto.randomUUID()
  messages.value.push({
    id: assistantId,
    role: 'assistant',
    content: '',
    createdAt: new Date(),
  })

  isLoading.value = true
  await scrollToBottom()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 发给后端的消息：去掉最后那个空的助手占位
        messages: messages.value
          .slice(0, -1)
          .map(({ role, content }) => ({ role, content })),
      }),
    })

    if (!response.ok || !response.body) throw new Error('请求失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const assistantMsg = messages.value.find((m) => m.id === assistantId)!

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            assistantMsg.content += parsed.text
            await scrollToBottom()
          }
          if (parsed.error) {
            assistantMsg.content = `出错了：${parsed.error}`
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }
  } catch (err) {
    const assistantMsg = messages.value.find((m) => m.id === assistantId)
    if (assistantMsg) assistantMsg.content = '网络错误，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="chat-app">
    <header v-if="!isEmbed" class="chat-header">
      <div class="header-inner">
        <div class="ai-avatar">AI</div>
        <div>
          <h1>AI 助手</h1>
          <span class="status-dot" />
          <span class="status-text">在线</span>
        </div>
      </div>
    </header>

    <main ref="chatBody" class="chat-body">
      <div v-if="messages.length === 0" class="welcome">
        <div class="welcome-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h2>你好，有什么可以帮你的？</h2>
        <p>在下方输入你的问题开始对话</p>
      </div>

      <MessageBubble v-for="msg in messages" :key="msg.id" :message="msg" />
    </main>

    <footer class="chat-footer">
      <ChatInput :disabled="isLoading" @send="sendMessage" />
    </footer>
  </div>
</template>

<style scoped>
.chat-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
}

/* ---- 顶部 Header ---- */
.chat-header {
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

h1 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 2px;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}

.status-text {
  font-size: 12px;
  opacity: 0.85;
  vertical-align: middle;
}

/* ---- 消息区 ---- */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  background: #f7f8fa;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  text-align: center;
  color: #666;
  gap: 12px;
}

.welcome-icon svg {
  width: 64px;
  height: 64px;
  color: #9ca3af;
}

.welcome h2 {
  font-size: 20px;
  color: #374151;
  font-weight: 600;
}

.welcome p {
  font-size: 14px;
  color: #9ca3af;
}

/* ---- 底部输入区 ---- */
.chat-footer {
  padding: 12px 16px 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}
</style>
