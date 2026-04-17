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
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { api } from "../lib/api";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api<{ data: Project[] }>("/projects")
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <Box>
          <Typography variant="h4">Projects</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your workspace projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New Project
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <FolderOpenIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first project to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 2.5,
                  "&:last-child": { pb: 2.5 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {project.name}
                  </Typography>
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 500 }}>
                      {project.description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(project.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(project)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(project.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingProject ? "Edit Project" : "New Project"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
            placeholder="Optional project description"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
