import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  projectCount: number;
}

export default function Dashboard() {
  const { tenants, currentTenantId } = useAuth();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);

  const currentRole = tenants.find((t) => t.id === currentTenantId)?.role;

  useEffect(() => {
    api<{ data: TenantDetails }>("/tenants/current")
      .then((res) => setTenant(res.data))
      .catch(() => {});
  }, [currentTenantId]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {tenant?.name || "Loading..."} &middot; {currentRole}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FolderIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{tenant?.projectCount ?? "-"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Projects
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{tenant?.memberCount ?? "-"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Members
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
