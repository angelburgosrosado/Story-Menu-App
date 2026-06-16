# Story.Menu: Multi-Engine Image Generation System

This document explains the integration of alternative high-performance image generation engines into **Story.Menu**. Creators can now dynamically choose their rendering engine directly from the Workspace Setup GUI to power graphic novels.

---

## 🚀 Supported Engines & Features

| Engine | Primary Benefit | Config Key | Key Characteristics |
| :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash Image** | Built-in / Multimodal | None (Standard) | High-speed, multimodal layout understanding. |
| **LlamaGen.ai Comic API** | Comic Panel Cohesion | `LLAMAGEN_API_KEY` | Native panel rules, multi-frame consistency. |
| **Stable Diffusion (ComfyUI)** | Complete Control | `COMFYUI_API_URL` | Exposes local workflows, ControlNet, & IP-Adapter. |
| **Leonardo.ai API** | Premium Styling | `LEONARDO_API_KEY` | High-fidelity Vision XL models & Character Reference. |

---

## 🛠️ Configuration & Credentials

To enable these engines in production, set the corresponding environment variables in your deployment shell or `.env` file:

```bash
# LlamaGen.ai Comic API Credentials
LLAMAGEN_API_KEY="your_llamagen_api_token_here"

# Leonardo.ai Platform Credentials
LEONARDO_API_KEY="your_leonardo_api_token_here"

# ComfyUI Workflow API URL (Defaults to http://127.0.0.1:8188)
COMFYUI_API_URL="http://your-gpu-server-ip:8188"
```

---

## 🎨 How to Use (Creator Flow)

1. Launch the **Creator Studio** or click **Access Creative Console** on the homepage.
2. Navigate to the **Workspace Settings** section in the setup panel.
3. Locate the **Image Generator Engine** settings block.
4. Select your preferred engine:
   * **Gemini**: Standard cloud generation.
   * **LlamaGen**: Generates sequence panels with unified comic layouts.
   * **ComfyUI**: Queues tasks directly into your hosted ComfyUI stable diffusion workflows.
   * **Leonardo**: Uses character references to lock down hero likenesses.
5. Press **Launch Story** to begin generation.

---

## ⚙️ Backend Architecture & Fallback Strategy

The application routes image requests through the `/api/gemini/image` API endpoint in [server.ts](file:///Users/ABGlobalCEO/.gemini/antigravity/scratch/Story-Menu-App/server.ts). 

To ensure continuous development offline without configuration blocking, the API has built-in fallback mechanisms:
* **Missing Keys**: If `LLAMAGEN_API_KEY` or `LEONARDO_API_KEY` is not present, the server outputs a warning to the console and responds with premium styled placeholders.
* **Offline Servers**: If your ComfyUI server is offline, the API logs the socket rejection and falls back gracefully to a warning state to avoid client crashes.
