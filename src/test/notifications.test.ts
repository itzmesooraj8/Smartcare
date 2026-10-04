import { describe, it, expect, vi } from 'vitest';
import { notify } from '@/lib/notifications';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Notifications Interface', () => {
  it('dispatches success toast with message and description', () => {
    notify.success('Saved', 'Changes saved successfully');
    expect(toast.success).toHaveBeenCalledWith('Saved', { description: 'Changes saved successfully' });
  });

  it('dispatches error toast with message', () => {
    notify.error('Network Error');
    expect(toast.error).toHaveBeenCalledWith('Network Error', { description: undefined });
  });
});
