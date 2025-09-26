import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";
import isoWeek from "dayjs-plugin-isoWeek.js";
import { query } from "./db.js";
import path from "node:path";
import { fileURLToPath } from "url";

dotenv.config();
dayjs.extend(isoWeek);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPEN_HOUR  = Number(process.env.OPEN_HOUR  || 7);   // 07:00
const CLOSE_HOUR = Number(process.env.CLOSE_HOUR || 23);  // 23:00
const WEEKLY_CAP = Number(process.env.WEEKLY_CAP || 2);

// Servir front estático
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/", express.static(path.join(__dirname, "public")));

// Utilidades
const pad2 = n => String(n).padStart(2, "0");
const toHHMM = m => `${pad2(Math.floor(m/60))}:${pad2(m%60)}`;
const minutes = hhmm => {
  const [h, m] = hhmm.split(":").map(Number);
  return h*60 + m;
};

// Health
app.get("/api/health", (_req, res) => res.json({ ok:true }));

// Config pública (horarios para el front)
app.get("/api/config", (_req, res) => {
  res.json({ openHour: OPEN_HOUR, closeHour: CLOSE_HOUR, weeklyCap: WEEKLY_CAP });
});

/**
 * Disponibilidad por día
 * GET /api/availability?sport=tenis&court=1&date=YYYY-MM-DD&duration=60
 */
app.get("/api/availability", async (req, res) => {
  const { sport, court, date, duration } = req.query;
  if (!sport || !court || !date || !duration) return res.status(400).json({ error:"Parámetros incompletos" });

  const dur = Number(duration);
  const startM = OPEN_HOUR * 60;
  const endM   = CLOSE_HOUR * 60;

  // Reservas existentes ese día
  const { rows } = await query(
    `SELECT start_time, end_time FROM reservas
     WHERE sport=$1 AND court=$2 AND date=$3`,
    [sport, court, date]
  );

  // Convertimos intervalos ocupados a minutos
  const busy = rows.map(r => ({
    s: minutes(r.start_time.substring(0,5)),
    e: minutes(r.end_time.substring(0,5))
  }));

  const overlaps = (s1, e1, s2, e2) => !(e1 <= s2 || s1 >= e2);

  const slots = [];
  for (let m = startM; m <= endM - dur; m += 60) {
    const s = m;
    const e = m + dur;
    const clash = busy.some(b => overlaps(s, e, b.s, b.e));
    if (!clash) slots.push({ start: toHHMM(s), end: toHHMM(e) });
  }

  res.json({ date, sport, court, duration: dur, slots });
});

/**
 * Crear reserva
 * POST /api/reservations
 * body: { name, phone, sport, court, date, start, duration }
 */
app.post("/api/reservations", async (req, res) => {
  const { name, phone, sport, court, date, start, duration } = req.body || {};
  if (!name || !phone || !sport || !court || !date || !start || !duration) {
    return res.status(400).json({ error: "Campos incompletos" });
  }
  const dur = Number(duration);
  const end = toHHMM(minutes(start) + dur);

  // 1) Tope semanal por persona (servidor)
  const d = dayjs(date);
  const weekStart = d.isoWeekday(1).format("YYYY-MM-DD"); // lunes
  const weekEnd   = d.isoWeekday(7).format("YYYY-MM-DD"); // domingo

  const capQ = await query(
    `SELECT COUNT(*)::int AS c FROM reservas
     WHERE phone=$1 AND date BETWEEN $2 AND $3`,
    [phone, weekStart, weekEnd]
  );
  if (capQ.rows[0].c >= WEEKLY_CAP) {
    return res.status(409).json({ status:"denied", reason:"cap", message:"Alcanzaste el máximo semanal." });
  }

  // 2) Verificar superposición
  const clashQ = await query(
    `SELECT 1 FROM reservas
     WHERE sport=$1 AND court=$2 AND date=$3
       AND NOT ($4::time >= end_time OR $5::time <= start_time)
     LIMIT 1`,
    [sport, court, date, end, start]
  );
  if (clashQ.rowCount > 0) {
    return res.status(409).json({ status:"denied", reason:"overlap", message:"Ese horario ya está ocupado." });
  }

  // 3) Insertar
  await query(
    `INSERT INTO reservas (name, phone, sport, court, date, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [name, phone, sport, court, date, start, end]
  );

  res.json({ ok:true, message:"Reserva confirmada ✅", date, start, end });
});

// Start
app.listen(PORT, () => console.log(`API running on :${PORT}`));