// QuickTranslate ESLint 扁平配置（Flat Config / ESLint 9）
// 仅做基础语法与变量检查，不引入框架插件，避免对 MV3 扩展代码的误报。

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // 浏览器 / 扩展运行时
        chrome: 'readonly',
        browser: 'readonly',
        self: 'readonly',
        globalThis: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        // 常见 Web API
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        XMLHttpRequest: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // 第三方全局
        Tesseract: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-duplicate-case': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    ignores: [
      'node_modules/**',
      '*.min.js',
      'releases/**',
      'packages/create-qt-module/templates/**'
    ]
  }
]
