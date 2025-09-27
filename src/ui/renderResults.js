export function renderResults(container, stats) {
  container.innerHTML = "";

  if (!stats) {
    const note = document.createElement("p");
    note.className = "note warning";
    note.textContent = "No stats returned yet. Try again once the SnapDragon endpoint is ready.";
    container.appendChild(note);
    return;
  }

  if (stats.summary) {
    container.appendChild(createSummaryCard(stats.summary));
  }

  container.appendChild(createStatGrid(stats));
  container.appendChild(createSignalsSection(stats));
  container.appendChild(createSkillSection(stats));

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "These signals come straight from the Snapdragon-powered LLM response. Wire them into the arena stats next.";
  container.appendChild(note);
}

function createSummaryCard(summary) {
  const summaryCard = document.createElement("div");
  summaryCard.className = "summary-card";

  const heading = document.createElement("h2");
  heading.textContent = "Professional Summary";

  const body = document.createElement("div");
  body.className = "summary-text";
  
  // Clean and format the text
  const cleanText = summary
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
  
  if (cleanText.length > 800) {
    // For long text, show preview with expand option
    const preview = cleanText.substring(0, 800) + "...";
    const previewP = document.createElement("p");
    previewP.textContent = preview;
    
    const expandBtn = document.createElement("button");
    expandBtn.textContent = "Show Full Text";
    expandBtn.className = "expand-btn";
    expandBtn.style.cssText = "margin-top: 10px; padding: 5px 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;";
    
    let isExpanded = false;
    expandBtn.addEventListener("click", () => {
      if (!isExpanded) {
        previewP.textContent = cleanText;
        expandBtn.textContent = "Show Less";
        isExpanded = true;
      } else {
        previewP.textContent = preview;
        expandBtn.textContent = "Show Full Text";
        isExpanded = false;
      }
    });
    
    body.appendChild(previewP);
    body.appendChild(expandBtn);
  } else {
    // For shorter text, show it all
    const p = document.createElement("p");
    p.textContent = cleanText;
    body.appendChild(p);
  }

  summaryCard.appendChild(heading);
  summaryCard.appendChild(body);
  return summaryCard;
}

function createStatGrid(stats) {
  const statGrid = document.createElement("div");
  statGrid.className = "stat-grid";

  statGrid.appendChild(createStatCard("Experience", stats.experience, "arena reps"));
  statGrid.appendChild(createStatCard("Networking", stats.networking, "clubs and events"));
  statGrid.appendChild(createStatCard("Skills", Array.isArray(stats.skills) ? stats.skills.length : 0, "highlighted skills"));

  const fillerPercent = typeof stats.fillerRatio === "number" ? Math.min(1, Math.max(0, stats.fillerRatio)) * 100 : null;
  const energyCaption = fillerPercent !== null ? `${(100 - fillerPercent).toFixed(0)}% stamina` : "LLM calibrated";
  statGrid.appendChild(createStatCard("Energy", stats.energyScore, energyCaption));
  statGrid.appendChild(createStatCard("Luck", stats.luck, "seeded from resume"));

  return statGrid;
}

function createSignalsSection(stats) {
  const section = document.createElement("div");
  section.className = "resume-flags";

  const heading = document.createElement("h2");
  heading.textContent = "Resume Signals";
  section.appendChild(heading);

  const list = document.createElement("ul");
  list.appendChild(createSignalItem("GPA", stats.gpa ? String(stats.gpa) : "Not detected"));
  list.appendChild(createSignalItem("Internships", stats.internships ? String(stats.internships) : "None mentioned"));
  list.appendChild(createSignalItem("Networking", stats.networking ? "On the radar" : "Add clubs or events"));
  const buzzwordValue = Array.isArray(stats.buzzwords) && stats.buzzwords.length ? stats.buzzwords.join(", ") : "None yet";
  list.appendChild(createSignalItem("Buzzwords", buzzwordValue));

  section.appendChild(list);
  return section;
}

function createSkillSection(stats) {
  const section = document.createElement("div");
  section.className = "skill-breakdown";

  const heading = document.createElement("h2");
  heading.textContent = "Skill Highlights";
  section.appendChild(heading);

  const list = document.createElement("ul");

  if (Array.isArray(stats.skills) && stats.skills.length) {
    stats.skills.slice(0, 8).forEach(skill => {
      const item = document.createElement("li");
      const nameSpan = document.createElement("span");
      nameSpan.textContent = skill.label || skill.name || "Skill";
      const valueSpan = document.createElement("span");
      const value = typeof skill.score === "number" ? skill.score : skill.count;
      valueSpan.textContent = value !== undefined ? String(value) : "*";
      item.appendChild(nameSpan);
      item.appendChild(valueSpan);
      list.appendChild(item);
    });
  } else {
    const item = document.createElement("li");
    item.textContent = "No skill highlights yet. Ask the LLM to surface key technologies.";
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

function createStatCard(title, value, caption) {
  const stat = document.createElement("div");
  stat.className = "stat";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const mainValue = document.createElement("p");
  mainValue.textContent = typeof value === "number" && Number.isFinite(value) ? String(value) : "--";

  const sub = document.createElement("span");
  sub.textContent = caption;

  stat.appendChild(heading);
  stat.appendChild(mainValue);
  stat.appendChild(sub);
  return stat;
}

function createSignalItem(label, value) {
  const item = document.createElement("li");
  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;
  const valueSpan = document.createElement("span");
  valueSpan.textContent = value;
  item.appendChild(labelSpan);
  item.appendChild(valueSpan);
  return item;
}
