-- Fix remaining security warnings

-- 1. Fix function search_path issues
ALTER FUNCTION public.audit_financial_transaction() SET search_path = 'public';
ALTER FUNCTION public.detect_suspicious_activity() SET search_path = 'public';