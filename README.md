# LinkedOut

**LinkedOut** is a satirical Qualcomm Snapdragon Multiverse hackathon project: a simulation of a modern-day job hunting arena. Just upload your resume, and watch your character struggle, network, or succeed in the job market, and then receive tips on how to improve your own resume by seeing who succeeds.

---

## Features

---

## Architecture

* **Frontend**: HTML5 Canvas for visualization
* **Logic**: Agent stats and behaviors are driven by resume analysis
* **LLM Integration**: Snapdragon-powered APIs assign traits from resume text and simulate conversations between different agents (types: Recruiters, Students)

---

## LLM Integration

### Resume Parsing
Resumes are parsed, normalized, and mapped to stats like:

* **Experience** (work history, projects)
* **Skills** (keywords such as Python, Excel, ML)
* **Networking** (clubs, leadership, hackathons)
* **Energy** (resume fluff vs. focus)
* **Luck** (random element, because job hunting needs it)

See [`src/services/snapdragonClient.js`](src/services/snapdragonClient.js) for the resume API client.

### Agent Conversations
Different agents converse with each other. The students' goal is to receive as many job offers as possible. There can be student-recruiter, student-student, and recruiter-recruiter interactions.

See [`src/services/conversationService.js`](src/services/conversationService.js) for agent conversation API client.

---

## File Structure

* `src/services/` → Snapdragon client and API helpers
* `src/ui/` → Canvas drawing code (retro + South-Park sprites)
* `src/utils/` → Resume parsing helpers
* `src/` root → State classes (`GameState`, `ConversationState`)

---

## Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/joerup/hackathon-simulation.git
   cd hackathon-simulation
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Add your Snapdragon credentials in `.env`:

   ```env
   SNAPDRAGON_API_KEY=your_key_here
   SNAPDRAGON_API_URL=https://aisuite.cirrascale.com/apis/v2/chat/completions
   SNAPDRAGON_MODEL=Llama-3.1-8B
   ```
4. Run locally:

   ```bash
   npm start
   ```

---

## How It Works

1. User uploads a resume (text or file).
2. Resume is analyzed and stats are assigned.
3. An avatar is generated.
4. The avatar is placed in the arena to auto-compete for offers.
5. The simulation shows winners, losers, and ghosted candidates in a leaderboard.

---

## License

This project is licensed under the **GNU General Public License (GPL) 3.0**.
See the [LICENSE](LICENSE) file for details.

---