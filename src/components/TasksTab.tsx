import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X, Calendar, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  actionItem: string;
  category: string;
  priority: "High" | "Medium" | "Low" | "Critical";
  status: "To Do" | "In Progress" | "Completed" | "Not Started";
  dueDate: string;
  remarks: string;
  additionalInfo: string;
  assignedTo: string;
  lastModified: string;
}

type SortField = keyof Task;
type SortDirection = 'asc' | 'desc';

interface TasksTabProps {
  meetingId: string;
}

export function TasksTab({ meetingId }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [sortField, setSortField] = useState<SortField>('actionItem');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Load tasks from database
  useEffect(() => {
    loadTasks();
  }, [meetingId]);

  const loadTasks = async () => {
    try {
      // Only try to load from database if meetingId is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId);
      
      if (!isValidUUID) {
        // If not a valid UUID, show empty state
        setTasks([]);
        return;
      }

      // Fetch tasks from the database
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        setTasks([]);
        return;
      }

      // Transform database records to Task format
      const transformedTasks: Task[] = tasksData.map(task => ({
        id: task.id,
        actionItem: task.action_item,
        category: task.category || '',
        priority: task.priority as Task["priority"] || 'Medium',
        status: task.status as Task["status"] || 'To Do',
        dueDate: task.due_date || '',
        remarks: task.remarks || '',
        additionalInfo: task.additional_info || '',
        assignedTo: task.assigned_to || '',
        lastModified: task.updated_at || task.created_at || new Date().toISOString()
      }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  // Auto-refresh to pick up newly generated tasks
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [meetingId]);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High": case "Critical": return "bg-red-500 text-white";
      case "Medium": return "bg-yellow-500 text-white";
      case "Low": return "bg-green-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Completed": return "bg-green-500 text-white";
      case "In Progress": return "bg-blue-500 text-white";
      case "To Do": case "Not Started": return "bg-gray-500 text-white";
      default: return "bg-muted text-foreground";
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task });
  };

  const saveEdit = async () => {
    if (editingId && editForm.actionItem) {
      try {
        // Update in database
        const { error } = await supabase
          .from('tasks')
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
          console.error('Error updating task:', error);
          toast({
            title: "Error saving changes",
            description: "Failed to update task in database",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Task updated",
          description: "Changes saved successfully"
        });

        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === editingId 
            ? { 
                ...task, 
                actionItem: editForm.actionItem!,
                category: editForm.category || task.category,
                priority: editForm.priority || task.priority,
                status: editForm.status || task.status,
                dueDate: editForm.dueDate || task.dueDate,
                remarks: editForm.remarks || task.remarks,
                additionalInfo: editForm.additionalInfo || task.additionalInfo,
                assignedTo: editForm.assignedTo || task.assignedTo,
                lastModified: new Date().toISOString()
              }
            : task
        ));
        
        setEditingId(null);
        setEditForm({});
      } catch (error) {
        console.error('Error saving task:', error);
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

  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const formatTasksAsHTML = () => {
    if (tasks.length === 0) {
      return '<p>No tasks available.</p>';
    }

    let html = `
      <html>
        <head>
          <title>Meeting Tasks</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .priority-high, .priority-critical { background-color: #ffebee; color: #c62828; }
            .priority-medium { background-color: #fff3e0; color: #ef6c00; }
            .priority-low { background-color: #e8f5e8; color: #2e7d32; }
            .status-completed { background-color: #e8f5e8; color: #2e7d32; }
            .status-in-progress { background-color: #e3f2fd; color: #1565c0; }
            .status-todo, .status-not-started { background-color: #f5f5f5; color: #424242; }
          </style>
        </head>
        <body>
          <h1>Meeting Tasks</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Task Description</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Remarks</th>
                <th>Additional Info</th>
              </tr>
            </thead>
            <tbody>
    `;

    tasks.forEach(task => {
      html += `
        <tr>
          <td>${task.actionItem}</td>
          <td>${task.category}</td>
          <td class="priority-${task.priority.toLowerCase()}">${task.priority}</td>
          <td class="status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</td>
          <td>${task.dueDate || 'Not set'}</td>
          <td>${task.assignedTo || 'Unassigned'}</td>
          <td>${task.remarks || 'No remarks'}</td>
          <td>${task.additionalInfo || 'No additional info'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    return html;
  };

  const openOutlookWithTasks = () => {
    const htmlContent = formatTasksAsHTML();
    const subject = encodeURIComponent('Meeting Tasks Report');
    const body = encodeURIComponent(htmlContent);
    const recipient = 'rishikesh@jsspro.com';
    
    const mailtoURL = `mailto:${recipient}?subject=${subject}&body=${body}`;
    
    try {
      window.location.href = mailtoURL;
      toast({
        title: "Opening email client",
        description: "Your default email application should open with the tasks"
      });
    } catch (error) {
      toast({
        title: "Error opening email",
        description: "Could not open email client. Please try again.",
        variant: "destructive"
      });
    }
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

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
          <p className="text-muted-foreground">Consolidated tasks from merged action items</p>
        </div>
        <Button 
          onClick={openOutlookWithTasks}
          className="flex items-center gap-2"
          disabled={tasks.length === 0}
        >
          <Mail className="h-4 w-4" />
          Send Email to Participants
        </Button>
      </div>

      {/* Excel-like Grid */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tasks Grid
            <Badge variant="secondary">{tasks.length} tasks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <SortableHeader field="actionItem">Task Description</SortableHeader>
                  <SortableHeader field="category">Category</SortableHeader>
                  <SortableHeader field="priority">Priority</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="dueDate">Due Date</SortableHeader>
                  <SortableHeader field="assignedTo">Assigned To</SortableHeader>
                  <SortableHeader field="remarks">Remarks</SortableHeader>
                  <SortableHeader field="additionalInfo">Additional Info</SortableHeader>
                  <th className="border border-border p-2 text-center font-semibold w-[80px]">Action</th>
                  <SortableHeader field="lastModified">Last Modified</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {getSortedTasks().map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          {task.actionItem}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          {task.category}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
                        <Select value={editForm.priority || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as Task["priority"] }))}>
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                            {task.priority}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
                        <Select value={editForm.status || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as Task["status"] }))}>
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          <Badge className={cn("text-xs", getStatusColor(task.status))}>
                            {task.status}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
                        <Input
                          type="date"
                          value={editForm.dueDate || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full border-none p-1 focus:ring-1 focus:ring-teams-blue"
                        />
                      ) : (
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded flex items-center gap-2" onClick={() => startEdit(task)}>
                          {task.dueDate && <Calendar className="h-3 w-3 text-muted-foreground" />}
                          {task.dueDate || "Not set"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          {task.assignedTo || "Unassigned"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          {task.remarks || "No remarks"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {editingId === task.id ? (
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
                        <div className="p-1 cursor-pointer hover:bg-muted/20 rounded" onClick={() => startEdit(task)}>
                          {task.additionalInfo || "No additional info"}
                        </div>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center gap-1">
                        {editingId === task.id ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0 text-green-600 hover:text-green-700">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(task)} className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700">
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="border border-border p-2">
                      <div className="flex items-center justify-center">
                        <div className="text-xs text-muted-foreground">
                          {new Date(task.lastModified).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          <br />
                          <span className="text-[10px]">
                            {new Date(task.lastModified).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {getSortedTasks().length === 0 && (
                  <tr>
                    <td colSpan={10} className="border border-border p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckSquare className="h-8 w-8 text-muted-foreground" />
                        <p>No tasks yet</p>
                        <p className="text-sm">Use "Summarize/Merge Action Items" in the Action Items tab to create consolidated tasks</p>
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