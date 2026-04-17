import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
}

export default function Settings() {
  const { tenants, currentTenantId } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;
  const canEdit = currentRole === "OWNER" || currentRole === "ADMIN";

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
    </Box>
  );
}
