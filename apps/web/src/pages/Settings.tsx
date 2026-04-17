import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
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

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;
  const canEdit = currentRole === "OWNER" || currentRole === "ADMIN";

  useEffect(() => {
    api<{ data: TenantDetails }>("/tenants/current")
      .then((res) => {
        setName(res.data.name);
        setSlug(res.data.slug);
      })
      .catch(() => {});
  }, [currentTenantId]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    try {
      await api("/tenants/current", { method: "PATCH", body: { name } });
      setSuccess("Workspace updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Workspace Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

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
            helperText="Slug cannot be changed"
            sx={{ mb: 3 }}
          />

          {canEdit && (
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
