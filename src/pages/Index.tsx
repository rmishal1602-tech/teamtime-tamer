import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MainContent } from "@/components/MainContent";

const Index = () => {
  const { meetingId } = useParams<{ meetingId?: string }>();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    meetingId || "550e8400-e29b-41d4-a716-446655440001"
  );

  // Update selected meeting when URL changes
  useEffect(() => {
    if (meetingId) {
      setSelectedMeetingId(meetingId);
    }
  }, [meetingId]);

  // Handle meeting selection and update URL
  const handleMeetingSelect = (newMeetingId: string) => {
    setSelectedMeetingId(newMeetingId);
    // Update URL without page reload
    window.history.pushState({}, '', `/${newMeetingId}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          selectedMeetingId={selectedMeetingId}
          onMeetingSelect={handleMeetingSelect}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-white/50 backdrop-blur-sm">
            <SidebarTrigger className="ml-2" />
          </header>
          
          <main className="flex-1">
            <MainContent meetingId={selectedMeetingId} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;