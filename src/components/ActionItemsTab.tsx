import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActionItem {
  id: string;
  actionItem: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Completed";
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

  const getPriorityColor = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "High": return "bg-status-high text-white";
      case "Medium": return "bg-status-medium text-white";
      case "Low": return "bg-status-low text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: ActionItem["status"]) => {
    switch (status) {
      case "Completed": return "bg-status-completed text-white";
      case "In Progress": return "bg-teams-blue text-white";
      case "To Do": return "bg-muted text-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      setActionItems(prev => 
        prev.map(item => 
          item.id === editingId ? { ...item, ...editForm } : item
        )
      );
      setEditingId(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const addNewItem = () => {
    const newItem: ActionItem = {
      id: Date.now().toString(),
      actionItem: "New action item",
      category: "General",
      priority: "Medium",
      status: "To Do",
      dueDate: new Date().toISOString().split('T')[0],
      remarks: "",
      additionalInfo: "",
      assignedTo: ""
    };
    setActionItems(prev => [...prev, newItem]);
    startEdit(newItem);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Action Items</h2>
          <p className="text-muted-foreground">Track and manage meeting action items</p>
        </div>
        <Button onClick={addNewItem} className="bg-teams-blue hover:bg-teams-blue/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Action Item
        </Button>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Action Items Grid
            <Badge variant="secondary">{actionItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-9 gap-4 p-4 bg-muted/50 rounded-t-lg border-b border-border font-medium text-sm">
                <div>Action Item</div>
                <div>Category</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Due Date</div>
                <div>Remarks</div>
                <div>Additional Info</div>
                <div>Assigned To</div>
                <div>Actions</div>
              </div>
              
              {/* Rows */}
              <div className="space-y-1">
                {actionItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "grid grid-cols-9 gap-4 p-4 border-b border-border/50 hover:bg-muted/20 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    {editingId === item.id ? (
                      <>
                        <Input
                          value={editForm.actionItem || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, actionItem: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          value={editForm.category || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="text-sm"
                        />
                        <Select
                          value={editForm.priority}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as ActionItem["priority"] }))}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as ActionItem["status"] }))}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={editForm.dueDate || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          value={editForm.remarks || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          value={editForm.additionalInfo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          value={editForm.assignedTo || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 w-8 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium">{item.actionItem}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                        <Badge className={cn("text-xs w-fit", getPriorityColor(item.priority))}>
                          {item.priority}
                        </Badge>
                        <Badge className={cn("text-xs w-fit", getStatusColor(item.status))}>
                          {item.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground truncate" title={item.remarks}>
                          {item.remarks}
                        </div>
                        <div className="text-sm text-muted-foreground truncate" title={item.additionalInfo}>
                          {item.additionalInfo}
                        </div>
                        <div className="text-sm font-medium">{item.assignedTo}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}