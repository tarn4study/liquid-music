import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";

// Set up server constants
const PORT = 3000;
const CONFIG_FILE = path.join(process.cwd(), "server_config.json");
const DEFAULT_BG_FOLDER = path.join(process.cwd(), "backgrounds");

// Ensure default background folder exists
if (!fs.existsSync(DEFAULT_BG_FOLDER)) {
  fs.mkdirSync(DEFAULT_BG_FOLDER, { recursive: true });
  // Put a simple placeholder text so the directory is populated
  fs.writeFileSync(
    path.join(DEFAULT_BG_FOLDER, "readme.txt"),
    "Place JPG, PNG, WEBP, or SVG images in this folder to be loaded as custom cover art / backgrounds."
  );
}

// Interface for persistent server config
interface ServerConfig {
  serverUrl: string;
  username: string;
  password?: string;
  backgroundFolder: string;
}

// Load configurations from file or construct default
function loadConfig(): ServerConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading config file, falling back to defaults.", e);
    }
  }
  return {
    serverUrl: "",
    username: "",
    password: "",
    backgroundFolder: DEFAULT_BG_FOLDER,
  };
}

// Save configuration to file
function saveConfig(config: ServerConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving config file.", e);
  }
}

// Helper to generate md5 subsonic authentication credentials
function getSubsonicParams(config: ServerConfig) {
  if (!config.serverUrl || !config.username || !config.password) {
    return null;
  }
  const salt = crypto.randomBytes(8).toString("hex");
  const token = crypto.createHash("md5").update(config.password + salt).digest("hex");
  
  return {
    u: config.username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "WaterMusicPlayer",
    f: "json", // Instruct subsonic API to return standard JSON
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Config endpoints
  app.get("/api/config", (req, res) => {
    const config = loadConfig();
    // Return config to UI, hiding password for protection
    res.json({
      serverUrl: config.serverUrl,
      username: config.username,
      backgroundFolder: config.backgroundFolder,
      isConfigured: !!(config.serverUrl && config.username && config.password),
    });
  });

  app.post("/api/config", (req, res) => {
    const { serverUrl, username, password, backgroundFolder } = req.body;
    const currentConfig = loadConfig();

    const newConfig: ServerConfig = {
      serverUrl: serverUrl || currentConfig.serverUrl,
      username: username || currentConfig.username,
      // If password isn't sent, preserve current password
      password: password !== undefined ? password : currentConfig.password,
      backgroundFolder: backgroundFolder || currentConfig.backgroundFolder || DEFAULT_BG_FOLDER,
    };

    saveConfig(newConfig);
    console.log(`Saved new configuration: ${newConfig.serverUrl} for ${newConfig.username}`);
    
    // Ensure the custom folder exists
    if (newConfig.backgroundFolder && !fs.existsSync(newConfig.backgroundFolder)) {
      try {
        fs.mkdirSync(newConfig.backgroundFolder, { recursive: true });
      } catch (err) {
        console.error("Failed to create background directory:", err);
      }
    }

    res.json({
      success: true,
      config: {
        serverUrl: newConfig.serverUrl,
        username: newConfig.username,
        backgroundFolder: newConfig.backgroundFolder,
        isConfigured: !!(newConfig.serverUrl && newConfig.username && newConfig.password),
      },
    });
  });

  // Background folder scan endpoint
  app.get("/api/backgrounds", (req, res) => {
    const config = loadConfig();
    const targetFolder = config.backgroundFolder || DEFAULT_BG_FOLDER;

    if (!fs.existsSync(targetFolder)) {
      return res.json({ success: false, error: "Directory does not exist", files: [] });
    }

    try {
      const files = fs.readdirSync(targetFolder);
      const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];
      
      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map((file) => ({
          name: file,
          path: path.join(targetFolder, file),
          url: `/api/backgrounds/image?name=${encodeURIComponent(file)}`,
        }));

      res.json({
        success: true,
        bgFolder: targetFolder,
        files: images,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, files: [] });
    }
  });

  // Background image stream endpoint
  app.get("/api/backgrounds/image", (req, res) => {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).send("Parameter 'name' is required");
    }

    const config = loadConfig();
    const targetFolder = config.backgroundFolder || DEFAULT_BG_FOLDER;
    const filePath = path.join(targetFolder, path.basename(name)); // basename protects against directory traversal paths

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Image not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".svg") contentType = "image/svg+xml";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h
    fs.createReadStream(filePath).pipe(res);
  });

  // Helper function to build subsonic requests
  function makeSubsonicUrl(config: ServerConfig, endpoint: string, queryParams: Record<string, string> = {}) {
    if (!config.serverUrl) return null;
    
    // Normalize serverUrl
    let baseUrl = config.serverUrl;
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "http://" + baseUrl;
    }
    // Remove trailing slash
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const authParams = getSubsonicParams(config);
    if (!authParams) return null;

    const query = new URLSearchParams();
    // Add auth credentials
    Object.entries(authParams).forEach(([k, v]) => query.append(k, v));
    // Add endpoint custom parameters
    Object.entries(queryParams).forEach(([k, v]) => query.append(k, v));

    return `${baseUrl}/rest/${endpoint}.view?${query.toString()}`;
  }

  // Ping / status check
  app.get("/api/navidrome/status", async (req, res) => {
    const config = loadConfig();
    const url = makeSubsonicUrl(config, "ping");
    
    if (!url) {
      return res.json({ connected: false, error: "Missing Navidrome server URL, username, or password config" });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      
      const data: any = await response.json();
      const status = data["subsonic-response"]?.status === "ok";
      res.json({
        connected: status,
        version: data["subsonic-response"]?.version || "unknown",
        error: status ? null : "Subsonic returned an error status",
      });
    } catch (err: any) {
      res.json({ connected: false, error: err.message });
    }
  });

  // Generic Subsonic Endpoint proxy
  app.get("/api/navidrome/proxy", async (req, res) => {
    const { endpoint, ...queryParams } = req.query;
    
    if (!endpoint || typeof endpoint !== "string") {
      return res.status(400).json({ error: "Query parameter 'endpoint' is required" });
    }

    const config = loadConfig();
    // Re-pack query params as string record
    const params: Record<string, string> = {};
    Object.entries(queryParams).forEach(([k, v]) => {
      if (typeof v === "string") params[k] = v;
    });

    const url = makeSubsonicUrl(config, endpoint, params);
    if (!url) {
      return res.status(400).json({ error: "Navidrome is not configured properly." });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Navidrome server responded with ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: `Connection failed: ${err.message}` });
    }
  });

  // Subsonic Audio streaming proxy
  app.get("/api/navidrome/stream", async (req, res) => {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).send("Song 'id' is required");
    }

    const config = loadConfig();
    const url = makeSubsonicUrl(config, "stream", { id });
    if (!url) {
      return res.status(400).send("Navidrome is not configured");
    }

    try {
      // Forward Range request header to enable seeking in the audio player
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await fetch(url, { headers });
      
      // Copy status and selective stream headers from subsonic response
      res.status(response.status);
      const copyHeaders = [
        "content-type",
        "content-length",
        "accept-ranges",
        "content-range",
        "cache-control",
      ];
      copyHeaders.forEach((h) => {
        const val = response.headers.get(h);
        if (val) res.setHeader(h, val);
      });

      // Stream the binary chunk safely to the player client
      if (response.body) {
        // Node 18 fetch body is a ReadableStream. Convert using Readable.fromWeb
        Readable.fromWeb(response.body as any).pipe(res);
      } else {
        res.status(404).send("Stream body empty");
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      if (!res.headersSent) {
        res.status(500).send(`Streaming failed: ${err.message}`);
      }
    }
  });

  // Subsonic album artwork proxy
  app.get("/api/navidrome/coverArt", async (req, res) => {
    const { id, size } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).send("Artwork 'id' is required");
    }

    const config = loadConfig();
    const params: Record<string, string> = { id };
    if (size && typeof size === "string") params["size"] = size;

    const url = makeSubsonicUrl(config, "getCoverArt", params);
    if (!url) {
      return res.status(400).send("Navidrome configuration error");
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch cover. Code: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800"); // Cache artwork for 7 days

      if (response.body) {
        Readable.fromWeb(response.body as any).pipe(res);
      } else {
        res.status(404).send("No cover found");
      }
    } catch (err: any) {
      console.error("Artwork loading error:", err);
      res.status(500).send(err.message);
    }
  });

  // Integrate Vite dynamically in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static outputs
    console.log("Starting in PRODUCTION mode. Serving pre-compiled bundle.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Glass & Water Server is successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server crushed during start-up:", err);
});
