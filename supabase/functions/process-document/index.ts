import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionItem {
  actionItem: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  dueDate?: string;
  remarks?: string;
  additionalInfo?: string;
  assignedTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chunks, meetingId, userId } = await req.json();
    
    if (!chunks || !meetingId || !userId) {
      throw new Error('Missing required parameters: chunks, meetingId, userId');
    }

    console.log(`Processing ${chunks.length} chunks for meeting ${meetingId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Azure OpenAI API key
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    if (!azureApiKey) {
      throw new Error('Azure OpenAI API key not configured');
    }

    const allActionItems: ActionItem[] = [];

    // Process each chunk
    for (const chunk of chunks) {
      try {
        console.log(`Processing chunk ${chunk.chunk_index} from ${chunk.source_document}`);
        
        // Save chunk to database
        const { error: chunkError } = await supabase
          .from('data_chunks')
          .insert({
            user_id: userId,
            meeting_id: meetingId,
            text: chunk.text,
            source_document: chunk.source_document,
            chunk_index: chunk.chunk_index,
            file_path: chunk.file_path
          });

        if (chunkError) {
          console.error('Error saving chunk:', chunkError);
          continue;
        }

        // Generate action items from chunk using Azure OpenAI
        const response = await fetch('https://jss-azure-open-ai.openai.azure.com/openai/deployments/jss-gpt-4o/chat/completions?api-version=2025-01-01-preview', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${azureApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant that extracts action items from meeting transcripts. 
                
                For each action item you identify, provide a JSON object with these fields:
                - actionItem: Clear, specific description of the task
                - category: One of "Task", "Follow-up", "Decision", "Research", "Review"
                - priority: One of "Low", "Medium", "High", "Critical"
                - status: Always "Not Started"
                - dueDate: If mentioned, format as YYYY-MM-DD, otherwise null
                - remarks: Any additional context or notes
                - additionalInfo: Supporting details if any
                - assignedTo: Person responsible if mentioned, otherwise null
                
                Return only a JSON array of action items. If no action items are found, return an empty array.`
              },
              {
                role: 'user',
                content: `Extract action items from this meeting transcript chunk:\n\n${chunk.text}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
          }),
        });

        if (!response.ok) {
          console.error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            const actionItems = JSON.parse(content);
            if (Array.isArray(actionItems)) {
              allActionItems.push(...actionItems);
              console.log(`Extracted ${actionItems.length} action items from chunk ${chunk.chunk_index}`);
            }
          } catch (parseError) {
            console.error('Error parsing Azure OpenAI response:', parseError);
          }
        }
      } catch (error) {
        console.error(`Error processing chunk ${chunk.chunk_index}:`, error);
      }
    }

    // Save all action items to database
    if (allActionItems.length > 0) {
      const actionItemsToInsert = allActionItems.map(item => ({
        user_id: userId,
        meeting_id: meetingId,
        action_item: item.actionItem,
        category: item.category,
        priority: item.priority,
        status: item.status,
        due_date: item.dueDate || null,
        remarks: item.remarks || null,
        additional_info: item.additionalInfo || null,
        assigned_to: item.assignedTo || null
      }));

      const { error: actionItemsError } = await supabase
        .from('action_items')
        .insert(actionItemsToInsert);

      if (actionItemsError) {
        console.error('Error saving action items:', actionItemsError);
        throw actionItemsError;
      }

      console.log(`Successfully saved ${allActionItems.length} action items`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      chunksProcessed: chunks.length,
      actionItemsGenerated: allActionItems.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});