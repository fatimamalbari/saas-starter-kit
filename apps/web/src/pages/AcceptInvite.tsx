import { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface InviteDetails {
  email: string;
  role: string;
  tenant: { id: string; name: string; slug: string };
  accountExists: boolean;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, switchTenant, refreshUser } = useAuth();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = !!user;
  const isMatchingEmail = isLoggedIn && user?.email === invite?.email;

  useEffect(() => {
    api<{ data: InviteDetails }>(`/members/verify-invite/${token}`)
      .then((res) => setInvite(res.data))
      .catch((err) => setVerifyError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // New user signup with invite
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await api<{
        data: {
          token: string;
          user: { id: string; email: string; name: string };
          tenant: { id: string; name: string; slug: string };
        };
      }>("/auth/signup-with-invite", {
        method: "POST",
        body: { name, password, inviteToken: token },
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("tenantId", res.data.tenant.id);
      await refreshUser();
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  // Existing logged-in user accepts invite
  const handleAcceptInvite = async () => {
    if (!invite) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await api("/members/accept-invite", {
        method: "POST",
        tenantId: invite.tenant.id,
      });
      await refreshUser();
      switchTenant(invite.tenant.id);
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (verifyError) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
        <Card sx={{ width: 400, maxWidth: "90vw" }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>Invalid Invite</Typography>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{verifyError}</Alert>
            <Button variant="contained" onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 3 }}>
      <Card sx={{ width: 440, maxWidth: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: "16px",
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mx: "auto", mb: 2,
              }}
            >
              <GroupAddIcon sx={{ color: "white", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" gutterBottom>You're invited!</Typography>
            <Typography variant="body1" color="text.secondary">
              Join <strong>{invite?.tenant.name}</strong> as {invite?.role}
            </Typography>
            <Typography variant="body2" color="text.secondary">{invite?.email}</Typography>
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{submitError}</Alert>
          )}

          {/* Logged in as the invited user — one-click accept */}
          {isLoggedIn && isMatchingEmail && (
            <>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                You're signed in as <strong>{user?.email}</strong>. Click below to join.
              </Alert>
              <Button
                variant="contained" fullWidth size="large"
                disabled={submitting} onClick={handleAcceptInvite}
                sx={{ py: 1.5 }}
              >
                {submitting ? "Joining..." : "Accept Invitation"}
              </Button>
            </>
          )}

          {/* Logged in but as a different user */}
          {isLoggedIn && !isMatchingEmail && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              You're signed in as <strong>{user?.email}</strong>, but this invite is for <strong>{invite?.email}</strong>. Please logout and sign in with the correct account.
            </Alert>
          )}

          {/* Not logged in + account exists — prompt to login */}
          {!isLoggedIn && invite?.accountExists && (
            <>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                You already have an account. Sign in to accept this invitation.
              </Alert>
              <Button
                variant="contained" fullWidth size="large"
                component={RouterLink}
                to={`/login?redirect=/invite/${token}`}
                sx={{ py: 1.5 }}
              >
                Sign In to Accept
              </Button>
            </>
          )}

          {/* Not logged in + no account — signup form */}
          {!isLoggedIn && !invite?.accountExists && (
            <Box component="form" onSubmit={handleSignup}>
              <TextField
                label="Email" fullWidth
                value={invite?.email || ""} disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Your Name" fullWidth required
                value={name} onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Create Password" type="password" fullWidth required
                inputProps={{ minLength: 8 }}
                value={password} onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={submitting} sx={{ py: 1.5 }}
              >
                {submitting ? "Creating account..." : "Create Account & Join"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
