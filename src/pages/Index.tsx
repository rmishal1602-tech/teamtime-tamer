import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MeetingsSidebar } from "@/components/MeetingsSidebar";
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
    <div className="flex min-h-screen bg-background">
      <MeetingsSidebar 
        selectedMeetingId={selectedMeetingId}
        onMeetingSelect={handleMeetingSelect}
      />
      <MainContent meetingId={selectedMeetingId} />
    </div>
  );
};

export default Index;