import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Eye, Download, FileType } from "lucide-react";

interface DataChunk {
  id: string;
  fileName: string;
  sourceDocument: string;
  size: string;
  createdDate: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

const dummyDataChunks: DataChunk[] = [
  {
    id: "chunk-1",
    fileName: "product_strategy_chunk_1.txt",
    sourceDocument: "Product_Strategy_Meeting_Transcript.docx",
    size: "2.1 KB",
    createdDate: "2024-01-15",
    content: "Discussion about Q2 product roadmap priorities. Team agreed on focusing on mobile app development and API improvements. Sarah mentioned the need for better user analytics integration...",
    chunkIndex: 1,
    totalChunks: 5
  },
  {
    id: "chunk-2", 
    fileName: "product_strategy_chunk_2.txt",
    sourceDocument: "Product_Strategy_Meeting_Transcript.docx",
    size: "1.8 KB",
    createdDate: "2024-01-15",
    content: "Budget allocation discussion for the mobile development team. Mike presented cost estimates for iOS and Android development. Estimated timeline: 3 months for MVP...",
    chunkIndex: 2,
    totalChunks: 5
  },
  {
    id: "chunk-3",
    fileName: "sprint_planning_chunk_1.txt", 
    sourceDocument: "Sprint_Planning_Notes.docx",
    size: "1.5 KB",
    createdDate: "2024-01-16", 
    content: "Sprint 12 planning session. User stories prioritization based on customer feedback. High priority: user authentication improvements, payment gateway integration...",
    chunkIndex: 1,
    totalChunks: 3
  },
  {
    id: "chunk-4",
    fileName: "client_presentation_chunk_1.txt",
    sourceDocument: "Client_Presentation_Recording.docx", 
    size: "2.5 KB",
    createdDate: "2024-01-17",
    content: "Client feedback on proposed features. Positive response to dashboard redesign. Concerns raised about data migration timeline. Client requested additional security documentation...",
    chunkIndex: 1,
    totalChunks: 4
  },
  {
    id: "chunk-5",
    fileName: "client_presentation_chunk_2.txt",
    sourceDocument: "Client_Presentation_Recording.docx",
    size: "1.9 KB", 
    createdDate: "2024-01-17",
    content: "Technical discussion about API endpoints and data formats. Client's technical team asked about rate limiting and authentication methods. Alex provided detailed responses...",
    chunkIndex: 2,
    totalChunks: 4
  },
  {
    id: "chunk-6",
    fileName: "standup_summary_chunk_1.txt",
    sourceDocument: "Team_Standup_Summary.docx",
    size: "1.2 KB",
    createdDate: "2024-01-18",
    content: "Daily standup updates from team members. Frontend team completed login page redesign. Backend team working on database optimization. QA team identified 3 minor bugs...",
    chunkIndex: 1,
    totalChunks: 2
  }
];

interface DataChunksTabProps {
  meetingId: string;
}

export function DataChunksTab({ meetingId }: DataChunksTabProps) {
  const [dataChunks] = useState<DataChunk[]>(dummyDataChunks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<DataChunk | null>(null);

  const filteredChunks = dataChunks.filter(chunk =>
    chunk.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chunk.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chunk.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedChunks = filteredChunks.reduce((acc, chunk) => {
    if (!acc[chunk.sourceDocument]) {
      acc[chunk.sourceDocument] = [];
    }
    acc[chunk.sourceDocument].push(chunk);
    return acc;
  }, {} as Record<string, DataChunk[]>);

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel - Chunks List */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Data Chunks</h2>
            <p className="text-muted-foreground">Text chunks generated from meeting transcripts</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chunks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generated Chunks
              <Badge variant="secondary">{filteredChunks.length} chunks</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {Object.entries(groupedChunks).map(([sourceDoc, chunks]) => (
                  <div key={sourceDoc}>
                    <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teams-blue" />
                      {sourceDoc}
                      <Badge variant="outline" className="text-xs">
                        {chunks.length} chunks
                      </Badge>
                    </h3>
                    
                    <div className="space-y-2 ml-6">
                      {chunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className={`p-4 border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/20 ${
                            selectedChunk?.id === chunk.id ? 'bg-teams-blue/10 border-teams-blue/30' : ''
                          }`}
                          onClick={() => setSelectedChunk(chunk)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileType className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{chunk.fileName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {chunk.chunkIndex}/{chunk.totalChunks}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {chunk.content}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{chunk.size}</span>
                            <span>Created {new Date(chunk.createdDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredChunks.length === 0 && searchTerm && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No chunks found matching "{searchTerm}"</p>
                  </div>
                )}
                
                {dataChunks.length === 0 && (
                  <div className="text-center py-8">
                    <FileType className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No data chunks available</p>
                    <p className="text-sm text-muted-foreground">Upload documents to generate data chunks</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Chunk Preview */}
      <div className="w-96">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedChunk ? 'Chunk Preview' : 'Select a Chunk'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedChunk ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">{selectedChunk.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    From: {selectedChunk.sourceDocument}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Chunk {selectedChunk.chunkIndex} of {selectedChunk.totalChunks}</span>
                    <span>{selectedChunk.size}</span>
                    <span>{new Date(selectedChunk.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <h5 className="font-medium text-sm text-foreground mb-2">Content</h5>
                  <ScrollArea className="h-[400px]">
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedChunk.content}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" className="flex-1 bg-teams-blue hover:bg-teams-blue/90">
                    <Eye className="h-4 w-4 mr-2" />
                    Full View
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileType className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Click on a chunk to preview its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}