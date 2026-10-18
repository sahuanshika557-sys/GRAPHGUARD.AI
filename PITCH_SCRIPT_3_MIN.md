# 🎙️ GraphGuard AI — 3-Minute Video Pitch Script
**Track 01: Agents That Act on Connected Data | GRAPH Hacks 2026**

---

## ⏱️ Timing & Delivery Blueprint

- **Total Spoken Length**: ~420 words (~3 minutes at a steady, natural pace of 140 words/min)
- **Target Audience**: Judges, developers, and financial compliance officers
- **Core Message**: *Traditional systems look at transactions row by row. GraphGuard AI uses FalkorDB to follow the hidden connections in real time.*

---

## 🎬 Word-for-Word Pitch Script

### [0:00 – 0:35] The Problem: Why Fraud Detection is Broken
**🖥️ What to show on screen**: Open the login screen of [https://graphguard-ai-brown.vercel.app/](https://graphguard-ai-brown.vercel.app/). Click **ADMIN** 1-click login and land on the Transaction Catalog.

**🗣️ What to say**:
> "Hello everyone! Today, banks lose billions of dollars to financial fraud. 
> 
> But here is the real issue: traditional anti-fraud systems look at every transaction like an isolated row in a spreadsheet. If an $85,000 wire transfer has a valid balance and correct bank code, an ordinary database says: *'Looks clean, approve it!'*
> 
> But organized financial crime syndicates don't work in isolation. They use **stolen phones**, **shared devices**, **mule accounts**, and **multi-hop money transfers** to slip right under the radar. 
> 
> To catch modern criminals, you can't just look at one transaction. **You have to follow the connections.**"

---

### [0:35 – 1:20] The Hero: Why FalkorDB is the Beating Heart
**🖥️ What to show on screen**: Click on transaction **TX-104** ($85,000). Show the FalkorDB Cloud **LIVE** status badge at the top and the interactive Graph Canvas.

**🗣️ What to say**:
> "That’s why we built **GraphGuard AI** — powered by **FalkorDB**.
> 
> In our project, FalkorDB is not just a pretty visual chart or decoration. **It is the primary engine doing the heavy lifting.**
> 
> Why FalkorDB? Because finding fraud requires checking relationships 3, 4, or 5 hops deep across customers, accounts, device hardware IDs, IP addresses, and past fraud records. 
> 
> If you tried doing this in a traditional SQL database, your server would crash from slow, heavy joins. 
> 
> But with **FalkorDB’s native graph engine**, our autonomous agent runs lightning-fast Cypher queries and traverses millions of connected data points in **less than five milliseconds**!"

---

### [1:20 – 2:10] The Live Proof: Investigating Case TX-104
**🖥️ What to show on screen**: Click the **"Investigate"** button on `TX-104`. Watch the agent steps stream in real time and highlight the red fraud path on the graph canvas.

**🗣️ What to say**:
> "Let’s watch it in action with a real case: **TX-104**.
> 
> On paper, this is an $85,000 outbound wire transfer. But when we hit *Investigate*, our agent immediately queries FalkorDB:
> 
> 1. FalkorDB discovers that this transfer came from a jailbroken MacBook, Device D55.
> 2. Then, FalkorDB traces that this exact same laptop was previously used by a frozen mule account, A887.
> 3. And crucially, FalkorDB links that mule account directly to **Incident F22** — a confirmed $140,000 wire fraud cash-out!
> 
> In less than a second, FalkorDB uncovers the hidden syndicate path: **Transaction → Device → Mule Account → Confirmed Fraud Incident.** 
> 
> Our risk engine calculates an exact, mathematically explainable risk score: **98 out of 100 — High Risk!**"

---

### [2:10 – 2:45] Trust & Safety: Grounded AI + Human-in-the-Loop
**🖥️ What to show on screen**: Scroll to the **5-Stage Human Gate** stepper. Click **"Approve Hold"**. Then show the **Tamper-Evident Audit Trail** and download the **SAR PDF Dossier**.

**🗣️ What to say**:
> "Now, here is how we ensure enterprise safety: 
> 
> First, our AI agent never hallucinates. It only reasons on **verified graph facts** handed to it directly by FalkorDB.
> 
> Second, our agent recommends action, but it **never** makes destructive financial decisions alone. We enforce a **5-Stage Human-in-the-Loop Gate**. A human officer must inspect the graph and click *Approve* to hold the funds.
> 
> Every step, login, and decision is cryptographically sealed into a **SHA-256 tamper-evident audit ledger**. 
> 
> And with one click, compliance officers can download a full, regulatory-ready **Suspicious Activity Report (SAR) PDF dossier** ready for law enforcement."

---

### [2:45 – 3:00] Conclusion & The FalkorDB Advantage
**🖥️ What to show on screen**: Zoom out to show the live Vercel and Render links, highlighting the **FalkorDB Cloud (LIVE)** indicator.

**🗣️ What to say**:
> "To put it simply: **if you remove FalkorDB, GraphGuard AI completely stops working.** 
> 
> Ordinary databases can only store numbers in flat boxes, but **FalkorDB is the central nervous system, the brain, and the eyes** that give our AI agent the power to see the entire criminal web in milliseconds. 
> 
> FalkorDB turns raw, disconnected transactions into actionable, connected cyber intelligence.
> 
> GraphGuard AI is live on Vercel, Render, and FalkorDB Cloud.
> 
> Remember: **Don't just detect the anomaly. Follow the connections with FalkorDB!**
> 
> Thank you!"

---

## 💡 Quick Q&A Cheat Sheet (If Judges Ask Questions)

- **Q: Why couldn't you build this with PostgreSQL or MongoDB?**
  - **A**: *"In relational databases, querying 4 hops deep across devices, accounts, and historical fraud requires multiple recursive JOINs that slow down to seconds. FalkorDB stores relationships as direct graph pointers, executing the entire traversal in 2 to 4 milliseconds."*

- **Q: Is FalkorDB just for drawing the graph UI?**
  - **A**: *"No, absolutely not. The risk score, the AI agent's evidence grounding, the syndicate path finding, and the SAR report all break immediately if you take FalkorDB out. FalkorDB generates the factual graph truth."*

- **Q: What data did you use?**
  - **A**: *"100% synthetic, privacy-compliant AML benchmark data simulating realistic multi-hop fraud typologies with zero personal or restricted data."*
