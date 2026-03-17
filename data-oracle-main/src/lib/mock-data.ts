import type { DashboardData, AlertItem, ChatMessage } from "./api";

export const mockDashboard: DashboardData = {
  activeERPatients: 47,
  systemLatency: 12,
  criticalAlerts: 5,
  avgHeartRate: 78,
  admissionsFlow: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    admissions: Math.floor(Math.random() * 15) + 3,
    discharges: Math.floor(Math.random() * 12) + 2,
  })),
  recentCritical: [
    { id: "1", patient: "John D.", condition: "Cardiac Arrest", severity: "critical", time: "2 min ago" },
    { id: "2", patient: "Sarah M.", condition: "Respiratory Failure", severity: "critical", time: "8 min ago" },
    { id: "3", patient: "Robert K.", condition: "Septic Shock", severity: "critical", time: "15 min ago" },
    { id: "4", patient: "Emily W.", condition: "Stroke (Acute)", severity: "critical", time: "22 min ago" },
    { id: "5", patient: "Michael P.", condition: "Anaphylaxis", severity: "warning", time: "31 min ago" },
  ],
};

export const mockAlerts: AlertItem[] = [
  { id: "a1", title: "ICU Bed Capacity Critical", message: "ICU occupancy at 94%. Only 3 beds remaining.", severity: "critical", timestamp: "2026-03-16T10:23:00Z", source: "Bed Management" },
  { id: "a2", title: "Blood Bank Supply Low", message: "O-negative blood supply below threshold (12 units).", severity: "warning", timestamp: "2026-03-16T10:18:00Z", source: "Lab Systems" },
  { id: "a3", title: "MRI Scanner #2 Offline", message: "Scheduled maintenance in progress. ETA: 2 hours.", severity: "info", timestamp: "2026-03-16T09:45:00Z", source: "Equipment" },
  { id: "a4", title: "Pharmacy Restock Required", message: "Epinephrine auto-injectors below minimum stock level.", severity: "warning", timestamp: "2026-03-16T09:30:00Z", source: "Pharmacy" },
  { id: "a5", title: "Network Latency Spike", message: "East wing network experiencing 200ms+ latency.", severity: "critical", timestamp: "2026-03-16T09:15:00Z", source: "IT Infrastructure" },
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content: "Welcome to **DataGod Health AI**. I can help you query patient databases, generate reports, and visualize medical data. What would you like to analyze?",
    timestamp: new Date().toISOString(),
  },
];

export const mockChatResponses: Record<string, Partial<import("./api").ChatResponse>> = {
  default: {
    response: "I've analyzed the hospital data. Here's what I found based on your query.",
    type: "text",
  },
  sql: {
    response: "I generated a SQL query to fetch the requested patient records:",
    sql: `SELECT p.name, p.age, v.diagnosis, v.admission_date\nFROM patients p\nJOIN visits v ON p.id = v.patient_id\nWHERE v.status = 'active'\n  AND v.department = 'Emergency'\nORDER BY v.admission_date DESC\nLIMIT 20;`,
    type: "mixed",
  },
  chart: {
    response: "Here's the department admission breakdown for this week:",
    chart: [
      { department: "Emergency", patients: 142 },
      { department: "Cardiology", patients: 89 },
      { department: "Neurology", patients: 67 },
      { department: "Orthopedics", patients: 54 },
      { department: "Pediatrics", patients: 78 },
      { department: "Oncology", patients: 45 },
    ],
    type: "chart",
  },
  flowchart: {
    response: "Here's the patient intake workflow diagram:",
    flowchart: `graph TD\n    A[Patient Arrival] --> B{Emergency?}\n    B -->|Yes| C[Triage Assessment]\n    B -->|No| D[Registration]\n    C --> E[Priority Assignment]\n    E --> F[Treatment Room]\n    D --> G[Waiting Area]\n    G --> H[Consultation]\n    F --> I[Diagnosis & Treatment]\n    H --> I\n    I --> J{Admit?}\n    J -->|Yes| K[Bed Assignment]\n    J -->|No| L[Discharge]`,
    type: "mixed",
  },
};
