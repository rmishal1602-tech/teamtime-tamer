import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Edit3, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BusinessRequirementsTabProps {
  meetingId: string;
}

const defaultTemplate = `# Business Requirements Document

## 1. Project Overview
**Project Name:** [Project Name]
**Date:** ${new Date().toLocaleDateString()}
**Stakeholders:** [List key stakeholders]
**Document Version:** 1.0

## 2. Executive Summary
Provide a high-level overview of the project, its objectives, and expected outcomes.

## 3. Business Objectives
### Primary Objectives:
- Objective 1: [Describe primary business goal]
- Objective 2: [Describe secondary business goal]
- Objective 3: [Describe tertiary business goal]

### Success Metrics:
- KPI 1: [Define measurable success criteria]
- KPI 2: [Define measurable success criteria]
- KPI 3: [Define measurable success criteria]

## 4. Scope and Boundaries

### In Scope:
- Feature/Function 1
- Feature/Function 2
- Feature/Function 3

### Out of Scope:
- Items explicitly excluded from this project
- Future enhancements to be considered separately

## 5. Functional Requirements

### 5.1 Core Features
**FR-001:** [Feature Name]
- Description: [Detailed description]
- Priority: High/Medium/Low
- Acceptance Criteria: [Clear criteria for completion]

**FR-002:** [Feature Name]
- Description: [Detailed description]
- Priority: High/Medium/Low
- Acceptance Criteria: [Clear criteria for completion]

### 5.2 User Stories
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## 6. Non-Functional Requirements

### 6.1 Performance Requirements
- Response time: [Specify requirements]
- Throughput: [Specify requirements]
- Scalability: [Specify requirements]

### 6.2 Security Requirements
- Authentication: [Specify requirements]
- Authorization: [Specify requirements]
- Data Protection: [Specify requirements]

### 6.3 Usability Requirements
- User Interface: [Specify requirements]
- Accessibility: [Specify requirements]
- User Experience: [Specify requirements]

## 7. Business Rules and Constraints

### Business Rules:
1. Rule 1: [Describe business rule]
2. Rule 2: [Describe business rule]
3. Rule 3: [Describe business rule]

### Constraints:
- Budget: [Specify budget constraints]
- Timeline: [Specify timeline constraints]
- Resources: [Specify resource constraints]
- Technology: [Specify technology constraints]

## 8. Assumptions and Dependencies

### Assumptions:
- Assumption 1: [Describe assumption]
- Assumption 2: [Describe assumption]

### Dependencies:
- Dependency 1: [External dependency]
- Dependency 2: [Internal dependency]

## 9. Risk Assessment

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| Risk 1 | High/Medium/Low | High/Medium/Low | [Strategy] |
| Risk 2 | High/Medium/Low | High/Medium/Low | [Strategy] |
| Risk 3 | High/Medium/Low | High/Medium/Low | [Strategy] |

## 10. Implementation Timeline

### Phase 1: Planning & Design
- Duration: [Timeframe]
- Key Activities: [List activities]
- Deliverables: [List deliverables]

### Phase 2: Development
- Duration: [Timeframe]
- Key Activities: [List activities]
- Deliverables: [List deliverables]

### Phase 3: Testing & Deployment
- Duration: [Timeframe]
- Key Activities: [List activities]
- Deliverables: [List deliverables]

## 11. Acceptance Criteria
- [ ] All functional requirements implemented
- [ ] All non-functional requirements met
- [ ] User acceptance testing completed
- [ ] Documentation completed
- [ ] Training completed

## 12. Sign-off
**Business Analyst:** _____________________ Date: _______
**Project Manager:** _____________________ Date: _______
**Stakeholder:** _____________________ Date: _______

---
*This document serves as the foundation for project planning and development activities.*`;

export function BusinessRequirementsTab({ meetingId }: BusinessRequirementsTabProps) {
  const [content, setContent] = useState(defaultTemplate);
  const [isEditing, setIsEditing] = useState(false);
  const [originalContent, setOriginalContent] = useState(defaultTemplate);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const { toast } = useToast();

  // Load business requirements from database
  useEffect(() => {
    loadBusinessRequirements();
  }, [meetingId]);

  // Listen for updates from the ActionItemsTab
  useEffect(() => {
    const handleBusinessRequirementsUpdate = (event: CustomEvent) => {
      setContent(event.detail.content);
      setCurrentVersion(event.detail.version);
      toast({
        title: "Business Requirements Updated",
        description: `New version ${event.detail.version} loaded from AI generation.`
      });
    };

    window.addEventListener('businessRequirementsUpdated', handleBusinessRequirementsUpdate as EventListener);
    return () => window.removeEventListener('businessRequirementsUpdated', handleBusinessRequirementsUpdate as EventListener);
  }, [toast]);

  const loadBusinessRequirements = async () => {
    try {
      setIsLoading(true);
      
      // Only try to load from database if meetingId is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId);
      
      if (!isValidUUID) {
        setContent(defaultTemplate);
        setCurrentVersion(1);
        return;
      }

      const { data, error } = await supabase
        .from('business_requirements')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading business requirements:', error);
        setContent(defaultTemplate);
        setCurrentVersion(1);
        return;
      }

      if (data) {
        setContent(data.content);
        setCurrentVersion(data.version);
        setOriginalContent(data.content);
      } else {
        setContent(defaultTemplate);
        setCurrentVersion(1);
        setOriginalContent(defaultTemplate);
      }
    } catch (error) {
      console.error('Error loading business requirements:', error);
      setContent(defaultTemplate);
      setCurrentVersion(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setOriginalContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Only save to database if meetingId is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(meetingId);
      
      if (isValidUUID) {
        // Get the latest version number
        const { data: latestVersion } = await supabase
          .from('business_requirements')
          .select('version')
          .eq('meeting_id', meetingId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        const newVersion = latestVersion ? latestVersion.version + 1 : 1;

        const { error } = await supabase
          .from('business_requirements')
          .insert({
            meeting_id: meetingId,
            content: content,
            version: newVersion
          });

        if (error) {
          console.error('Error saving business requirements:', error);
          toast({
            title: "Error saving document",
            description: "Failed to save business requirements to database",
            variant: "destructive"
          });
          return;
        }

        setCurrentVersion(newVersion);
        toast({
          title: "Business Requirements Saved",
          description: `Document saved successfully as version ${newVersion}.`
        });
      } else {
        toast({
          title: "Business Requirements Saved",
          description: "Your business requirements document has been saved locally."
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving business requirements:', error);
      toast({
        title: "Error saving document",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-semibold text-foreground">
                Business Requirements Document
              </CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                v{currentVersion}
              </Badge>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    size="sm" 
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleEdit} 
                  size="sm" 
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full w-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-sm font-mono"
              placeholder="Enter your business requirements..."
            />
          ) : (
            <div className="h-full overflow-auto p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {content}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}