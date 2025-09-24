import { useState } from "react";
import { MeetingsSidebar } from "@/components/MeetingsSidebar";
import { MainContent } from "@/components/MainContent";

const Index = () => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("meeting-1");

  return (
    <div className="flex min-h-screen bg-background">
      <MeetingsSidebar 
        selectedMeetingId={selectedMeetingId}
        onMeetingSelect={setSelectedMeetingId}
      />
      <MainContent meetingId={selectedMeetingId} />
    </div>
  );
};

export default Index;