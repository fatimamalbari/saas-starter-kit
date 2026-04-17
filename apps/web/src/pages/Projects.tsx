import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { api } from "../lib/api";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const fetchProjects = () => {
    api<{ data: Project[] }>("/projects")
      .then((res) => setProjects(res.data))
      .catch(() => {});
  };

  useEffect(fetchProjects, []);

  const openCreate = () => {
    setEditingProject(null);
    setName("");
    setDescription("");
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setError("");
    try {
      if (editingProject) {
        await api(`/projects/${editingProject.id}`, {
          method: "PATCH",
          body: { name, description },
        });
      } else {
        await api("/projects", {
          method: "POST",
          body: { name, description },
        });
      }
      setDialogOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await api(`/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Typography color="text.secondary">
          No projects yet. Create your first one!
        </Typography>
      ) : (
        projects.map((project) => (
          <Card key={project.id} sx={{ mb: 2 }}>
            <CardContent
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6">{project.name}</Typography>
                {project.description && (
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                )}
              </Box>
              <Box>
                <IconButton onClick={() => openEdit(project)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(project.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProject ? "Edit Project" : "New Project"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Project Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingProject ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
