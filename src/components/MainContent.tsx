import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksTab } from "@/components/TasksTab";
import { ActionItemsTab } from "@/components/ActionItemsTab";
import { DocumentsTab } from "@/components/DocumentsTab";
import { DataChunksTab } from "@/components/DataChunksTab";
import { CheckSquare, FileText, Database, ClipboardList, Briefcase } from "lucide-react";
import { DataChunk } from "@/lib/documentProcessor";
import { BusinessRequirementsTab } from "@/components/BusinessRequirementsTab";

interface MainContentProps {
  meetingId: string;
}

export function MainContent({ meetingId }: MainContentProps) {
  const [activeTab, setActiveTab] = useState("tasks");
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
          <TabsList className="grid w-full grid-cols-5 mb-6 h-12 bg-card border border-border shadow-sm">
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="font-medium">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="action-items" 
              className="flex items-center gap-2 h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="font-medium">Action Items</span>
            </TabsTrigger>
            <TabsTrigger 
              value="business-requirements"
              className="flex items-center gap-2 h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Briefcase className="h-4 w-4" />
              <span className="font-medium">Business Requirements</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="flex items-center gap-2 h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">Documents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="data-chunks"
              className="flex items-center gap-2 h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Database className="h-4 w-4" />
              <span className="font-medium">Data Chunks</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="tasks" className="h-full mt-0">
              <TasksTab meetingId={meetingId} />
            </TabsContent>
            
            <TabsContent value="action-items" className="h-full mt-0">
              <ActionItemsTab meetingId={meetingId} />
            </TabsContent>
            
            <TabsContent value="business-requirements" className="h-full mt-0">
              <BusinessRequirementsTab meetingId={meetingId} />
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