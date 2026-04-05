import { InlineRefs } from '@/components/InlineRefs';
import styles from './DevotionalMarkdown.module.scss';

interface DevotionalMarkdownProps {
  content: string;
}

/**
 * Render devotional content with Markdown formatting and inline bracket references.
 * Delegates all [ref:], [tema:], [person:], etc. handling to InlineRefs.
 */
export function DevotionalMarkdown({ content }: DevotionalMarkdownProps) {
  return (
    <div className={styles.markdown}>
      <InlineRefs markdown>{content}</InlineRefs>
    </div>
  );
}
