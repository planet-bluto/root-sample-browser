<script setup lang="ts">
import { SelectedID } from '../persist';
import { Item } from '../types';

const props = defineProps<{
    item: Item;
}>()
</script>

<template>
    <div :id="`sample-${props.item.id}`" class="sample-container" :selected="(SelectedID == props.item.id)">
        <p>{{ props.item.name }}</p>
        <!-- <audio :src="props.src" controls></audio> -->
    </div>
</template>

<style scoped>
.sample-container {
    opacity: 0.5;
    font-size: 32px;
    font-weight: bolder;
    display: flex;
    gap: 16px;
    width: calc(100% - 30px);
    height: calc(64px - 30px);
    padding: 15px;
    background-color: var(--theme-back-3);
    border-radius: 15px;
    transition: opacity 100ms;
    user-select: none;
}

.sample-container[selected=true] {
    opacity: 1;
}

.sample-container[loaded=false] {
    opacity: 0.1;
}
</style>
