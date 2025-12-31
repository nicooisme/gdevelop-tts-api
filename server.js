// ===== server.js =====
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Pastas públicas para os áudios
const PUBLIC_DIR = path.join(__dirname, "public");
const TTS_DIR = path.join(PUBLIC_DIR, "tts");
fs.mkdirSync(TTS_DIR, { recursive: true });

// Servir arquivos estáticos
app.use("/public", express.static(PUBLIC_DIR));

// Health check
app.get("/health", (req, res) => {
  res.send("ok");
});

// Endpoint TTS (tempo real – agora gera WAV silencioso para teste)
app.post("/tts", async (req, res) => {
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "Texto vazio" });

  const id = crypto.randomBytes(8).toString("hex");
  const fileName = `${id}.wav`;
  const filePath = path.join(TTS_DIR, fileName);

  // WAV silencioso de 1 segundo (serve para testar o fluxo no GDevelop)
  const wav = makeSilentWav1s();
  fs.writeFileSync(filePath, wav);

  res.json({
    audioUrl: `/public/tts/${fileName}`
  });
});

// Função para criar WAV simples
function makeSilentWav1s() {
  const sampleRate = 22050;
  const channels = 1;
  const bits = 16;
  const duration = 1;
  const samples = sampleRate * duration;
  const blockAlign = channels * (bits / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bits, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("TTS API rodando na porta", PORT);
});
