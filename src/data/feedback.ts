import type { CustomerFeedback } from '../types/feedback';

export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSe_AZyg1CkYO8UdP4N6zv4i-QCQ2U17CuxOG9yBWqF9CriufQ/viewform';

/**
 * Danh sách đánh giá từ khách hàng.
 * Để trống trong giai đoạn khởi tạo, bổ sung khi nhận được phản hồi thực tế.
 */
export const AUTHENTIC_CUSTOMER_FEEDBACK: readonly CustomerFeedback[] = [];
