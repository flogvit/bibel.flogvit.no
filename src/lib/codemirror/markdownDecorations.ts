import { ViewPlugin, Decoration, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const headingMarker = Decoration.mark({ class: 'cm-md-heading-marker' });
const headingText = Decoration.mark({ class: 'cm-md-heading-text' });
const boldMarker = Decoration.mark({ class: 'cm-md-bold-marker' });
const boldText = Decoration.mark({ class: 'cm-md-bold-text' });
const italicMarker = Decoration.mark({ class: 'cm-md-italic-marker' });
const italicText = Decoration.mark({ class: 'cm-md-italic-text' });
const quoteMarker = Decoration.mark({ class: 'cm-md-quote-marker' });
const quoteLine = Decoration.line({ class: 'cm-md-quote-line' });
const linkText = Decoration.mark({ class: 'cm-md-link-text' });
const linkUrl = Decoration.mark({ class: 'cm-md-link-url' });
const listMarker = Decoration.mark({ class: 'cm-md-list-marker' });
const verseRef = Decoration.mark({ class: 'cm-verse-ref' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { from, to } = view.viewport;

  for (let pos = from; pos < to; ) {
    const line = view.state.doc.lineAt(pos);
    const text = line.text;
    const lineStart = line.from;

    // Heading: ## Text
    const headingMatch = text.match(/^(#{1,6}\s)/);
    if (headingMatch) {
      builder.add(lineStart, lineStart + headingMatch[1].length, headingMarker);
      if (text.length > headingMatch[1].length) {
        builder.add(lineStart + headingMatch[1].length, line.to, headingText);
      }
      pos = line.to + 1;
      continue;
    }

    // Blockquote: > text
    const quoteMatch = text.match(/^(>\s?)/);
    if (quoteMatch) {
      builder.add(lineStart, lineStart, quoteLine);
      builder.add(lineStart, lineStart + quoteMatch[1].length, quoteMarker);
      // Process inline decorations in the rest of the quote line
      addInlineDecorations(builder, text, lineStart, quoteMatch[1].length);
      pos = line.to + 1;
      continue;
    }

    // List markers: - item or 1. item
    const listMatch = text.match(/^(\s*(?:[-*+]|\d+\.)\s)/);
    if (listMatch) {
      builder.add(lineStart, lineStart + listMatch[1].length, listMarker);
      addInlineDecorations(builder, text, lineStart, listMatch[1].length);
      pos = line.to + 1;
      continue;
    }

    // Normal line: just inline decorations
    addInlineDecorations(builder, text, lineStart, 0);
    pos = line.to + 1;
  }

  return builder.finish();
}

function addInlineDecorations(
  builder: RangeSetBuilder<Decoration>,
  text: string,
  lineStart: number,
  startOffset: number,
): void {
  // Collect all inline decorations with their positions, then sort by start position
  const decos: { from: number; to: number; deco: Decoration }[] = [];

  // Bold: **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null) {
    if (m.index < startOffset) continue;
    const absStart = lineStart + m.index;
    decos.push({ from: absStart, to: absStart + 2, deco: boldMarker });
    decos.push({ from: absStart + 2, to: absStart + 2 + m[1].length, deco: boldText });
    decos.push({ from: absStart + 2 + m[1].length, to: absStart + m[0].length, deco: boldMarker });
  }

  // Italic: *text* (not preceded by *)
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  while ((m = italicRegex.exec(text)) !== null) {
    if (m.index < startOffset) continue;
    const absStart = lineStart + m.index;
    // Check this doesn't overlap with a bold match
    const overlaps = decos.some(d =>
      (absStart >= d.from && absStart < d.to) || (absStart + m![0].length > d.from && absStart + m![0].length <= d.to)
    );
    if (overlaps) continue;
    decos.push({ from: absStart, to: absStart + 1, deco: italicMarker });
    decos.push({ from: absStart + 1, to: absStart + 1 + m[1].length, deco: italicText });
    decos.push({ from: absStart + 1 + m[1].length, to: absStart + m[0].length, deco: italicMarker });
  }

  // Verse references: [ref:...] or [vers:...]
  const verseRegex = /\[(ref|vers):[^\]]+\]/g;
  while ((m = verseRegex.exec(text)) !== null) {
    if (m.index < startOffset) continue;
    const absStart = lineStart + m.index;
    decos.push({ from: absStart, to: absStart + m[0].length, deco: verseRef });
  }

  // Links: [text](url) — but not [ref:...] or [vers:...]
  const linkRegex = /\[(?!(?:ref|vers):)([^\]]+)\]\(([^)]+)\)/g;
  while ((m = linkRegex.exec(text)) !== null) {
    if (m.index < startOffset) continue;
    const absStart = lineStart + m.index;
    // [
    decos.push({ from: absStart, to: absStart + 1, deco: linkUrl });
    // text
    decos.push({ from: absStart + 1, to: absStart + 1 + m[1].length, deco: linkText });
    // ](url)
    decos.push({ from: absStart + 1 + m[1].length, to: absStart + m[0].length, deco: linkUrl });
  }

  // Sort by position and add to builder
  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  for (const d of decos) {
    builder.add(d.from, d.to, d.deco);
  }
}

export const markdownDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);
