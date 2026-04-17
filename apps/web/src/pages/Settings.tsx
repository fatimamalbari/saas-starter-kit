import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
}

export default function Settings() {
  const { tenants, currentTenantId, refreshUser, switchTenant } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;
  const currentTenantName = tenants.find((t) => t.id === currentTenantId)?.name;
  const canEdit = currentRole === "OWNER" || currentRole === "ADMIN";
  const isOwner = currentRole === "OWNER";

  useEffect(() => {
    setLoading(true);
    api<{ data: TenantDetails }>("/tenants/current")
      .then((res) => {
        setName(res.data.name);
        setSlug(res.data.slug);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentTenantId]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api("/tenants/current", { method: "PATCH", body: { name } });
      setSuccess("Workspace updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      await api("/tenants/current", { method: "DELETE" });
      await refreshUser();
      // Switch to another workspace if available, otherwise go to select-workspace
      const remaining = tenants.filter((t) => t.id !== currentTenantId);
      if (remaining.length > 0) {
        switchTenant(remaining[0].id);
        navigate("/");
      } else {
        navigate("/select-workspace");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your workspace configuration
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 560 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SettingsOutlinedIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Workspace Settings
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your role: <Chip label={currentRole} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Box>
              <Skeleton variant="rounded" height={56} sx={{ mb: 2, borderRadius: 2 }} />
              <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <>
              <TextField
                label="Workspace Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Slug"
                fullWidth
                value={slug}
                disabled
                helperText="The URL-friendly identifier for your workspace (cannot be changed)"
                sx={{ mb: 3 }}
              />

              {canEdit && (
                <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Workspace — OWNER only, not last workspace */}
      {isOwner && tenants.length > 1 && (
        <Card
          sx={{
            maxWidth: 560,
            mt: 4,
            border: "1px solid",
            borderColor: "error.main",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "error.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WarningAmberIcon sx={{ color: "error.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="error.main">
                Danger Zone
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Permanently delete this workspace and all its data including projects, members, and invites.
              This action cannot be undone.
            </Typography>

            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setDeleteError("");
                setConfirmName("");
                setDeleteOpen(true);
              }}
            >
              Delete Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Workspace Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Workspace</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            This will permanently delete the workspace <strong>{currentTenantName}</strong> and all its
            projects, members, and invites.
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Type <strong>{currentTenantName}</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={currentTenantName}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteWorkspace}
            disabled={confirmName !== currentTenantName || deleting}
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
