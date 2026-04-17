import { useEffect, useState } from "react";
import {
  Alert,
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
  TextField,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const { user, tenants, currentTenantId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;
  const isOwnerOrAdmin = currentRole === "OWNER" || currentRole === "ADMIN";

  const fetchMembers = () => {
    api<{ data: Member[] }>("/members")
      .then((res) => setMembers(res.data))
      .catch(() => {});
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

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    await api(`/members/${userId}`, { method: "DELETE" });
    fetchMembers();
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
        <Typography variant="h4">Members</Typography>
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

      {members.map((member) => (
        <Box
          key={member.id}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            mb: 1,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="subtitle1">{member.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {member.email}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={member.role}
              color={roleColors[member.role]}
              size="small"
            />
            {isOwnerOrAdmin &&
              member.role !== "OWNER" &&
              member.id !== user?.id && (
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleRemove(member.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
          </Box>
        </Box>
      ))}

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {inviteLink ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
        <DialogActions>
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
              <Button variant="contained" onClick={handleInvite}>
                Send Invite
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
