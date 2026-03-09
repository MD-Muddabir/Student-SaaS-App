/**
 * Super Admin - Analytics
 * Displays institute and student growth metrics
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import { Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import BackButton from "../../components/common/BackButton";
import ThemeSelector from "../../components/ThemeSelector";
import "../admin/Dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch basic dashboard stats (Institutes, Faculty, Students)
        const res = await api.get("/superadmin/dashboard");
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !stats) return <div className="dashboard-container">Loading...</div>;

  // Chart Data: Active vs Expired Institutes
  const instituteStatusData = {
    labels: ["Active", "Expired"],
    datasets: [
      {
        data: [stats.activeInstitutes, stats.expiredInstitutes],
        backgroundColor: ["#10b981", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  // Chart Data: Users Distribution (Students vs Faculty)
  const usersData = {
    labels: ["Students", "Faculty"],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalFaculty],
        backgroundColor: ["#3b82f6", "#8b5cf6"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📈 Platform Analytics</h1>
          <p>Usage statistics and growth metrics</p>
        </div>
        <div className="dashboard-header-right">
          <ThemeSelector />
          <BackButton />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.totalInstitutes}</h3>
            <p>Total Institutes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👩‍🏫</div>
          <div className="stat-content">
            <h3>{stats.totalFaculty}</h3>
            <p>Total Faculty</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className="card-title">Institute Health</h3>
          <div style={{ height: "300px", display: "flex", justifyContent: "center" }}>
            <Pie
              data={instituteStatusData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                  title: { display: true, text: "Active vs Expired Institutes" }
                }
              }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className="card-title">User Demographics</h3>
          <div style={{ height: "300px", display: "flex", justifyContent: "center" }}>
            <Doughnut
              data={usersData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                  title: { display: true, text: "Students vs Faculty Distribution" }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
