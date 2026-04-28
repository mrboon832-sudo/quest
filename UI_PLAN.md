# UI Implementation Plan: Project Quest
**System:** Fraud Detection and Risk Monitoring System
**Role:** Frontend Interface & Documentation

## 1. Technology Stack
- **Framework:** React
- **UI Component Library:** Ant Design (AntD)
- **Graph Visualization:** AntV G6 (for interactive fraud network mapping)
- **Data Visualization/Charts:** Recharts (for risk distribution and analytics)
- **Styling:** CSS Modules or Styled Components (integrated with AntD)

## 2. Application Structure (Sitemap)

### A. Main Dashboard (`/dashboard`)
*Objective: Provide a high-level overview of system health and active threats.*
- **KPI Cards:** Total Transactions, Active Fraud Alerts, High-Risk Accounts.
- **Analytics Section:** 
    - Risk Distribution Pie Chart (Low vs. Medium vs. High).
    - Fraud Trend Line Chart (Alerts over the last 30 days).
- **Recent Alerts Table:** An AntD Table showing the latest flagged transactions with status badges.

### B. Network Explorer (`/explorer`)
*Objective: Visualize the "spider-web" of fraudulent connections.*
- **Interactive Graph Canvas:** Powered by AntV G6.
    - **Nodes:** Color-coded by entity type (Customer, Account, Device, Location).
    - **Edges:** Visual representation of relationships (OWNS, PERFORMED, LOCATED_AT).
    - **Visual Cues:** Nodes with high risk scores should be larger and red.
- **Search & Filter Panel:** Ability to search for a specific Account ID or Customer to center the graph on that entity.
- **Node Detail Panel:** A slide-out drawer (AntD Drawer) showing the properties of the selected node.

### C. Risk Analysis Detail (`/analysis/:id`)
*Objective: Deep-dive into a specific flagged entity/transaction.*
- **Risk Scoreboard:** A gauge chart showing the computed risk level.
- **Entity Timeline:** A vertical timeline showing the flow of funds/actions.
- **Audit Logs:** A detailed log of why the system flagged this specific entity.

## 3. Authentication & Data Strategy (Mock vs. Real)

### A. Mock Authentication (No Neo4j Required)
To allow UI testing without the backend, implement a simple mock auth system:
```
REACT_APP_MODE=mock  // In .env file
```
**Credentials for Testing:**
- Username: `testuser` | Password: `password123`
- Username: `admin` | Password: `admin123`

### B. Mock Data Layer
Create a `src/services/mockData.ts` file with realistic sample data:
- Mock Customers, Accounts, Transactions, Devices, Locations.
- Mock fraud alerts and risk scores.
- Mock graph structure (nodes and edges for G6 visualization).

**Example Mock Structure:**
```javascript
// Mock API responses that mimic real Neo4j queries
const mockDashboardData = {
  kpis: {
    totalTransactions: 15420,
    activeAlerts: 42,
    highRiskAccounts: 8
  },
  riskDistribution: [
    { name: "Low", value: 85, color: "#52c41a" },
    { name: "Medium", value: 12, color: "#faad14" },
    { name: "High", value: 3, color: "#f5222d" }
  ],
  fraudTrend: [
    { date: "2026-04-01", alerts: 5 },
    { date: "2026-04-02", alerts: 8 },
    // ... 30 days of data
  ]
};

const mockGraphData = {
  nodes: [
    { id: "C001", label: "Customer A", type: "customer", riskScore: 0.3 },
    { id: "ACC001", label: "Account 1", type: "account", riskScore: 0.7 },
    // ...
  ],
  edges: [
    { source: "C001", target: "ACC001", label: "OWNS" },
    // ...
  ]
};
```

### C. API Abstraction Layer
Create `src/services/api.ts` to handle both mock and real requests:
```javascript
// Example pattern
const API_MODE = process.env.REACT_APP_MODE || 'real';

export const fetchDashboardData = async () => {
  if (API_MODE === 'mock') {
    return mockDashboardData;  // Return mock data immediately
  } else {
    return fetch('/api/dashboard').then(res => res.json());  // Call real API
  }
};

export const fetchGraphData = async (entityId) => {
  if (API_MODE === 'mock') {
    return mockGraphData;
  } else {
    return fetch(`/api/graph/${entityId}`).then(res => res.json());
  }
};
```

## 4. Key UI Features to Implement
- **Responsive Layout:** Use AntD `Layout` for a sidebar navigation and a flexible content area.
- **Interactive Graphing:** Implementation of zoom, pan, and drag-and-drop for the fraud network.
- **Dynamic Filtering:** Real-time updating of charts based on date ranges or risk thresholds.
- **Mock Auth Page:** Simple login form that accepts any credentials in mock mode.
- **Data Source Toggle:** (Optional) Add a settings panel to toggle between mock and real data during development.

## 5. Documentation Plan
- **README.md:**
    - System Architecture Diagram.
    - Installation Guide (Node.js, Neo4j setup).
    - Environment variable configuration.
    - Step-by-step "Quick Start" guide (including mock mode setup).
    - How to switch between mock and real data.
- **UI Design Document:**
    - Explanation of color palettes (Red = Danger/Fraud, Blue = Neutral).
    - User flow diagrams (How a user goes from an alert to a graph investigation).
- **API Documentation:** Mapping of frontend requests to Neo4j Cypher queries (coordinated with backend team).
- **Mock Data Guide:** How to modify mock data for different testing scenarios.

## 6. Development Roadmap
1. **Phase 1: Foundation** → Setup React + AntD + Routing + Mock Auth.
2. **Phase 2: Mock Data Layer** → Create `mockData.ts` and API abstraction layer.
3. **Phase 3: Dashboard** → Implement KPI cards and Recharts with mock data.
4. **Phase 4: Graph Integration** → Implement AntV G6 and connect to mock graph data.
5. **Phase 5: Detail Pages** → Build the Analysis view and Node drawers.
6. **Phase 6: Real API Integration** → Replace mock calls with actual Neo4j API endpoints.
7. **Phase 7: Refinement** → Error handling, responsive tweaks, and final documentation.

## 7. Environment Variables (.env)
```
REACT_APP_MODE=mock                    # Set to 'mock' for testing, 'real' for production
REACT_APP_API_BASE_URL=http://localhost:3001  # Backend API URL
```
