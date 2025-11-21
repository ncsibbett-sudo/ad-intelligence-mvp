export interface User {
  id: string;
  email: string;
  stripe_customer_id?: string;
  payment_status: 'free' | 'paid';
  analysis_count: number;
  created_at: string;
  updated_at: string;
}

export interface Creative {
  id: string;
  user_id: string;
  source_type: 'own' | 'competitor';
  brand_name?: string;
  ad_id?: string;
  ad_image_url?: string;
  ad_copy?: string;
  cta?: string;
  performance: PerformanceMetrics;
  created_at: string;
}

export interface PerformanceMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  spend?: number;
  conversions?: number;
  reach?: number;
}

export interface AnalysisResult {
  headline?: string;
  headline_length?: 'short' | 'medium' | 'long';
  primary_color?: string;
  emotion?: string;
  cta?: string;
  visual_elements?: string[];
  copy_tone?: string;
  performance_driver?: string;
  recommendations?: string[];
}

export interface Analysis {
  id: string;
  creative_id: string;
  analysis_result: AnalysisResult;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount?: number;
  currency: string;
  created_at: string;
}

export interface InsightSummary {
  best_performing_cta?: string;
  best_performing_emotion?: string;
  avg_ctr_by_headline_length?: Record<string, number>;
  top_colors?: string[];
  key_findings?: string[];
}
