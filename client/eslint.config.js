import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ts: true,
}, {
  files: ['**/*.vue'],
  rules: {
    // Les composants Vuetify (v-*) sont auto-importés, les autres doivent être importés
    'vue/no-undef-components': ['error', { ignorePatterns: ['^v-', '^router-'] }],
  },
}, {
  // Aucun texte visible en dur dans les gabarits : tout passe par `t('…')` (textes dans src/locales/)
  files: ['src/**/*.vue'],
  plugins: { '@intlify/vue-i18n': vueI18n },
  rules: {
    '@intlify/vue-i18n/no-raw-text': ['error', {
      // Le nom de l'application n'est pas traduit
      ignoreText: ['SDPC', 'https://'],
      // Les attributs qui s'affichent ou se lisent (Vuetify : `label`, `text`, `title`, `hint`…) sont contrôlés aussi
      attributes: { '/.+/': ['title', 'aria-label', 'label', 'text', 'placeholder', 'hint', 'alt'] },
    }],
  },
})
