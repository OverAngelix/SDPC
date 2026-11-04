import { useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import i18n from './i18n'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'system',
  },
  // Les textes de Vuetify suivent la langue de vue-i18n
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
})
