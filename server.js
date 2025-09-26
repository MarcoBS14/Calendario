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