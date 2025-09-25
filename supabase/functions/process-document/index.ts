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
    
    if (!chunks || !Array.isArray(chunks)) {
      throw new Error('Missing or invalid chunks parameter');
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
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId || '');

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length} from ${chunk.sourceDocument || 'unknown'}`);
        
        // Save data chunks to database if we have meetingId and chunk data
        if (meetingId && chunk.text && chunk.sourceDocument) {
          const { error: chunkError } = await supabase
            .from('data_chunks')
            .insert({
              user_id: userId || 'demo-user',
              meeting_id: meetingId,
              text: chunk.text,
              source_document: chunk.sourceDocument,
              chunk_index: chunk.chunkIndex || i,
              file_path: chunk.file_path || null
            });

          if (chunkError) {
            console.error('Error saving chunk:', chunkError);
            // Continue processing even if database save fails
          }
        }

        // Generate action items from chunk using Azure OpenAI
        if (chunk.text && chunk.text.trim().length > 0) {
          console.log(`Sending chunk to Azure OpenAI: ${chunk.text.substring(0, 100)}...`);
          
          const response = await fetch('https://jss-azure-open-ai.openai.azure.com/openai/deployments/jss-gpt-4o/chat/completions?api-version=2025-01-01-preview', {
            method: 'POST',
            headers: {
              'api-key': azureApiKey,
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
                  
                  Return ONLY a valid JSON array of action items. If no action items are found, return an empty array [].
                  Do not include any text before or after the JSON array.`
                },
                {
                  role: 'user',
                  content: `Extract action items from this meeting transcript chunk:\n\n${chunk.text}`
                }
              ],
              max_tokens: 4000,
              temperature: 0.3
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
            continue;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              console.log('Azure OpenAI response (first 200 chars):', content.substring(0, 200));
              console.log('AI Response includes ```json:', content.includes('```json'));
              console.log('AI Response includes ```:', content.includes('```'));
              
              // Extract JSON from markdown code blocks if present
              let jsonString = content.trim();
              
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
              
              // Try to repair truncated JSON if needed
              let repairedJsonString = jsonString;
              if (jsonString.startsWith('[') && !jsonString.trim().endsWith(']')) {
                console.log('Detected potentially truncated JSON array, attempting to repair...');
                
                // Find the last complete object by looking for the last '}' followed by optional whitespace/comma
                const lastCompleteObjectMatch = jsonString.match(/^(.*})\s*,?\s*[^}]*$/);
                if (lastCompleteObjectMatch) {
                  repairedJsonString = lastCompleteObjectMatch[1] + '\n]';
                  console.log('Repaired JSON by truncating incomplete object');
                } else {
                  // If we can't find a complete object, try to close the array
                  repairedJsonString = jsonString.replace(/,\s*$/, '') + '\n]';
                  console.log('Repaired JSON by closing array');
                }
              }
              
              // Parse the JSON response
              const actionItems = JSON.parse(repairedJsonString);
              if (Array.isArray(actionItems)) {
                allActionItems.push(...actionItems);
                console.log(`Extracted ${actionItems.length} action items from chunk ${i + 1}`);
              } else {
                console.log('Response was not an array:', actionItems);
              }
            } catch (parseError) {
              console.error('Error parsing Azure OpenAI response:', parseError);
              console.error('Raw response:', content);
              // Continue processing other chunks even if this one fails
            }
          } else {
            console.log('No content in Azure OpenAI response');
          }
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
      }
    }

    // Save all action items to database if we have action items and meetingId
    if (allActionItems.length > 0 && meetingId) {
      const actionItemsToInsert = allActionItems.map(item => ({
        user_id: userId || 'demo-user',
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
        // Don't throw error, just log it
      } else {
        console.log(`Successfully saved ${allActionItems.length} action items to database`);
      }
    }

    console.log(`Processing completed: ${chunks.length} chunks processed, ${allActionItems.length} action items generated`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunksProcessed: chunks.length,
      actionItemsGenerated: allActionItems.length,
      actionItems: allActionItems // Return the action items for immediate use
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