<script setup lang="ts">
import type { Message } from '../types'

defineProps<{ message: Message }>()
</script>

<template>
  <div class="row" :class="message.role">
    <div class="bubble" :class="message.role">
      <!-- 等待回复时显示打点动画 -->
      <div v-if="message.role === 'assistant' && !message.content" class="typing">
        <span /><span /><span />
      </div>
      <!-- 正常显示内容 -->
      <p v-else>{{ message.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  margin: 6px 0;
  animation: fadeUp 0.2s ease;
}

.row.user {
  justify-content: flex-end;
}

.row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 72%;
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

.bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble.assistant {
  background: white;
  color: #1f2937;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.bubble p {
  margin: 0;
  white-space: pre-wrap;
}

/* 打点加载动画 */
.typing {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 2px 0;
}

.typing span {
  display: block;
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
