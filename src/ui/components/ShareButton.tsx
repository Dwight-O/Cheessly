import { useState } from 'react';
import { shareText } from '../../util/share';
import ui from '../styles/ui.module.css';

interface ShareButtonProps {
  text: string;
  label?: string;
}

/** One tap: Web Share where it exists, clipboard everywhere else. */
export default function ShareButton({ text, label = 'Share' }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function onClick() {
    const outcome = await shareText(text);
    if (outcome === 'copied') setFeedback('Copied to clipboard');
    else if (outcome === 'failed') setFeedback('Could not share');
    else setFeedback(null);
    if (outcome !== 'shared') setTimeout(() => setFeedback(null), 2200);
  }

  return (
    <>
      <button type="button" className={ui.secondary} onClick={() => void onClick()}>
        {label}
      </button>
      <span aria-live="polite" className={ui.tagline}>
        {feedback}
      </span>
    </>
  );
}
