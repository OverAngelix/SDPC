import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ts: true,
}, {
  files: ['**/*.vue'],
  rules: {
    // Les composants Vuetify (v-*) sont auto-importés, les autres doivent être importés
    'vue/no-undef-components': ['error', { ignorePatterns: ['^v-', '^router-'] }],
  },
})
