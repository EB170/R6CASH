-- Fix all functions missing search_path for security compliance
ALTER FUNCTION public.calculate_elo_change SET search_path = public;
ALTER FUNCTION public.detect_suspicious_activity SET search_path = public;