// Hand-tuned syntax themes that match the paper / night-ink palette.
// Used for both markdown fences and MDX code blocks.

const paper = {
  name: 'ink-paper',
  type: 'light',
  colors: {
    'editor.background': '#f8f3e7',
    'editor.foreground': '#2b2723',
    'editorLineNumber.foreground': '#b4a992',
    'editorLineNumber.activeForeground': '#7d7568',
    'editor.selectionBackground': '#e8dfc9',
    'editor.lineHighlightBackground': '#f3ecdb',
  },
  settings: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#9a9184', fontStyle: 'italic' } },
    { scope: ['string', 'constant.other.symbol', 'markup.inline.raw'], settings: { foreground: '#5c7355' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#a3713a' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#8d4a3f' } },
    { scope: ['keyword.operator'], settings: { foreground: '#6b6255' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#3d5a63' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'entity.other.inherited-class'], settings: { foreground: '#7a6248' } },
    { scope: ['variable', 'variable.parameter', 'meta.definition.variable'], settings: { foreground: '#2b2723' } },
    { scope: ['variable.other.property', 'meta.object-literal.key', 'support.type.property-name'], settings: { foreground: '#4f6b5d' } },
    { scope: ['entity.name.tag', 'punctuation.definition.tag'], settings: { foreground: '#8d4a3f' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#7a6248' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#8b8172' } },
    { scope: ['markup.heading', 'markup.heading.markdown'], settings: { foreground: '#3d5a63', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { foreground: '#2b2723', fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.quote'], settings: { foreground: '#7d7568' } },
    { scope: ['markup.inserted'], settings: { foreground: '#5c7355' } },
    { scope: ['markup.deleted'], settings: { foreground: '#a15248' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#a15248', fontStyle: 'underline' } },
  ],
};

const night = {
  name: 'ink-night',
  type: 'dark',
  colors: {
    'editor.background': '#1c1a16',
    'editor.foreground': '#ded6c6',
    'editorLineNumber.foreground': '#5a5347',
    'editorLineNumber.activeForeground': '#8d8577',
    'editor.selectionBackground': '#3a362e',
    'editor.lineHighlightBackground': '#232019',
  },
  settings: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6f6a5c', fontStyle: 'italic' } },
    { scope: ['string', 'constant.other.symbol', 'markup.inline.raw'], settings: { foreground: '#9db58f' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#d0a06a' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#d08a76' } },
    { scope: ['keyword.operator'], settings: { foreground: '#a89c86' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#8fb3bd' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'entity.other.inherited-class'], settings: { foreground: '#c8b18c' } },
    { scope: ['variable', 'variable.parameter', 'meta.definition.variable'], settings: { foreground: '#ded6c6' } },
    { scope: ['variable.other.property', 'meta.object-literal.key', 'support.type.property-name'], settings: { foreground: '#a3bda9' } },
    { scope: ['entity.name.tag', 'punctuation.definition.tag'], settings: { foreground: '#d08a76' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#c8b18c' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#8a8172' } },
    { scope: ['markup.heading', 'markup.heading.markdown'], settings: { foreground: '#8fb3bd', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { foreground: '#f0e8d8', fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.quote'], settings: { foreground: '#9a9282' } },
    { scope: ['markup.inserted'], settings: { foreground: '#9db58f' } },
    { scope: ['markup.deleted'], settings: { foreground: '#d08a76' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#d08a76', fontStyle: 'underline' } },
  ],
};

export const inkPaper = paper;
export const inkNight = night;
