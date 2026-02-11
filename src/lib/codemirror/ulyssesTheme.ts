import { EditorView } from '@codemirror/view';

const baseTheme = EditorView.baseTheme({
  '&': {
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  '.cm-content': {
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    padding: '1rem',
  },
  '.cm-line': {
    padding: '1px 0',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  // Heading markers (##)
  '.cm-md-heading-marker': {
    opacity: '0.3',
    fontSize: '0.85em',
  },
  // Heading text
  '.cm-md-heading-text': {
    fontSize: '1.4em',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: '600',
    lineHeight: '1.3',
  },
  // Bold markers (**)
  '.cm-md-bold-marker': {
    opacity: '0.3',
  },
  // Bold text
  '.cm-md-bold-text': {
    fontWeight: '600',
  },
  // Italic markers (*)
  '.cm-md-italic-marker': {
    opacity: '0.3',
  },
  // Italic text
  '.cm-md-italic-text': {
    fontStyle: 'italic',
  },
  // Quote marker (>)
  '.cm-md-quote-marker': {
    opacity: '0.3',
  },
  // Quote line
  '.cm-md-quote-line': {
    borderLeft: '3px solid #c9a959',
    paddingLeft: '0.75rem',
    marginLeft: '0.25rem',
  },
  // Link text
  '.cm-md-link-text': {
    textDecoration: 'underline',
  },
  // Link URL
  '.cm-md-link-url': {
    opacity: '0.5',
  },
  // List markers
  '.cm-md-list-marker': {
    fontWeight: '600',
  },
  // Verse reference chip
  '.cm-verse-ref': {
    padding: '1px 4px',
    borderRadius: '3px',
  },
});

export const lightTheme = [
  baseTheme,
  EditorView.theme({
    '&': {
      backgroundColor: '#ffffff',
      color: '#333333',
    },
    '.cm-content': {
      caretColor: '#2c3e50',
    },
    '.cm-cursor': {
      borderLeftColor: '#2c3e50',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#c9a95933',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#c9a95944',
    },
    '.cm-activeLine': {
      backgroundColor: '#faf8f5',
    },
    '.cm-md-heading-text': {
      color: '#2c3e50',
    },
    '.cm-md-link-text': {
      color: '#0066aa',
    },
    '.cm-md-list-marker': {
      color: '#7a6328',
    },
    '.cm-verse-ref': {
      color: '#0066aa',
      backgroundColor: '#fff8e1',
    },
    '.cm-md-quote-line': {
      borderLeftColor: '#c9a959',
    },
  }),
];

export const darkTheme = [
  baseTheme,
  EditorView.theme({
    '&': {
      backgroundColor: '#16213e',
      color: '#e2e8f0',
    },
    '.cm-content': {
      caretColor: '#e2e8f0',
    },
    '.cm-cursor': {
      borderLeftColor: '#e2e8f0',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#f0c67433',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#f0c67444',
    },
    '.cm-activeLine': {
      backgroundColor: '#1a1a2e',
    },
    '.cm-md-heading-text': {
      color: '#e2e8f0',
    },
    '.cm-md-link-text': {
      color: '#63b3ed',
    },
    '.cm-md-list-marker': {
      color: '#f0c674',
    },
    '.cm-verse-ref': {
      color: '#63b3ed',
      backgroundColor: '#3d3d1a',
    },
    '.cm-md-quote-line': {
      borderLeftColor: '#f0c674',
    },
  }),
];
