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
    const { meetingId } = await req.json();
    
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

    // Fetch all action items for this meeting from database
    console.log('Fetching action items for meeting:', meetingId);
    const { data: actionItemsData, error: actionItemsError } = await supabase
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false });

    if (actionItemsError) {
      console.error('Error fetching action items:', actionItemsError);
      throw new Error(`Failed to fetch action items: ${actionItemsError.message}`);
    }

    if (!actionItemsData || actionItemsData.length === 0) {
      throw new Error('No action items found for this meeting');
    }

    console.log(`Found ${actionItemsData.length} action items`);

    // Fetch latest business requirements from database
    console.log('Fetching latest business requirements for meeting:', meetingId);
    const { data: currentBRData, error: brError } = await supabase
      .from('business_requirements')
      .select('content, version')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (brError && brError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching business requirements:', brError);
      throw new Error(`Failed to fetch business requirements: ${brError.message}`);
    }

    const currentBusinessRequirements = currentBRData?.content || `# Business Requirements Document

## 1. Project Overview
**Project Name:** [Project Name]
**Date:** ${new Date().toLocaleDateString()}
**Stakeholders:** [List key stakeholders]
**Document Version:** 1.0

## 2. Executive Summary
Provide a high-level overview of the project, its objectives, and expected outcomes.

## 3. Business Objectives
### Primary Objectives:
- Please define based on action items and meeting context

### Success Metrics:
- To be defined based on project requirements

## 4. Functional Requirements
### Core Features
- Requirements to be derived from action items and meeting discussions

Please update this template with relevant information based on the action items.`;

    console.log(`Using business requirements version: ${currentBRData?.version || 'new document'}`);

    // Transform action items for the prompt
    const actionItems = actionItemsData.map(item => ({
      action_item: item.action_item,
      category: item.category || 'General',
      priority: item.priority || 'Medium',
      status: item.status || 'Not Started',
      due_date: item.due_date,
      assigned_to: item.assigned_to || 'Unassigned',
      remarks: item.remarks || '',
      additional_info: item.additional_info || ''
    }));

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
  `${index + 1}. ${item.action_item}
   - Priority: ${item.priority}
   - Status: ${item.status} 
   - Category: ${item.category}
   - Assigned To: ${item.assigned_to}
   - Due Date: ${item.due_date || 'Not set'}
   - Remarks: ${item.remarks}
   - Additional Info: ${item.additional_info}`
).join('\n\n')}

Please generate an updated Business Requirements Document that incorporates these action items into a comprehensive BRD structure. Make sure to:
1. Update the project overview based on the action items context
2. Derive functional requirements from the action items
3. Set appropriate priorities based on action item priorities
4. Include timeline considerations based on due dates
5. Incorporate assigned responsibilities into the requirements
6. Update risk assessments based on action item categories and remarks
7. Ensure all action items are properly reflected in the relevant BRD sections`;

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

    // Calculate new version number
    const newVersion = currentBRData ? currentBRData.version + 1 : 1;

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