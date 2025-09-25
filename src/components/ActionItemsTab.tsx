import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Save, X, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Bell, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActionItem {
  id: string;
  actionItem: string;
  category: string;
  priority: "High" | "Medium" | "Low" | "Critical";
  status: "To Do" | "In Progress" | "Completed" | "Not Started";
  dueDate: string;
  remarks: string;
  additionalInfo: string;
  assignedTo: string;
  sourceDocument?: string;
  lastModified: string;
}

type SortField = keyof ActionItem;
type SortDirection = 'asc' | 'desc';

const dummyActionItems: ActionItem[] = [
  {
    id: "1",
    actionItem: "Finalize product roadmap for Q2",
    category: "Planning",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-01-25",
    remarks: "Waiting for stakeholder feedback",
    additionalInfo: "Include mobile app features",
    assignedTo: "Sarah Johnson",
    lastModified: "2024-01-23T10:30:00Z"
  },
  {
    id: "2", 
    actionItem: "Update user documentation",
    category: "Documentation",
    priority: "Medium",
    status: "To Do",
    dueDate: "2024-01-30",
    remarks: "Focus on new API endpoints",
    additionalInfo: "Include code examples",
    assignedTo: "Mike Chen",
    lastModified: "2024-01-22T14:15:00Z"
  },
  {
    id: "3",
    actionItem: "Conduct security audit",
    category: "Security",
    priority: "High",
    status: "Completed",
    dueDate: "2024-01-20",
    remarks: "No critical issues found",
    additionalInfo: "Report sent to compliance team",
    assignedTo: "Alex Rodriguez",
    lastModified: "2024-01-21T09:45:00Z"
  }
];

interface ActionItemsTabProps {
  meetingId: string;
}

