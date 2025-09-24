import { Calendar, Users, Clock, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: number;
  status: "upcoming" | "completed" | "in-progress";
}

const dummyMeetings: Meeting[] = [
  {
    id: "meeting-1",
    title: "Product Strategy Review",
    date: "2024-01-15",
    time: "10:00 AM",
    participants: 8,
    status: "completed"
  },
  {
    id: "meeting-2", 
    title: "Sprint Planning",
    date: "2024-01-16",
    time: "2:00 PM",
    participants: 6,
    status: "completed"
  },
  {
    id: "meeting-3",
    title: "Client Presentation",
    date: "2024-01-17",
    time: "11:00 AM", 
    participants: 12,
    status: "in-progress"
  },
  {
    id: "meeting-4",
    title: "Team Standup",
    date: "2024-01-18",
    time: "9:00 AM",
    participants: 5,
    status: "upcoming"
  },
  {
    id: "meeting-5",
    title: "Q1 Budget Review",
    date: "2024-01-19",
    time: "3:00 PM",
    participants: 10,
    status: "upcoming"
  }
];

interface MeetingsSidebarProps {
  selectedMeetingId: string;
  onMeetingSelect: (meetingId: string) => void;
}

export function MeetingsSidebar({ selectedMeetingId, onMeetingSelect }: MeetingsSidebarProps) {
  const getStatusColor = (status: Meeting["status"]) => {
    switch (status) {
      case "completed": return "text-teams-success";
      case "in-progress": return "text-teams-blue";
      case "upcoming": return "text-teams-warning";
      default: return "text-muted-foreground";
    }
  };

  const getStatusDot = (status: Meeting["status"]) => {
    switch (status) {
      case "completed": return "bg-teams-success";
      case "in-progress": return "bg-teams-blue animate-pulse";
      case "upcoming": return "bg-teams-warning";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <div className="w-80 border-r border-border bg-teams-gray-light/50 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-teams-blue to-teams-purple">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Teams Meetings</h1>
            <p className="text-sm text-muted-foreground">Manage your meetings</p>
          </div>
        </div>
        <Button className="w-full bg-teams-blue hover:bg-teams-blue/90 text-white">
          New Meeting
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {dummyMeetings.map((meeting) => (
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
                  <div className={cn("w-2 h-2 rounded-full mt-1 flex-shrink-0", getStatusDot(meeting.status))} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(meeting.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{meeting.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{meeting.participants} participants</span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className={cn("text-xs font-medium capitalize", getStatusColor(meeting.status))}>
                    {meeting.status.replace("-", " ")}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}