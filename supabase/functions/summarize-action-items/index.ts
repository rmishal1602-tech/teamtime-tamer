import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    console.log('Starting action items summarization');
    
    const { meetingId, userId } = await req.json();
    
    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'Meeting ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all action items for the meeting
    const { data: actionItems, error: fetchError } = await supabase
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId);

    if (fetchError) {
      console.error('Error fetching action items:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch action items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!actionItems || actionItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No action items found for this meeting' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${actionItems.length} action items to process`);

    // Prepare the prompt for Azure OpenAI
    const actionItemsText = actionItems.map(item => 
      `- ${item.action_item} (Priority: ${item.priority}, Assigned: ${item.assigned_to || 'Unassigned'}, Category: ${item.category || 'General'})`
    ).join('\n');

    const prompt = `You are an AI assistant that helps merge and consolidate duplicate or similar action items into comprehensive tasks. 

Please analyze the following action items and merge similar or duplicate ones into consolidated tasks. For each consolidated task, provide:
1. A clear, comprehensive action description
2. Priority level (Critical, High, Medium, Low)
3. Category
4. Assigned person(s)
5. Any relevant remarks or additional information

Action Items to process:
${actionItemsText}

Please respond with a JSON array of consolidated tasks in this format:
[
  {
    "action_item": "Consolidated task description",
    "priority": "High",
    "category": "Task",
    "assigned_to": "Person Name",
    "remarks": "Consolidated from multiple similar action items",
    "additional_info": "Any additional context"
  }
]

Rules:
- Merge similar or duplicate action items
- Keep distinct tasks separate
- Maintain all important information
- If an action item is unique, keep it as is
- Provide clear, actionable descriptions`;

    // Call Azure OpenAI API
    const azureResponse = await fetch(
      'https://jss-azure-open-ai.openai.azure.com/openai/deployments/jss-gpt-4o/chat/completions?api-version=2025-01-01-preview',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that consolidates and merges similar action items into comprehensive tasks. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        })
      }
    );

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process action items with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const azureData = await azureResponse.json();
    console.log('Azure OpenAI response received');

    let consolidatedTasks;
    try {
      const aiResponse = azureData.choices[0].message.content;
      console.log('AI Response (first 200 chars):', aiResponse.substring(0, 200));
      console.log('AI Response includes ```json:', aiResponse.includes('```json'));
      console.log('AI Response includes ```:', aiResponse.includes('```'));
      
      // Extract JSON from markdown code blocks if present
      let jsonString = aiResponse.trim();
      
      // Handle markdown code blocks
      if (jsonString.startsWith('```')) {
        console.log('Detected markdown code block');
        // Find the first occurrence of ``` and remove everything before the actual content
        const lines = jsonString.split('\n');
        let startIndex = 0;
        let endIndex = lines.length;
        
        // Find start index (skip the opening ```)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('```')) {
            startIndex = i + 1;
            break;
          }
        }
        
        // Find end index (before the closing ```)
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].trim() === '```') {
            endIndex = i;
            break;
          }
        }
        
        jsonString = lines.slice(startIndex, endIndex).join('\n').trim();
        console.log('Extracted JSON (first 200 chars):', jsonString.substring(0, 200));
      }
      
      // Validate that it looks like JSON
      if (!jsonString.startsWith('[') && !jsonString.startsWith('{')) {
        throw new Error('Extracted content does not appear to be valid JSON');
      }
      
      // Check if JSON appears to be complete (for arrays, should end with ])
      if (jsonString.startsWith('[') && !jsonString.trim().endsWith(']')) {
        console.warn('JSON appears to be truncated, attempting to fix...');
        // Try to find the last complete object and close the array
        const lastCompleteObjectIndex = jsonString.lastIndexOf('}');
        if (lastCompleteObjectIndex > 0) {
          jsonString = jsonString.substring(0, lastCompleteObjectIndex + 1) + '\n]';
          console.log('Attempted to fix truncated JSON');
        } else {
          throw new Error('JSON response appears to be truncated and cannot be repaired');
        }
      }
      
      // Parse the JSON response
      consolidatedTasks = JSON.parse(jsonString);
      console.log('Successfully parsed', consolidatedTasks.length, 'tasks');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', azureData.choices[0].message.content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert consolidated tasks into the tasks table
    const tasksToInsert = consolidatedTasks.map((task: any) => ({
      user_id: userId || actionItems[0].user_id,
      meeting_id: meetingId,
      action_item: task.action_item,
      priority: task.priority || 'Medium',
      category: task.category || 'Task',
      assigned_to: task.assigned_to,
      remarks: task.remarks,
      additional_info: task.additional_info,
      status: 'Not Started'
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting tasks:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save consolidated tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully created ${insertedTasks?.length} consolidated tasks`);

    return new Response(
      JSON.stringify({ 
        message: 'Action items successfully summarized and merged',
        tasksCreated: insertedTasks?.length,
        tasks: insertedTasks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-action-items function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});