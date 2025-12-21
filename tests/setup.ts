
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.API_KEY = 'test-api-key';

// Mock scrollIntoView which isn't in JSDOM
Element.prototype.scrollIntoView = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
