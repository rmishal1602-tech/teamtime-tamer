import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Download, Eye, Search, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromFile, createTextChunks, DataChunk } from "@/lib/documentProcessor";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  description: string;
}

const dummyDocuments: Document[] = [
  {
    id: "1",
    name: "Product_Strategy_Meeting_Transcript.docx",
    type: "Word Document",
    size: "245 KB",
    uploadDate: "2024-01-15",
    description: "Full transcript of product strategy review meeting"
  },
  {
    id: "2",
    name: "Sprint_Planning_Notes.docx", 
    type: "Word Document",
    size: "180 KB",
    uploadDate: "2024-01-16",
    description: "Meeting notes and sprint planning decisions"
  },
  {
    id: "3",
    name: "Client_Presentation_Recording.docx",
    type: "Word Document", 
    size: "320 KB",
    uploadDate: "2024-01-17",
    description: "Transcript of client presentation and Q&A session"
  },
  {
    id: "4",
    name: "Team_Standup_Summary.docx",
    type: "Word Document",
    size: "95 KB", 
    uploadDate: "2024-01-18",
    description: "Daily standup meeting summary and updates"
  }
];

interface DocumentsTabProps {
  meetingId: string;
  onDataChunksGenerated: (chunks: DataChunk[]) => void;
}

export function DocumentsTab({ meetingId, onDataChunksGenerated }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>(dummyDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);

    for (const file of Array.from(files)) {
      try {
        // Check if file is Word or PDF
        if (file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.name.endsWith('.pdf') || file.type === 'application/pdf') {
          // Upload file to Supabase storage
          const fileExt = file.name.split('.').pop();
          const filePath = `temp-user-id/${meetingId}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('meeting-documents')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}: ${uploadError.message}`,
              variant: "destructive"
            });
            continue;
          }

          const newDoc: Document = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            type: file.name.endsWith('.pdf') ? 'PDF Document' : 'Word Document',
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            description: 'Meeting transcript uploaded by user'
          };
          
          setDocuments(prev => [newDoc, ...prev]);
          
          // Extract text and create chunks
          try {
            toast({
              title: "Processing document",
              description: `Extracting text from ${file.name}...`
            });
            
            const extractedText = await extractTextFromFile(file);
            const chunks = createTextChunks(extractedText, file.name).map(chunk => ({
              ...chunk,
              file_path: filePath
            }));
            
            // Send chunks to edge function for processing
            const { error: processError } = await supabase.functions.invoke('process-document', {
              body: {
                chunks,
                meetingId,
                userId: 'temp-user-id' // TODO: Replace with actual user ID when auth is implemented
              }
            });

            if (processError) {
              console.error('Process error:', processError);
              toast({
                title: "Processing failed",
                description: `Failed to process ${file.name}: ${processError.message}`,
                variant: "destructive"
              });
              continue;
            }
            
            onDataChunksGenerated(chunks);
            
            toast({
              title: "Document processed successfully",
              description: `${file.name} uploaded and ${chunks.length} text chunks generated with action items.`
            });
          } catch (error) {
            console.error('Error processing document:', error);
            toast({
              title: "Text extraction failed",
              description: `${file.name} uploaded but text could not be extracted.`,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload Word documents (.docx, .doc) or PDF files only.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Documents & Transcripts</h2>
          <p className="text-muted-foreground">Upload and manage meeting documents</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-teams-blue hover:bg-teams-blue/90"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

        <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? 'border-teams-blue bg-teams-blue-light/20' 
            : 'border-border hover:border-teams-blue/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          {isProcessing ? (
            <>
              <Loader className="h-12 w-12 mx-auto mb-4 text-teams-blue animate-spin" />
              <h3 className="text-lg font-medium mb-2">Processing documents...</h3>
              <p className="text-muted-foreground mb-4">
                Extracting text and creating data chunks
              </p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
              <p className="text-muted-foreground mb-4">
                Upload Word documents (.docx, .doc) or PDF files containing meeting transcripts
              </p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="border-teams-blue text-teams-blue hover:bg-teams-blue/10"
                disabled={isProcessing}
              >
                Choose Files
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Uploaded Documents
            <Badge variant="secondary">{filteredDocuments.length} documents</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-teams-blue/10 rounded-lg">
                    <FileText className="h-6 w-6 text-teams-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{doc.name}</h4>
                    <p className="text-sm text-muted-foreground mb-1">{doc.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                      <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredDocuments.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No documents found matching "{searchTerm}"</p>
              </div>
            )}
            
            {documents.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <p className="text-sm text-muted-foreground">Upload meeting transcripts to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}