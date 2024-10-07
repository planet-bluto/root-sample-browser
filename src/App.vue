<script setup lang="ts">
import { coolFetch } from './fetch'
import { Folder, Item } from './types'
import Sample from "./components/Sample.vue"
import { Ref, ref, computed } from 'vue';
import { Events, SelectedID, SelectedIndex, Volume } from './persist';
import clipboard from 'clipboardy';

let items: Ref<Item[]> = ref([])

const getBase64ID = (hex: string) => (
	btoa(
		hex.match(/\w{2}/g).map(
			byte => String.fromCharCode(parseInt(byte, 16))
		).join("")
	).replace(/\+/g, "-").replace(/\//g, "_")
)

let cached_items: Item[]

async function initLoad(cached = false) {
  let fileGardenLinkElem = (document.getElementById("file-garden-link") as HTMLInputElement)
  if (fileGardenLinkElem) {
    Events.emit("KILL_ALL_SAMPLES")
    SelectedIndex.value = 0
    items.value = []

    let fileGardenURL: string = fileGardenLinkElem.value

    let user_id: string = fileGardenURL.split("/")[4]
	  let parent_id: string = fileGardenURL.split("/")[6].replace("#", "")

    if (cached && cached_items != null) { items.value = cached_items } else {
      await surfFolder(user_id, parent_id)
    }

    cached_items = items.value

    print("All Items!", items.value.map((item: Item) => item.name))
  }
}


async function surfFolder(user_id: string, folder_id: string) {
    let apiURL = `https://api.filegarden.com/users/${user_id}/pipe?parent=${folder_id}`

    let obj: Folder = await coolFetch(apiURL)

    let path = "";
    obj.ancestors.forEach(ancestor => {
			path += `/${ancestor.name}`
		})
    
    if (obj != null) {
      await obj.items.awaitForEach(async (item: Item) => {
        if (item.type.includes("audio") || item.type.includes("video")) {
          let direct_link = `https://file.garden/${getBase64ID(user_id)}${path}/${encodeURIComponent(item.name)}`

          await fetch(direct_link)

          item["direct_link"] = direct_link
          item["audio_elem"] = document.createElement("audio")
          item["audio_elem"].preload = "auto"
          item["audio_elem"].volume = 0
          item["audio_elem"].src = direct_link

          if (item["audio_elem"].readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            await new Promise((res, rej) => {
              if (item["audio_elem"] != null) {
                item["audio_elem"].oncanplay = (_e: Event) => {
                    res(null)
                }
              }
            })
          }

          items.value.push(item)
        } else if (item.type == "/") {
          await surfFolder(user_id, item.id)
        }
      })
    }
}

function volumeUpdate(e: Event) {
  if (e.target instanceof HTMLInputElement) {
    Volume.value = Number(e.target.value)

    items.value.forEach((this_item: Item) => {
      if (this_item.audio_elem)
      this_item.audio_elem.volume = Volume.value
    })

    Events.emit("volumeUpdate")
  }
}

const searchQuery = ref("")
function searchUpdate(e) {
  if (e.target instanceof HTMLInputElement) {
    searchQuery.value = e.target.value
    // initLoad(true)
  }
}

Events.on("key_ArrowDown", (e: KeyboardEvent) => {
  e.preventDefault()

  let foundIndex = actualItems.value.findIndex(item => (item.id == SelectedID.value))
  SelectedIndex.value = (foundIndex == -1 ? 0 : foundIndex)

  if (SelectedIndex.value+1 != actualItems.value.length) {
    SelectedIndex.value += 1
  } else {
    SelectedIndex.value = 0
  }

  let selectedItem: Item = actualItems.value[SelectedIndex.value]
  SelectedID.value = selectedItem.id
  playSample(selectedItem, true)

  // Events.emit("selectSample", SelectedIndex.value)
})

Events.on("key_ArrowUp", (e: KeyboardEvent) => {
  e.preventDefault()

  let foundIndex = actualItems.value.findIndex(item => (item.id == SelectedID.value))
  SelectedIndex.value = (foundIndex == -1 ? 0 : foundIndex)

  if (SelectedIndex.value-1 != -1) {
    SelectedIndex.value -= 1
  } else {
    SelectedIndex.value = (actualItems.value.length-1)
  }

  let selectedItem: Item = actualItems.value[SelectedIndex.value]
  SelectedID.value = selectedItem.id
  playSample(selectedItem, true)

  // Events.emit("selectSample", SelectedIndex.value)
})

Events.on("key_Enter", () => {
  let selectedItem: Item = actualItems.value[SelectedIndex.value]
  playSample(selectedItem, true)

  // Events.emit("selectSample", SelectedIndex.value)
})

Events.on("key_ctrl_KeyC", async (e: KeyboardEvent) => {
  let selectedItem: Item = actualItems.value[SelectedIndex.value]
  if (selectedItem.direct_link != null) {
    e.preventDefault();
    print(selectedItem.direct_link)
    await clipboard.write(`!p,d3!${selectedItem.direct_link}`)
  }
})

let keySamples: Object = {}

for (let i = 0; i < 10; i++) {
  Events.on(`key_shift_Digit${i}`, (e: KeyboardEvent) => {
    let currentItem: Item = actualItems.value[SelectedIndex.value]
    if (currentItem.direct_link) {
      let audioElem = new Audio()
      audioElem.src = currentItem.direct_link
      keySamples[String(i) as keyof Object] = (audioElem as any)
    }
  })
  
  Events.on(`key_Digit${i}`, (e: KeyboardEvent) => {
    if (!e.shiftKey) {
      let currentAudioElem = keySamples[String(i) as keyof Object]

      if (currentAudioElem instanceof HTMLAudioElement) {
        currentAudioElem.pause()
        currentAudioElem.currentTime = 0
        currentAudioElem.volume = Volume.value
        currentAudioElem.play()
      }
    }
  })
}

const actualItems = computed(() => {
  return items.value.filter((item: Item) => {
    if (searchQuery.value.length > 0) {
      let bits = searchQuery.value.toLowerCase().split(" ")
      return (bits.some(bit => item.name.toLowerCase().includes(bit)))
    } else {
      return true
    }
  })
})

function playSample(item: Item, isArrowKeys: boolean = false) {
  SelectedID.value = item.id

  let foundIndex = actualItems.value.findIndex(item => (item.id == SelectedID.value))
  SelectedIndex.value = foundIndex

  if (item.audio_elem instanceof HTMLAudioElement) {
    item.audio_elem.currentTime = 0
    item.audio_elem.volume = Volume.value

    items.value.forEach((this_item: Item) => { this_item.audio_elem?.pause() })

    if (isArrowKeys == true) {
        let sampleElem = document.getElementById(`sample-${item.id}`)
        if (sampleElem) {
            sampleElem.scrollIntoView({behavior: "instant", inline: 'center', block: 'center'})
        }
    }

    try {
      item.audio_elem.play()
    } catch(err) {
      print("FUCK", err)
    }
  }
}

</script>

<template>
  <div id="floating-bullshit">
    <p>Hi Hello :)</p>

    <div class="floating-row">
      <input id="file-garden-link" />
      <button @click="initLoad()">LOAD!</button>
    </div>
    
    <div class="floating-row">
      <input id="search-bar" @change="e => searchUpdate(e)" />
      <input id="volume-slider" @input="e => volumeUpdate(e)" @change="e => volumeUpdate(e)" type="range" min="0" max="1" step="0.01" :value="Volume"/>
    </div>
  </div>
  <div id="sample-container">
    <Sample v-for="(item) in actualItems" :item="item" @click="playSample(item)"></Sample>
  </div>
</template>

<style scoped>
#floating-bullshit {
  position: sticky;
  top: 0px;
  z-index: 100;
  width: calc(100% - 30px);
  height: min-content;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 15px;
  background-color: var(--theme-back-3);
}

.floating-row {
  width: 100%;
  display: flex;
}

.floating-row > * { width: 100%; }

#search-bar {
  font-size: 32px;
  color: var(--theme-text-1);
  background: var(--theme-back-1);
  border: none;
  border-radius: 15px;
}

#sample-container {
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%; 
  height: 100%;
}
</style>
