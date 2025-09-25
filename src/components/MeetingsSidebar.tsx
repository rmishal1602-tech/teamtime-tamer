import { Calendar, Users, Clock, Video, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  status: string;
  participant_count: number;
}

interface MeetingsSidebarProps {
  selectedMeetingId: string;
  onMeetingSelect: (meetingId: string) => void;
}

export function MeetingsSidebar({ selectedMeetingId, onMeetingSelect }: MeetingsSidebarProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (error) {
        console.error('Error loading meetings:', error);
        return;
      }

      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-teams-success";
      case "in-progress": return "text-teams-blue";
      case "upcoming": return "text-teams-warning";
      default: return "text-muted-foreground";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "completed": return "bg-teams-success";
      case "in-progress": return "bg-teams-blue animate-pulse";
      case "upcoming": return "bg-teams-warning";
      default: return "bg-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? CheckCircle : AlertCircle;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="w-80 border-r border-border bg-teams-gray-light/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-teams-blue to-teams-purple">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Project Comms</h1>
              <p className="text-sm text-muted-foreground">Meetings Action Tracker</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-teams-gray-light/50 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-teams-blue to-teams-purple">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Project Compass</h1>
            <p className="text-sm text-muted-foreground">Meetings Action Planner</p>
          </div>
        </div>
        <Button className="w-full bg-teams-blue hover:bg-teams-blue/90 text-white">
          New Meeting
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {meetings.map((meeting) => {
            const StatusIcon = getStatusIcon(meeting.status);
            const { date, time } = formatDate(meeting.meeting_date);
            
            return (
              <Button
                key={meeting.id}
                variant="ghost"
                className={cn(
                  "w-full p-4 h-auto justify-start text-left transition-all duration-200",
                  "hover:bg-white/80 hover:shadow-sm",
                  selectedMeetingId === meeting.id && "bg-white shadow-md border border-teams-blue/20"
                )}
                onClick={() => onMeetingSelect(meeting.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-foreground truncate pr-2">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <StatusIcon className="w-3 h-3 text-muted-foreground" />
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDot(meeting.status))} />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {meeting.description}
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{meeting.participant_count} participants</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className={cn("text-xs font-medium capitalize", getStatusColor(meeting.status))}>
                      {meeting.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
          
          {meetings.length === 0 && !loading && (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No meetings found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}