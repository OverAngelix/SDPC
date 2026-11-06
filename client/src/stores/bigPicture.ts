import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRememberedBigPicture, writeRememberedBigPicture } from '@/utils/rememberedBigPicture'

/**
 * Mode big picture : la grille occupe tout l'écran. Retenu sur l'appareil (pas sur le compte) :
 * un rechargement de la page retrouve le mode.
 */
export const useBigPictureStore = defineStore('bigPicture', () => {
  const active = ref(readRememberedBigPicture())

  function set (value: boolean) {
    active.value = value
    writeRememberedBigPicture(value)
  }

  function enter () {
    set(true)
  }

  function exit () {
    set(false)
  }

  function toggle () {
    set(!active.value)
  }

  return { active, enter, exit, toggle }
})
