<script setup lang="ts">
import { Ref, ref } from 'vue';
import { Volume, Events, SelectedIndex } from '../persist';

const props = defineProps(['name', 'src', 'ind'])

let audioLoaded: Ref<boolean> = ref(false)
let audioElem = document.createElement("audio")

audioElem.preload = "auto"
audioElem.volume = 0
audioElem.src = props.src

if (audioElem.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    audioElem.oncanplay = (_e: Event) => {
        audioLoaded.value = true
    }
}

function playAudio(isArrowKeys: boolean = false) {
    SelectedIndex.value = props.ind
    try {
        audioElem.currentTime = 0
        audioElem.volume = Volume.value
        audioElem.play()

        Events.emit("samplePlay", props.ind)

        if (isArrowKeys == true) {
            let sampleElem = document.getElementById(`sample-${props.ind}`)
            if (sampleElem) {
                sampleElem.scrollIntoView({behavior: "instant", inline: 'center', block: 'center'})
            }
        }
    } catch(err) {
        print("Fuck you, you fuckin' dick", err)
    }
}

var events: Object = {};

type coolFunction = (...args: any[]) => void

function registerEvent(key: string, listener: coolFunction) {
    events[key as keyof Object] = (listener as any)
    Events.on(key, listener)
}

registerEvent("selectSample", (ind: number) => {
    if (ind == props.ind) {
        playAudio(true)
    }
})

registerEvent("samplePlay", (ind: number) => {
    if (ind != props.ind && (!audioElem.paused)) {
        // print("SHUT UP!!")
        audioElem.pause()
    }
})

registerEvent("volumeUpdate", () => {
    audioElem.volume = Volume.value
})

registerEvent("KILL_ALL_SAMPLES", () => {
    Object.keys(events).forEach(key => {
        let listener = (events[key as keyof Object] as coolFunction)
        Events.removeListener(key, listener)
    })

    audioElem.remove()
})
</script>

<template>
    <div :id="`sample-${props.ind}`" class="sample-container" @click="playAudio" :selected="(SelectedIndex == props.ind)" :loaded="audioLoaded">
        <p>{{ props.name }}</p>
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
