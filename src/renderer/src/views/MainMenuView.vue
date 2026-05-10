<template><div class="main-menu"><h1>Main Menu</h1><button class="btn primary" @click="emit('start-game')">新游戏</button></div></template>
<script setup lang="ts">
const emit = defineEmits<{ 'start-game': [] }>()
</script>
