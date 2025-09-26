import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin functions
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { action } = await req.json();

    switch (action) {
      case 'detect_suspicious':
        // Detect suspicious activity
        const { data: suspiciousActivity, error: suspiciousError } = await supabaseClient
          .rpc('detect_suspicious_activity');
        
        if (suspiciousError) throw suspiciousError;

        console.log(`Security monitoring: Found ${suspiciousActivity?.length || 0} suspicious activities`);
        
        return new Response(JSON.stringify({ 
          suspicious_activities: suspiciousActivity || [],
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'audit_logs':
        // Get recent audit logs (limited to prevent data exposure)
        const { data: auditLogs, error: auditError } = await supabaseClient
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (auditError) throw auditError;

        console.log(`Security monitoring: Retrieved ${auditLogs?.length || 0} audit log entries`);
        
        return new Response(JSON.stringify({ 
          audit_logs: auditLogs || [],
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'financial_summary':
        // Get financial transaction summary for monitoring
        const { data: financialSummary, error: financialError } = await supabaseClient
          .from('ledger')
          .select('type, amount, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('created_at', { ascending: false });
        
        if (financialError) throw financialError;

        // Calculate summary statistics
        const summary = {
          total_deposits: financialSummary?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
          total_stakes: financialSummary?.filter(t => t.type === 'stake').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0,
          transaction_count: financialSummary?.length || 0,
          last_24_hours: true
        };

        console.log(`Security monitoring: Financial summary - ${summary.transaction_count} transactions, ${summary.total_deposits} deposits, ${summary.total_stakes} stakes`);
        
        return new Response(JSON.stringify({ 
          financial_summary: summary,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error("Security monitoring error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});