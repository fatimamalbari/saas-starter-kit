import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function Account() {
  const { user, tenants, logout } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setError("");
    setDeleting(true);
    try {
      await api("/auth/delete-account", {
        method: "DELETE",
        body: { confirmEmail },
      });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Account</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your personal account settings
        </Typography>
      </Box>

      {/* Profile Info */}
      <Card sx={{ maxWidth: 560, mb: 4 }}>
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
              <PersonOutlineIcon sx={{ color: "primary.main" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Profile Information
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                fontSize: "1.3rem",
                fontWeight: 600,
              }}
            >
              {userInitial}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card
        sx={{
          maxWidth: 560,
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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Once you delete your account, there is no going back. All your personal data,
            memberships, and any workspaces where you are the only member will be permanently removed.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            To delete just a single workspace, go to that workspace's <strong>Settings</strong> page instead.
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setError("");
              setConfirmEmail("");
              setDialogOpen(true);
            }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Account</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            This action is <strong>permanent</strong> and cannot be undone. This will delete:
          </Alert>

          <Box sx={{ mb: 2, pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              &bull; Your user account and all personal data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              &bull; Your memberships in all workspaces ({tenants.length} workspace{tenants.length !== 1 ? "s" : ""})
            </Typography>
            {tenants.filter(t => t.role === "OWNER").length > 0 && (
              <Typography variant="body2" color="error.main" fontWeight={500}>
                &bull; Workspaces you own: {tenants.filter(t => t.role === "OWNER").map(t => t.name).join(", ")}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Want to delete just one workspace? Go to that workspace's <strong>Settings</strong> page instead.
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Type <strong>{user?.email}</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={user?.email}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={confirmEmail !== user?.email || deleting}
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
