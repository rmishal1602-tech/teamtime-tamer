import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Video, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectSelector } from "@/components/ProjectSelector";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  status: string;
  participant_count: number;
}

interface AppSidebarProps {
  selectedMeetingId: string;
  onMeetingSelect: (meetingId: string) => void;
}

export function AppSidebar({ selectedMeetingId, onMeetingSelect }: AppSidebarProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
      case "completed": return "text-green-600";
      case "in-progress": return "text-blue-600";
      case "upcoming": return "text-yellow-600";
      default: return "text-muted-foreground";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500 animate-pulse";
      case "upcoming": return "bg-yellow-500";
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

  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <Video className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-semibold text-foreground">Project Comms</h1>
              <p className="text-sm text-muted-foreground">Meeting Action Tracker</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="space-y-3 mt-4">
            <ProjectSelector />
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              New Meeting
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
            </div>
          </div>
        ) : (
          <>
            {upcomingMeetings.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {!isCollapsed && "Upcoming"}
                  {!isCollapsed && <Badge variant="secondary">{upcomingMeetings.length}</Badge>}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {upcomingMeetings.map((meeting) => {
                      const StatusIcon = getStatusIcon(meeting.status);
                      const { date, time } = formatDate(meeting.meeting_date);
                      
                      return (
                        <SidebarMenuItem key={meeting.id}>
                          <SidebarMenuButton 
                            className={cn(
                              "h-auto p-3 hover:bg-muted/50",
                              selectedMeetingId === meeting.id && "bg-accent text-accent-foreground border-l-4 border-blue-600"
                            )}
                            onClick={() => onMeetingSelect(meeting.id)}
                          >
                            {isCollapsed ? (
                              <div className="flex items-center justify-center w-full">
                                <StatusIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="flex items-center w-full">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-medium text-sm truncate pr-2">
                                      {meeting.title}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      <StatusIcon className="w-3 h-3 text-muted-foreground" />
                                      <div className={cn("w-2 h-2 rounded-full", getStatusDot(meeting.status))} />
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
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-50 ml-2" />
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {completedMeetings.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {!isCollapsed && "Completed"}
                  {!isCollapsed && <Badge variant="secondary">{completedMeetings.length}</Badge>}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {completedMeetings.map((meeting) => {
                      const StatusIcon = getStatusIcon(meeting.status);
                      const { date, time } = formatDate(meeting.meeting_date);
                      
                      return (
                        <SidebarMenuItem key={meeting.id}>
                          <SidebarMenuButton 
                            className={cn(
                              "h-auto p-3 hover:bg-muted/50",
                              selectedMeetingId === meeting.id && "bg-accent text-accent-foreground border-l-4 border-blue-600"
                            )}
                            onClick={() => onMeetingSelect(meeting.id)}
                          >
                            {isCollapsed ? (
                              <div className="flex items-center justify-center w-full">
                                <StatusIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="flex items-center w-full">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-medium text-sm truncate pr-2">
                                      {meeting.title}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      <StatusIcon className="w-3 h-3 text-muted-foreground" />
                                      <div className={cn("w-2 h-2 rounded-full", getStatusDot(meeting.status))} />
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
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-50 ml-2" />
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {meetings.length === 0 && !loading && (
              <div className="text-center py-8 px-4">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {!isCollapsed && <p className="text-muted-foreground">No meetings found</p>}
              </div>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}