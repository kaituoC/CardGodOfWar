<template>
  <div class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog">
      <h3>保存进度</h3>
      <div class="save-options">
        <div v-for="i in 3" :key="i" class="save-option" @click="$emit('save', i)">
          <span>存档 {{ i }}</span>
        </div>
      </div>
      <button class="btn secondary" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ save: [slot: number]; cancel: [] }>()
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #16213e;
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  text-align: center;
  h3 { margin-bottom: 16px; }
}

.save-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.save-option {
  padding: 10px;
  background: #1a1a2e;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #2c3e50; }
}
</style>
