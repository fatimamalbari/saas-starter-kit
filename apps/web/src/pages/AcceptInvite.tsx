import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { api } from "../lib/api";

interface InviteDetails {
  email: string;
  role: string;
  tenant: { id: string; name: string; slug: string };
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ data: InviteDetails }>(`/members/verify-invite/${token}`)
      .then((res) => setInvite(res.data))
      .catch((err) => setVerifyError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (verifyError) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Card sx={{ width: 400, maxWidth: "90vw" }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>
              Invalid Invite
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              {verifyError}
            </Alert>
            <Button variant="contained" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: 400, maxWidth: "90vw" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" textAlign="center" gutterBottom>
            You're invited!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 1 }}
          >
            Join <strong>{invite?.tenant.name}</strong> as {invite?.role}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            {invite?.email}
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              value={invite?.email || ""}
              disabled
              sx={{ mb: 2 }}
            />
            <TextField
              label="Your Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Create Password"
              type="password"
              fullWidth
              required
              inputProps={{ minLength: 8 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Join Workspace"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
