import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionItemsTab } from "@/components/ActionItemsTab";
import { DocumentsTab } from "@/components/DocumentsTab";
import { DataChunksTab } from "@/components/DataChunksTab";
import { CheckSquare, FileText, Database } from "lucide-react";
import { DataChunk } from "@/lib/documentProcessor";

interface MainContentProps {
  meetingId: string;
}

export function MainContent({ meetingId }: MainContentProps) {
  const [activeTab, setActiveTab] = useState("action-items");
  const [dataChunks, setDataChunks] = useState<DataChunk[]>([]);

  const handleDataChunksGenerated = (newChunks: DataChunk[]) => {
    setDataChunks(prev => [...newChunks, ...prev]);
  };

  const meetingTitles: Record<string, string> = {
    "meeting-1": "Product Strategy Review",
    "meeting-2": "Sprint Planning", 
    "meeting-3": "Client Presentation",
    "meeting-4": "Team Standup",
    "meeting-5": "Q1 Budget Review"
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-white/50 backdrop-blur-sm">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {meetingTitles[meetingId] || "Meeting Details"}
          </h1>
          <p className="text-muted-foreground">
            Manage action items, documents, and data chunks for this meeting
          </p>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
            <TabsTrigger 
              value="action-items" 
              className="flex items-center gap-2 data-[state=active]:bg-teams-blue data-[state=active]:text-white"
            >
              <CheckSquare className="h-4 w-4" />
              Action Items
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="flex items-center gap-2 data-[state=active]:bg-teams-blue data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="data-chunks"
              className="flex items-center gap-2 data-[state=active]:bg-teams-blue data-[state=active]:text-white"
            >
              <Database className="h-4 w-4" />
              Data Chunks
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="action-items" className="h-full mt-0">
              <ActionItemsTab meetingId={meetingId} />
            </TabsContent>
            
            <TabsContent value="documents" className="h-full mt-0">
              <DocumentsTab meetingId={meetingId} onDataChunksGenerated={handleDataChunksGenerated} />
            </TabsContent>
            
            <TabsContent value="data-chunks" className="h-full mt-0">
              <DataChunksTab meetingId={meetingId} dataChunks={dataChunks} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}