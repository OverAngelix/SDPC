import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Mode big picture : la grille occupe tout l'écran. Un état du moment, non enregistré sur le compte. */
export const useBigPictureStore = defineStore('bigPicture', () => {
  const active = ref(false)

  function enter () {
    active.value = true
  }

  function exit () {
    active.value = false
  }

  return { active, enter, exit }
})
