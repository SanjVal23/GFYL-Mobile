
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/components/App';
import * as geminiService from '../src/services/geminiService';

// Mock the service
vi.mock('../src/services/geminiService', () => ({
  getChatbotResponse: vi.fn(),
}));

describe('Gita BFF Chatbot Integration', () => {
  it('should start at the initial screen and transition to chat', async () => {
    render(<App />);
    
    // Check for splash screen text
    expect(screen.getByText(/Gita Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to step out of the fog/i)).toBeInTheDocument();

    // Click "I am ready"
    const startButton = screen.getByText(/I am ready/i);
    fireEvent.click(startButton);

    // Check for initial bot message
    await waitFor(() => {
      expect(screen.getByText(/Radhey Radhey! I am Krishna/i)).toBeInTheDocument();
    });
  });

  it('should handle sending a message and showing response', async () => {
    const mockResponse = {
      summary: "Think of your mind like a lens covered in dust.",
      detailedExplanation: "--- \n > Keep it clear \n * Shlok 2.14"
    };
    (geminiService.getChatbotResponse as any).mockResolvedValue(mockResponse);

    render(<App />);
    fireEvent.click(screen.getByText(/I am ready/i));

    const input = screen.getByPlaceholderText(/Ask Krishna a question/i);
    fireEvent.change(input, { target: { value: 'How do I stop stress?' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Check loading state
    expect(screen.getByText(/Reflecting on the truth/i)).toBeInTheDocument();

    // Check summary appears
    await waitFor(() => {
      expect(screen.getByText(/Think of your mind like a lens/i)).toBeInTheDocument();
    });

    // Check "Deeper Insight" button exists
    const insightButton = screen.getByText(/Deeper Insight/i);
    expect(insightButton).toBeInTheDocument();

    // Click "Deeper Insight"
    fireEvent.click(insightButton);

    // Check for detailed text
    await waitFor(() => {
      expect(screen.getByText(/Shlok 2.14/i)).toBeInTheDocument();
    });
  });
});
