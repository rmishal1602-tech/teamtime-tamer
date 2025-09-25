import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId, actionItems, currentBusinessRequirements } = await req.json();
    
    console.log('Processing business requirements update for meeting:', meetingId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Azure OpenAI API key
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    if (!azureApiKey) {
      throw new Error('Azure OpenAI API key not configured');
    }

    // Prepare the prompt for Azure OpenAI
    const systemPrompt = `You are a business analyst expert. Your task is to generate comprehensive business requirements based on action items from meetings and existing business requirements.

Generate a complete Business Requirements Document that includes:
1. Updated project overview based on action items
2. Refined business objectives and success metrics
3. Enhanced functional and non-functional requirements
4. Updated scope and boundaries
5. Risk assessment updates
6. Implementation timeline adjustments
7. All other standard BRD sections

Make sure to:
- Incorporate insights from the action items into relevant sections
- Maintain professional BRD formatting
- Include specific, measurable requirements
- Update dates and version numbers appropriately
- Ensure consistency between action items and requirements`;

    const userPrompt = `Current Business Requirements:
${currentBusinessRequirements}

Action Items from Meeting:
${actionItems.map((item: any, index: number) => 
  `${index + 1}. ${item.action_item} (Priority: ${item.priority}, Status: ${item.status}, Category: ${item.category || 'General'})`
).join('\n')}

Please generate an updated Business Requirements Document that incorporates these action items into a comprehensive BRD structure.`;

    // Call Azure OpenAI
    const azureResponse = await fetch('https://jss-azure-open-ai.openai.azure.com/openai/deployments/jss-gpt-4o/chat/completions?api-version=2025-01-01-preview', {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`Azure OpenAI API error: ${azureResponse.status} ${errorText}`);
    }

    const azureData = await azureResponse.json();
    const generatedContent = azureData.choices[0].message.content;

    // Get the latest version number for this meeting
    const { data: latestVersion } = await supabase
      .from('business_requirements')
      .select('version')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Store the new business requirements
    const { data, error } = await supabase
      .from('business_requirements')
      .insert({
        meeting_id: meetingId,
        content: generatedContent,
        version: newVersion
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing business requirements:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Business requirements updated successfully. Version: ${newVersion}`);

    return new Response(JSON.stringify({ 
      success: true,
      content: generatedContent,
      version: newVersion,
      id: data.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-business-requirements function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});