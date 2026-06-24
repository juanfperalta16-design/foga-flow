// ─── Date Utilities ─────────────────────────────────

export const today = () => new Date().toISOString().split("T")[0];

export const isOverdue = (fechaLimite, estado) => {
  if (!fechaLimite) return false;
  if (["Finalizado", "Aprobado"].includes(estado)) return false;
  return new Date(fechaLimite) < new Date(today());
};

export const formatDate = (date) => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString("es-EC", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

export const isSameDay = (d1, d2) => {
  const a = d1?.toDate ? d1.toDate() : new Date(d1);
  const b = d2?.toDate ? d2.toDate() : new Date(d2);
  return a.toISOString().split("T")[0] === b.toISOString().split("T")[0];
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
