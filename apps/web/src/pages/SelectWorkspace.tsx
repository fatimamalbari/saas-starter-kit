import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckIcon from "@mui/icons-material/Check";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function SelectWorkspace() {
  const { user, tenants, pendingInvites, switchTenant, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelectWorkspace = (tenantId: string) => {
    switchTenant(tenantId);
    navigate("/");
  };

  const handleAcceptInvite = async (invite: typeof pendingInvites[0]) => {
    setError("");
    setAcceptingId(invite.id);
    try {
      await api("/members/accept-invite", {
        method: "POST",
        tenantId: invite.tenant.id,
      });
      await refreshUser();
      switchTenant(invite.tenant.id);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Box sx={{ width: 500, maxWidth: "100%" }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <WorkspacesIcon sx={{ color: "white", fontSize: 28 }} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Choose a workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name}. Select a workspace to continue.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Your Workspaces */}
        {tenants.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                  Your Workspaces
                </Typography>
              </Box>
              {tenants.map((tenant, index) => (
                <Box key={tenant.id}>
                  {index > 0 && <Divider />}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 3,
                      py: 2,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                    onClick={() => handleSelectWorkspace(tenant.id)}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "primary.main",
                        fontSize: "1rem",
                        fontWeight: 700,
                      }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {tenant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tenant.slug}
                      </Typography>
                    </Box>
                    <Chip
                      label={tenant.role}
                      size="small"
                      color={tenant.role === "OWNER" ? "primary" : tenant.role === "ADMIN" ? "secondary" : "default"}
                      variant={tenant.role === "MEMBER" ? "outlined" : "filled"}
                      sx={{ mr: 1 }}
                    />
                    <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <MailOutlineIcon sx={{ fontSize: 18, color: "warning.main" }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                  Pending Invites
                </Typography>
              </Box>
              {pendingInvites.map((invite, index) => (
                <Box key={invite.id}>
                  {index > 0 && <Divider />}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 3,
                      py: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "warning.main",
                        fontSize: "1rem",
                        fontWeight: 700,
                      }}
                    >
                      {invite.tenant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {invite.tenant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Invited as {invite.role}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckIcon />}
                      disabled={acceptingId === invite.id}
                      onClick={() => handleAcceptInvite(invite)}
                    >
                      {acceptingId === invite.id ? "Joining..." : "Accept"}
                    </Button>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No workspaces at all */}
        {tenants.length === 0 && pendingInvites.length === 0 && (
          <Card>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No workspaces yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first workspace to get started
              </Typography>
              <Button variant="contained" onClick={() => navigate("/signup")}>
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout link */}
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button
            variant="text"
            size="small"
            color="inherit"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{ color: "text.secondary" }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
