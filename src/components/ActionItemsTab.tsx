import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Save, X, Calendar } from "lucide-react";
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
}

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
    assignedTo: "Sarah Johnson"
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
    assignedTo: "Mike Chen"
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
    assignedTo: "Alex Rodriguez"
  }
];

interface ActionItemsTabProps {
  meetingId: string;
}

export function ActionItemsTab({ meetingId }: ActionItemsTabProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ActionItem>>({});
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

      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading action items:', error);
        // Fall back to dummy data if there's an error
        setActionItems(dummyActionItems);
        return;
      }

      // Transform database records to ActionItem format
      const transformedItems: ActionItem[] = data.map(item => ({
        id: item.id,
        actionItem: item.action_item,
        category: item.category || '',
        priority: item.priority as ActionItem["priority"] || 'Medium',
        status: item.status as ActionItem["status"] || 'To Do',
        dueDate: item.due_date || '',
        remarks: item.remarks || '',
        additionalInfo: item.additional_info || '',
        assignedTo: item.assigned_to || ''
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
                assignedTo: editForm.assignedTo || item.assignedTo
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
      assignedTo: ""
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
                  <th className="border border-border p-2 text-left font-semibold min-w-[200px]">Action Item</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[120px]">Category</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[100px]">Priority</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[120px]">Status</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[120px]">Due Date</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[150px]">Assigned To</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[150px]">Remarks</th>
                  <th className="border border-border p-2 text-left font-semibold min-w-[150px]">Additional Info</th>
                  <th className="border border-border p-2 text-center font-semibold w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Input
                          value={editForm.actionItem || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, actionItem: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                          autoFocus
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
                        <Input
                          value={editForm.assignedTo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                          placeholder="Enter name"
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.assignedTo || "Unassigned"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Input
                          value={editForm.remarks || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                          placeholder="Add remarks"
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.remarks || "No remarks"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === item.id ? (
                        <Input
                          value={editForm.additionalInfo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                          placeholder="Additional details"
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(item)}>
                          {item.additionalInfo || "No additional info"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center gap-1">
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
                  </tr>
                ))}
                {actionItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="border border-border p-8 text-center text-muted-foreground">
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