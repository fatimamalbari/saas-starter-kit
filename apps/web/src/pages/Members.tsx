import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
}

const roleColors: Record<string, "primary" | "secondary" | "default"> = {
  OWNER: "primary",
  ADMIN: "secondary",
  MEMBER: "default",
};

export default function Members() {
  const { user, tenants, currentTenantId, refreshUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;
  const isOwnerOrAdmin = currentRole === "OWNER" || currentRole === "ADMIN";

  const fetchMembers = () => {
    setLoading(true);
    api<{ data: Member[] }>("/members")
      .then((res) => setMembers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchMembers, [currentTenantId]);

  const handleInvite = async () => {
    setError("");
    setSuccess("");
    setInviteLink("");
    try {
      const res = await api<{ data: { inviteLink: string } }>("/members/invite", {
        method: "POST",
        body: { email, role },
      });
      setSuccess(`Invite created for ${email}`);
      setInviteLink(res.data.inviteLink);
      setEmail("");
      setRole("MEMBER");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await api(`/members/${memberId}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      await refreshUser();
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api(`/members/${userId}`, { method: "DELETE" });
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
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
          <Typography variant="h4">Members</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your team members and roles
          </Typography>
        </Box>
        {isOwnerOrAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setError("");
              setSuccess("");
              setInviteLink("");
              setInviteOpen(true);
            }}
          >
            Invite
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : members.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <GroupIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No members yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {members.map((member) => (
            <Box
              key={member.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "white",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.15s ease",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: member.role === "OWNER" ? "primary.main" : member.role === "ADMIN" ? "secondary.main" : "grey.400",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {member.name}
                    {member.id === user?.id && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (you)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.email}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {currentRole === "OWNER" &&
                  member.role !== "OWNER" &&
                  member.id !== user?.id ? (
                  <Select
                    size="small"
                    value={member.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      if (newRole === "OWNER") {
                        if (!confirm(`Transfer ownership to ${member.name}? You will be demoted to Admin.`)) return;
                      }
                      handleRoleChange(member.id, newRole);
                    }}
                    sx={{ minWidth: 110, height: 32, fontSize: "0.8rem" }}
                  >
                    <MenuItem value="MEMBER">Member</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                  </Select>
                ) : (
                  <Chip
                    label={member.role}
                    color={roleColors[member.role]}
                    size="small"
                    variant={member.role === "MEMBER" ? "outlined" : "filled"}
                  />
                )}
                {isOwnerOrAdmin &&
                  member.role !== "OWNER" &&
                  member.id !== user?.id && (
                    <Tooltip title="Remove member">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemove(member.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Invite Member</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {inviteLink ? (
            <>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Share this link with the invited user:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={inviteLink}
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                    }}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mt: 1, mb: 2 }}
              />
              <Select
                fullWidth
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {inviteLink ? (
            <>
              <Button
                onClick={() => {
                  setInviteLink("");
                  setSuccess("");
                }}
              >
                Invite Another
              </Button>
              <Button variant="contained" onClick={() => setInviteOpen(false)}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleInvite} disabled={!email.trim()}>
                Send Invite
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
