import { toast } from 'sonner';

/**
 * Enterprise Application Notification Interface.
 * Standardizes toast notifications across the SmartCare frontend,
 * decoupling UI components from specific toast implementations.
 */
export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },
  promise: toast.promise,
  dismiss: toast.dismiss,
};

export default notify;
