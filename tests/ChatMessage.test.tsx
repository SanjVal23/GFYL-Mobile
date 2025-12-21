
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChatMessage from '../src/components/ChatMessage';
import { Message } from '../src/types';

describe('ChatMessage Formatting', () => {
  it('should render bold text correctly', () => {
    const msg: Message = { id: '1', sender: 'bot', text: 'This is **essential** truth.' };
    const { container } = render(<ChatMessage message={msg} />);
    const boldElement = container.querySelector('strong');
    expect(boldElement).toHaveTextContent('essential');
    expect(boldElement).toHaveClass('text-amber-300');
  });

  it('should render blockquotes for mantras', () => {
    const msg: Message = { id: '1', sender: 'bot', text: '> This is a mantra.' };
    const { container } = render(<ChatMessage message={msg} />);
    const quoteElement = container.querySelector('.border-l-2');
    expect(quoteElement).toHaveTextContent('This is a mantra.');
  });

  it('should render horizontal rules for section breaks', () => {
    const msg: Message = { id: '1', sender: 'bot', text: 'Line one\n---\nLine two' };
    const { container } = render(<ChatMessage message={msg} />);
    const hrElement = container.querySelector('hr');
    expect(hrElement).toBeInTheDocument();
  });
});
