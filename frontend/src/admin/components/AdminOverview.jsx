import { useEffect, useState } from "react";
import {
  FolderKanban,
  Code2,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import { apiRequest } from "../../services/api";

function Overview({ user }) {
  const [stats, setStats] = useState({
    projects: 0,
    skills: 0,
    experiences: 0,
    educations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const results = await Promise.all([
          apiRequest("/projects"),
          apiRequest("/skills"),
          apiRequest("/experiences"),
          apiRequest("/education"),
        ]);

        setStats({
          projects: results[0].count,
          skills: results[1].count,
          experiences: results[2].count,
          educations: results[3].count,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const cards = [
    { label: "Projects", value: stats.projects, icon: FolderKanban },
    { label: "Skills", value: stats.skills, icon: Code2 },
    { label: "Experience", value: stats.experiences, icon: BriefcaseBusiness },
    { label: "Education", value: stats.educations, icon: GraduationCap },
  ];

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {user?.name || "Admin"}.</p>
        </div>
      </div>

      <div className="admin-stats">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className="stat-icon"><Icon size={23} /></div>
              <p>{card.label}</p>
              <h2>{loading ? "..." : card.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="admin-welcome">
        <h2>Your Portfolio Control Center</h2>
        <p>
          Manage your projects, technical skills, professional experience
          and educational background from one place.
        </p>
      </div>
    </>
  );
}

export default Overview;