export function ActionItemsTab({ meetingId }: ActionItemsTabProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ActionItem>>({});
  const [sortField, setSortField] = useState<SortField>('actionItem');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Load action items from database
  useEffect(() => {
    loadActionItems();
  }, [meetingId]);

  const loadActionItems = async () => {
    try {
      // Only try to load from database if meetingId is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId);
      
      if (!isValidUUID) {
        // If not a valid UUID, just use dummy data
        setActionItems(dummyActionItems);
        return;
      }

      // Fetch action items with related document chunks for references
      const { data: actionItemsData, error: actionItemsError } = await supabase
        .from('action_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (actionItemsError) {
        console.error('Error loading action items:', actionItemsError);
        setActionItems(dummyActionItems);
        return;
      }

      // Fetch document chunks for the same meeting
      const { data: chunksData, error: chunksError } = await supabase
        .from('data_chunks')
        .select('source_document')
        .eq('meeting_id', meetingId);

      if (chunksError) {
        console.error('Error loading document chunks:', chunksError);
      }

      // Get unique source documents
      const sourceDocuments = chunksData ? Array.from(new Set(chunksData.map(chunk => chunk.source_document))) : [];

      // Transform database records to ActionItem format
      const transformedItems: ActionItem[] = actionItemsData.map(item => ({
        id: item.id,
        actionItem: item.action_item,
        category: item.category || '',
        priority: item.priority as ActionItem["priority"] || 'Medium',
        status: item.status as ActionItem["status"] || 'To Do',
        dueDate: item.due_date || '',
        remarks: item.remarks || '',
        additionalInfo: item.additional_info || '',
        assignedTo: item.assigned_to || '',
        sourceDocument: sourceDocuments.length > 0 ? sourceDocuments[0] : undefined,
        lastModified: item.updated_at || item.created_at || new Date().toISOString()
      }));

      setActionItems(transformedItems.length > 0 ? transformedItems : dummyActionItems);
    } catch (error) {
      console.error('Error loading action items:', error);
      setActionItems(dummyActionItems);
    }
  };

  // Auto-refresh to pick up newly generated action items
  useEffect(() => {
    const interval = setInterval(() => {
      loadActionItems();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [meetingId]);

  const getPriorityColor = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "High": case "Critical": return "bg-red-500 text-white";
      case "Medium": return "bg-yellow-500 text-white";
      case "Low": return "bg-green-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: ActionItem["status"]) => {
    switch (status) {
      case "Completed": return "bg-green-500 text-white";
      case "In Progress": return "bg-blue-500 text-white";
      case "To Do": case "Not Started": return "bg-gray-500 text-white";
      default: return "bg-muted text-foreground";
    }
  };

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const saveEdit = async () => {
    if (editingId && editForm.actionItem) {
      try {
        // Check if this is a database item (has UUID format) or dummy data
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(editingId);
        
        if (isValidUUID) {
          // Update in database
          const { error } = await supabase
            .from('action_items')
            .update({
              action_item: editForm.actionItem,
              category: editForm.category || '',
              priority: editForm.priority || 'Medium',
              status: editForm.status || 'Not Started',
              due_date: editForm.dueDate || null,
              remarks: editForm.remarks || '',
              additional_info: editForm.additionalInfo || '',
              assigned_to: editForm.assignedTo || ''
            })
            .eq('id', editingId);

          if (error) {
            console.error('Error updating action item:', error);
            toast({
              title: "Error saving changes",
              description: "Failed to update action item in database",
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "Action item updated",
            description: "Changes saved successfully"
          });
        }

        // Update local state
        setActionItems(prev => prev.map(item => 
          item.id === editingId 
            ? { 
                ...item, 
                actionItem: editForm.actionItem!,
                category: editForm.category || item.category,
                priority: editForm.priority || item.priority,
                status: editForm.status || item.status,
                dueDate: editForm.dueDate || item.dueDate,
                remarks: editForm.remarks || item.remarks,
                additionalInfo: editForm.additionalInfo || item.additionalInfo,
                assignedTo: editForm.assignedTo || item.assignedTo,
                lastModified: new Date().toISOString()
              }
            : item
        ));
        
        setEditingId(null);
        setEditForm({});
      } catch (error) {
        console.error('Error saving action item:', error);
        toast({
          title: "Error saving changes",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedItems = () => {
    return [...actionItems].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleRemind = (item: ActionItem) => {
    toast({
      title: "Reminder Set",
      description: `Reminder set for: ${item.actionItem}`,
    });
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="border border-border p-2 text-left font-semibold min-w-[120px] cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </div>
    </th>
  );

  const addNewItem = async () => {
    const newItem: ActionItem = {
      id: Date.now().toString(),
      actionItem: "New action item",
      category: "Task",
      priority: "Medium",
      status: "To Do",
      dueDate: "",
      remarks: "",
      additionalInfo: "",
      assignedTo: "",
      lastModified: new Date().toISOString()
    };

    // Check if meetingId is valid UUID to determine if we should save to database
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId);
    
    if (isValidUUID) {
      try {
        const { data, error } = await supabase
          .from('action_items')
          .insert({
            user_id: 'demo-user',
            meeting_id: meetingId,
            action_item: newItem.actionItem,
            category: newItem.category,
            priority: newItem.priority,
            status: newItem.status,
            due_date: newItem.dueDate || null,
            remarks: newItem.remarks,
            additional_info: newItem.additionalInfo,
            assigned_to: newItem.assignedTo
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding action item:', error);
          toast({
            title: "Error adding item",
            description: "Failed to add action item to database",
            variant: "destructive"
          });
          return;
        }

        // Use the database-generated ID
        newItem.id = data.id;
        toast({
          title: "Action item added",
          description: "New action item created successfully"
        });
      } catch (error) {
        console.error('Error adding action item:', error);
        toast({
          title: "Error adding item",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
        return;
      }
    }

    setActionItems(prev => [newItem, ...prev]);
    setEditingId(newItem.id);
    setEditForm(newItem);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Action Items</h2>
          <p className="text-muted-foreground">Track and manage meeting action items</p>
        </div>
        <Button 
          onClick={addNewItem}
          className="bg-teams-blue hover:bg-teams-blue/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Action Item
        </Button>
      </div>

      {/* Excel-like Grid */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Action Items Grid
            <Badge variant="secondary">{actionItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <SortableHeader field="actionItem">Action Item</SortableHeader>
                  <SortableHeader field="category">Category</SortableHeader>
                  <SortableHeader field="priority">Priority</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="dueDate">Due Date</SortableHeader>
                  <SortableHeader field="assignedTo">Assigned To</SortableHeader>
                  <SortableHeader field="remarks">Remarks</SortableHeader>
                  <SortableHeader field="additionalInfo">Additional Info</SortableHeader>
                  <th className="border border-border p-2 text-center font-semibold w-[120px]">Action</th>
                  <th className="border border-border p-2 text-center font-semibold w-[120px]">References</th>
                  <SortableHeader field="lastModified">Last Modified</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {getSortedItems().map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Textarea
                          value={editForm.actionItem || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, actionItem: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue resize-none min-h-[24px]"
                          autoFocus
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.actionItem}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Select value={editForm.category || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger className="w-full border-none focus:ring-1 focus:ring-teams-blue">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Task">Task</SelectItem>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                            <SelectItem value="Decision">Decision</SelectItem>
                            <SelectItem value="Research">Research</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="Documentation">Documentation</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.category}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Select value={editForm.priority || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as ActionItem["priority"] }))}>
                          <SelectTrigger className="w-full border-none focus:ring-1 focus:ring-teams-blue">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                            {item.priority}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Select value={editForm.status || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as ActionItem["status"] }))}>
                          <SelectTrigger className="w-full border-none focus:ring-1 focus:ring-teams-blue">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          <Badge className={cn("text-xs", getStatusColor(item.status))}>
                            {item.status}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Input
                          type="date"
                          value={editForm.dueDate || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded flex items-center gap-2" onClick={() => startEdit(item)}>
                          {item.dueDate && <Calendar className="h-3 w-3 text-muted-foreground" />}
                          {item.dueDate || "Not set"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Textarea
                          value={editForm.assignedTo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue resize-none min-h-[24px]"
                          placeholder="Enter name"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.assignedTo || "Unassigned"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Textarea
                          value={editForm.remarks || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue resize-none min-h-[24px]"
                          placeholder="Add remarks"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.remarks || "No remarks"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Textarea
                          value={editForm.additionalInfo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue resize-none min-h-[24px]"
                          placeholder="Additional details"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.additionalInfo || "No additional info"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRemind(item)}
                          className="h-7 px-2 text-xs hover:bg-yellow-50 hover:border-yellow-300"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Remind
                        </Button>
                        {editingId === item.id ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0 text-green-600 hover:text-green-700">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700">
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center">
                        {item.sourceDocument ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-[100px]" title={item.sourceDocument}>
                              {item.sourceDocument.split('.')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual entry</span>
                        )}
                      </div>
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center">
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.lastModified).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          <br />
                          <span className="text-[10px]">
                            {new Date(item.lastModified).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {getSortedItems().length === 0 && (
                  <tr>
                    <td colSpan={11} className="border border-border p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <p>No action items yet</p>
                        <p className="text-sm">Upload documents to generate action items automatically or add them manually</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}