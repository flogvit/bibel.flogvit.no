import { useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Compartment } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { lightTheme, darkTheme } from '@/lib/codemirror/ulyssesTheme';
import { markdownDecorations } from '@/lib/codemirror/markdownDecorations';
import { verseAutocomplete } from '@/lib/codemirror/verseAutocomplete';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface MarkdownEditorHandle {
  view: EditorView | undefined;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, placeholder, className }, ref) {
    const cmRef = useRef<ReactCodeMirrorRef>(null);
    const themeCompartment = useRef(new Compartment());
    const isDarkRef = useRef(document.documentElement.classList.contains('dark'));

    useImperativeHandle(ref, () => ({
      get view() {
        return cmRef.current?.view;
      },
    }));

    // Observe html.dark class changes
    useEffect(() => {
      const observer = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark !== isDarkRef.current) {
          isDarkRef.current = isDark;
          const view = cmRef.current?.view;
          if (view) {
            view.dispatch({
              effects: themeCompartment.current.reconfigure(isDark ? darkTheme : lightTheme),
            });
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    }, []);

    const extensions = useMemo(() => {
      const isDark = document.documentElement.classList.contains('dark');
      return [
        markdown(),
        markdownDecorations,
        autocompletion({
          override: [verseAutocomplete],
          activateOnTyping: true,
        }),
        keymap.of([indentWithTab]),
        themeCompartment.current.of(isDark ? darkTheme : lightTheme),
      ];
    }, []);

    return (
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        className={className}
        height="100%"
        style={{ flex: 1, minHeight: 0 }}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          drawSelection: true,
          bracketMatching: false,
          indentOnInput: false,
        }}
      />
    );
  },
);
