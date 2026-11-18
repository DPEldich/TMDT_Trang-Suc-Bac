export interface CustomerFeedback {
  id: string;
  authorName: string;
  location?: string;
  date: string;
  rating?: number; // 1 to 5 stars when supplied
  content: string;
  productName?: string;
}
