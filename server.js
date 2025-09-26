import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js"; // 👈 CORRECTO
import { query } from "./db.js";
import path from "node:path";
import { fileURLToPath } from "url";

dotenv.config();
dayjs.extend(isoWeek);

// Inicializa Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuración de variables de entorno
const PORT = process.env.PORT || 3000;
const OPEN_HOUR  = Number(process.env.OPEN_HOUR  || 7);   // 07:00
const CLOSE_HOUR = Number(process.env.CLOSE_HOUR || 23);  // 23:00
const WEEKLY_CAP = Number(process.env.WEEKLY_CAP || 2);

// __dirname en ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sirve el frontend estático (index.html en /public)
app.use("/", express.static(path.join(__dirname, "public")));

// Utilidades
const pad2 = n => String(n).padStart(2, "0");
const toHHMM = m => `${pad2(Math.floor(m/60))}:${pad2(m%60)}`;
const minutes = hhmm => {
  const [h, m] = hhmm.split(":").map(Number);
  return h*60 + m;
};

// Health check (para probar Railway)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Config pública
app.get("/api/config", (_req, res) => {
  res.json({ openHour: OPEN_HOUR, closeHour: CLOSE_HOUR, weeklyCap: WEEKLY_CAP });
});

// 👉 Aquí irían tus endpoints de availability y reservations
// (los mismos que tenías antes, solo que ahora organizados)

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});