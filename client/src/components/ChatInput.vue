<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ send: [content: string] }>()

const input = ref('')
const textarea = ref<HTMLTextAreaElement>()

// 自动撑高输入框
const autoResize = () => {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const handleSend = () => {
  const text = input.value.trim()
  if (!text) return
  emit('send', text)
  input.value = ''
  // 重置高度
  if (textarea.value) textarea.value.style.height = 'auto'
}

// Enter 发送，Shift+Enter 换行
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="input-area">
    <textarea
      ref="textarea"
      v-model="input"
      :disabled="disabled"
      placeholder="输入消息…（Enter 发送，Shift+Enter 换行）"
      rows="1"
      @keydown="handleKeydown"
      @input="autoResize"
    />
    <button :disabled="disabled || !input.trim()" @click="handleSend" title="发送">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  padding: 11px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 22px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
  color: #1f2937;
  transition: border-color 0.15s;
}

textarea:focus {
  border-color: #667eea;
}

textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

button {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, transform 0.1s;
}

button:hover:not(:disabled) {
  transform: scale(1.06);
}

button:active:not(:disabled) {
  transform: scale(0.96);
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

button svg {
  width: 20px;
  height: 20px;
}
</style>
