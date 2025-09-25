import { useState, useEffect } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

export function ProjectSelector({ selectedProjectId, onProjectSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      setSelectedProject(project || projects[0]);
    } else if (projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [selectedProjectId, projects]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    onProjectSelect?.(project.id);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-1.5 h-auto text-sm font-medium hover:bg-muted"
        >
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="max-w-[200px] truncate">
            {selectedProject?.name || 'Select Project'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-background border shadow-md">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project)}
            className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted"
          >
            <div className="flex items-center gap-2 w-full">
              <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">{project.name}</span>
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground ml-6 line-clamp-2">
                {project.description}
              </p>
            )}
          </DropdownMenuItem>
        ))}
        
        {projects.length === 0 && (
          <div className="p-3 text-center text-sm text-muted-foreground">
            No projects found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}