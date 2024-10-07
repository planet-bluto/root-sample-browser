import { Ref, ref } from "vue";
import EventEmitter from "eventemitter3";

export const Volume: Ref<number> = ref(0.5)
export const SelectedID: Ref<string> = ref("")
export const SelectedIndex: Ref<number> = ref(0)

class EventsClass extends EventEmitter {}

export const Events = new EventsClass()

document.body.addEventListener("keydown", (e: KeyboardEvent) => {
    Events.emit(`key_${e.code}`, e)

    if (e.ctrlKey) {Events.emit(`key_ctrl_${e.code}`, e)}
    if (e.shiftKey) {Events.emit(`key_shift_${e.code}`, e)}
    if (e.altKey) {Events.emit(`key_alt_${e.code}`, e)}

    if (e.shiftKey && e.altKey) {Events.emit(`key_shift_alt_${e.code}`, e)}

    if (e.ctrlKey && e.shiftKey) {Events.emit(`key_ctrl_shift_${e.code}`, e)}
    if (e.ctrlKey && e.altKey) {Events.emit(`key_ctrl_alt_${e.code}`, e)}

    if (e.ctrlKey && e.shiftKey && e.altKey) {Events.emit(`key_ctrl_shift_alt_${e.code}`, e)}
  })