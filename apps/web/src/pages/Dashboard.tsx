import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  projectCount: number;
  members: { id: string; name: string; email: string; role: string }[];
}

export default function Dashboard() {
  const { user, tenants, currentTenantId } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;

  useEffect(() => {
    setLoading(true);
    api<{ data: TenantDetails }>("/tenants/current")
      .then((res) => setTenant(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentTenantId]);

  const statCards = [
    {
      label: "Projects",
      value: tenant?.projectCount ?? 0,
      icon: <FolderIcon sx={{ fontSize: 28 }} />,
      color: "#a78bfa",
      bg: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(124,58,237,0.1))",
      onClick: () => navigate("/projects"),
    },
    {
      label: "Members",
      value: tenant?.memberCount ?? 0,
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: "#38bdf8",
      bg: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(2,132,199,0.1))",
      onClick: () => navigate("/members"),
    },
    {
      label: "Your Role",
      value: currentRole ?? "—",
      icon: <SecurityIcon sx={{ fontSize: 28 }} />,
      color: "#34d399",
      bg: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))",
      onClick: () => navigate("/settings"),
    },
  ];

  return (
    <Box>
      {/* Welcome banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e1e2f 0%, #252540 50%, #1a1a2e 100%)",
          border: "1px solid rgba(167,139,250,0.15)",
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          mb: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            top: -60,
            right: -30,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            bottom: -30,
            right: 100,
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h4" sx={{ color: "white", mb: 0.5 }}>
            {loading ? (
              <Skeleton width={250} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
            ) : (
              `Welcome back, ${user?.name?.split(" ")[0] || "there"}`
            )}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem" }}>
            {loading ? (
              <Skeleton width={180} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
            ) : (
              `${tenant?.name} workspace`
            )}
          </Typography>
        </Box>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
            {loading ? (
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            ) : (
              <Card
                sx={{
                  cursor: "pointer",
                  "&:hover": { transform: "translateY(-2px)" },
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onClick={stat.onClick}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        background: stat.bg,
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" sx={{ mb: 0.5, color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>

      {/* Quick actions + recent members */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FolderIcon />}
                  onClick={() => navigate("/projects")}
                  sx={{ justifyContent: "flex-start", py: 1.2 }}
                >
                  Create a new project
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate("/members")}
                  sx={{ justifyContent: "flex-start", py: 1.2 }}
                >
                  Invite a team member
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate("/settings")}
                  sx={{ justifyContent: "flex-start", py: 1.2 }}
                >
                  Manage workspace settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Team Members</Typography>
                <Button size="small" onClick={() => navigate("/members")}>View all</Button>
              </Box>
              {loading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" height={48} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {(tenant?.members ?? []).slice(0, 5).map((member) => (
                    <Box
                      key={member.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: member.role === "OWNER" ? "primary.main" : member.role === "ADMIN" ? "secondary.main" : "grey.400",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {member.email}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          bgcolor: member.role === "OWNER" ? "rgba(167,139,250,0.15)" : member.role === "ADMIN" ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.06)",
                          color: member.role === "OWNER" ? "primary.main" : member.role === "ADMIN" ? "secondary.main" : "text.secondary",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      >
                        {member.role}
                      </Typography>
                    </Box>
                  ))}
                  {(!tenant?.members || tenant.members.length === 0) && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                      No members yet
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
