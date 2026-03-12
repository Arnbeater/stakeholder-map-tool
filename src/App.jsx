import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "stakeholder-map-tool-data";

const createStakeholder = (data = {}) => ({
  id: crypto.randomUUID(),
  name: data.name || "Ny stakeholder",
  role: data.role || "",
  organization: data.organization || "",
  influence: data.influence ?? 5,
  interest: data.interest ?? 5,
  stance: data.stance || "neutral",
  category: data.category || "",
  notes: data.notes || ""
});

const createProject = (data = {}) => ({
  id: crypto.randomUUID(),
  name: data.name || "Nyt projekt",
  description: data.description || "",
  stakeholders: data.stakeholders || []
});

const defaultData = {
  projects: [
    createProject({
      name: "Nyt Busnet Næstved",
      description: "Kommunikation og interessenter",
      stakeholders: [
        createStakeholder({
          name: "Movia Infrastruktur",
          role: "Intern stakeholder",
          organization: "Movia",
          influence: 9,
          interest: 8,
          stance: "supportive",
          category: "Internal",
          notes: "Central i implementering"
        }),
        createStakeholder({
          name: "Næstved Kommune",
          role: "Kommune",
          organization: "Næstved Kommune",
          influence: 8,
          interest: 9,
          stance: "supportive",
          category: "Public",
          notes: "Vigtig ift. lokal koordinering"
        }),
        createStakeholder({
          name: "Lokale borgere",
          role: "Brugere",
          organization: "Offentlighed",
          influence: 4,
          interest: 7,
          stance: "neutral",
          category: "Citizen",
          notes: "Påvirkes direkte af ændringerne"
        })
      ]
    }),
    createProject({
      name: "Wayfinding Hillerød",
      description: "Kort over centrale interessenter",
      stakeholders: [
        createStakeholder({
          name: "Hillerød Kommune",
          role: "Kommune",
          organization: "Hillerød Kommune",
          influence: 8,
          interest: 8,
          stance: "supportive",
          category: "Public",
          notes: "Vigtig for godkendelser og lokal forankring"
        }),
        createStakeholder({
          name: "Leverandør",
          role: "Ekstern partner",
          organization: "Ekstern",
          influence: 7,
          interest: 6,
          stance: "neutral",
          category: "Vendor",
          notes: "Afhænger af scope og leveranceplan"
        })
      ]
    })
  ]
};

const stanceColors = {
  supportive: "#63c7b2",
  neutral: "#f4b56a",
  critical: "#f08aa3"
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return defaultData;

  try {
    const parsed = JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.projects) &&
      parsed.projects.length > 0
    ) {
      return parsed;
    }

    return defaultData;
  } catch {
    return defaultData;
  }
}

function getProjectStats(project) {
  const stakeholders = project.stakeholders || [];

  const supportive = stakeholders.filter((s) => s.stance === "supportive").length;
  const critical = stakeholders.filter((s) => s.stance === "critical").length;
  const avgInfluence = stakeholders.length
    ? (
        stakeholders.reduce((sum, s) => sum + (s.influence || 0), 0) /
        stakeholders.length
      ).toFixed(1)
    : "0.0";

  return {
    count: stakeholders.length,
    supportive,
    critical,
    avgInfluence
  };
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState(null);

  const [search, setSearch] = useState("");
  const [stanceFilter, setStanceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const projects = data.projects || [];
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  const currentStakeholders = selectedProject?.stakeholders ?? [];

  useEffect(() => {
    if (!selectedProject) {
      setSelectedStakeholderId(null);
      return;
    }

    if (
      currentStakeholders.length > 0 &&
      !currentStakeholders.some((item) => item.id === selectedStakeholderId)
    ) {
      setSelectedStakeholderId(currentStakeholders[0].id);
      return;
    }

    if (currentStakeholders.length === 0) {
      setSelectedStakeholderId(null);
    }
  }, [selectedProject, currentStakeholders, selectedStakeholderId]);

  const filteredStakeholders = useMemo(() => {
    return currentStakeholders.filter((item) => {
      const q = search.toLowerCase();
      const categoryQ = categoryFilter.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q);

      const matchesStance = !stanceFilter || item.stance === stanceFilter;
      const matchesCategory =
        !categoryFilter || item.category.toLowerCase().includes(categoryQ);

      return matchesSearch && matchesStance && matchesCategory;
    });
  }, [currentStakeholders, search, stanceFilter, categoryFilter]);

  const selectedStakeholder =
    currentStakeholders.find((item) => item.id === selectedStakeholderId) ?? null;

  function updateProject(projectId, updater) {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId ? updater(project) : project
      )
    }));
  }

  function openProject(projectId) {
    setSelectedProjectId(projectId);
    setSearch("");
    setStanceFilter("");
    setCategoryFilter("");
  }

  function goHome() {
    setSelectedProjectId(null);
    setSelectedStakeholderId(null);
    setSearch("");
    setStanceFilter("");
    setCategoryFilter("");
  }

  function createNewProject() {
    const name = newProjectName.trim();
    const description = newProjectDescription.trim();

    if (!name) {
      window.alert("Giv projektet et navn.");
      return;
    }

    const newProject = createProject({
      name,
      description,
      stakeholders: []
    });

    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects]
    }));

    setSelectedProjectId(newProject.id);
    setSelectedStakeholderId(null);
    setShowProjectModal(false);
    setNewProjectName("");
    setNewProjectDescription("");
  }

  function deleteProject() {
    if (!selectedProject) return;

    const ok = window.confirm(`Vil du slette projektet "${selectedProject.name}"?`);
    if (!ok) return;

    const nextProjects = projects.filter((project) => project.id !== selectedProject.id);
    setData({ projects: nextProjects });
    goHome();
  }

  function updateSelectedProjectField(field, value) {
    if (!selectedProject) return;

    updateProject(selectedProject.id, (project) => ({
      ...project,
      [field]: value
    }));
  }

  function addStakeholder() {
    if (!selectedProject) return;

    const newItem = createStakeholder();

    updateProject(selectedProject.id, (project) => ({
      ...project,
      stakeholders: [newItem, ...project.stakeholders]
    }));

    setSelectedStakeholderId(newItem.id);
  }

  function updateSelectedStakeholder(field, value) {
    if (!selectedProject || !selectedStakeholder) return;

    updateProject(selectedProject.id, (project) => ({
      ...project,
      stakeholders: project.stakeholders.map((item) =>
        item.id === selectedStakeholderId ? { ...item, [field]: value } : item
      )
    }));
  }

  function deleteSelectedStakeholder() {
    if (!selectedProject || !selectedStakeholder) return;

    const ok = window.confirm(
      `Vil du slette "${selectedStakeholder.name}" fra projektet "${selectedProject.name}"?`
    );
    if (!ok) return;

    const nextStakeholders = currentStakeholders.filter(
      (item) => item.id !== selectedStakeholderId
    );

    updateProject(selectedProject.id, (project) => ({
      ...project,
      stakeholders: nextStakeholders
    }));

    setSelectedStakeholderId(nextStakeholders[0]?.id ?? null);
  }

  if (!selectedProject) {
    return (
      <>
        <div className="project-home-shell">
          <div className="project-home-topbar">
            <div>
              <div className="eyebrow">Stakeholder Map Tool</div>
              <h1 className="project-home-title">Projects</h1>
              <p className="project-home-subtitle">
                Vælg et projekt eller opret et nyt. Hvert projekt har sit eget stakeholder map.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowProjectModal(true)}
            >
              + Nyt projekt
            </button>
          </div>

          <div className="project-grid">
            {projects.map((project) => {
              const stats = getProjectStats(project);

              return (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() => openProject(project.id)}
                >
                  <div className="project-card-top">
                    <div className="project-icon">◎</div>
                    <div className="project-card-menu">•••</div>
                  </div>

                  <div className="project-card-body">
                    <h2>{project.name}</h2>
                    <p>
                      {project.description || "Ingen beskrivelse endnu."}
                    </p>
                  </div>

                  <div className="project-stats">
                    <div className="stat-pill">
                      <span className="stat-value">{stats.count}</span>
                      <span className="stat-label">Stakeholders</span>
                    </div>
                    <div className="stat-pill">
                      <span className="stat-value">{stats.supportive}</span>
                      <span className="stat-label">Supportive</span>
                    </div>
                    <div className="stat-pill">
                      <span className="stat-value">{stats.avgInfluence}</span>
                      <span className="stat-label">Avg. influence</span>
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <span className="mini-tag">Critical: {stats.critical}</span>
                    <span className="open-link">Open project →</span>
                  </div>
                </button>
              );
            })}

            <button
              className="project-card project-card-add"
              onClick={() => setShowProjectModal(true)}
            >
              <div className="project-card-add-inner">
                <div className="project-card-plus">+</div>
                <div className="project-card-add-text">Create new project</div>
              </div>
            </button>
          </div>
        </div>

        {showProjectModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowProjectModal(false)}
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  <div className="eyebrow">New project</div>
                  <h2>Opret projekt</h2>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setShowProjectModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-form">
                <label>
                  <span>Projektnavn</span>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Fx. Wayfinding Hillerød"
                  />
                </label>

                <label>
                  <span>Beskrivelse</span>
                  <textarea
                    rows="4"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Kort beskrivelse af projektet"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  className="btn modal-secondary-btn"
                  onClick={() => setShowProjectModal(false)}
                >
                  Annullér
                </button>
                <button className="btn btn-primary" onClick={createNewProject}>
                  Opret projekt
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar card">
          <div className="row header-row">
            <h1>Stakeholder Map Tool</h1>
            <button className="btn btn-primary" onClick={goHome}>
              ← Projekter
            </button>
          </div>

          <div className="stack">
            <label>
              <span>Projekt</span>
              <select
                value={selectedProjectId ?? ""}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedStakeholderId(null);
                }}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Projektnavn</span>
              <input
                type="text"
                value={selectedProject.name}
                onChange={(e) =>
                  updateSelectedProjectField("name", e.target.value)
                }
              />
            </label>

            <label>
              <span>Beskrivelse</span>
              <textarea
                rows="3"
                value={selectedProject.description}
                onChange={(e) =>
                  updateSelectedProjectField("description", e.target.value)
                }
              />
            </label>

            <div className="row">
              <button className="btn btn-primary" onClick={addStakeholder}>
                + Stakeholder
              </button>
              <button className="btn btn-danger" onClick={deleteProject}>
                Slet projekt
              </button>
            </div>

            <input
              type="text"
              placeholder="Søg stakeholder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={stanceFilter}
              onChange={(e) => setStanceFilter(e.target.value)}
            >
              <option value="">Alle holdninger</option>
              <option value="supportive">Supportive</option>
              <option value="neutral">Neutral</option>
              <option value="critical">Critical</option>
            </select>

            <input
              type="text"
              placeholder="Filtrér kategori..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>

          <div className="stakeholder-list">
            {filteredStakeholders.length === 0 && (
              <div className="stakeholder-item empty-state">
                Ingen stakeholders matcher dit filter.
              </div>
            )}

            {filteredStakeholders.map((item) => (
              <button
                key={item.id}
                className={`stakeholder-item ${
                  item.id === selectedStakeholderId ? "active" : ""
                }`}
                onClick={() => setSelectedStakeholderId(item.id)}
              >
                <div className="stakeholder-item-top">
                  <span className="stakeholder-name">{item.name}</span>
                  <span
                    className="dot"
                    style={{ backgroundColor: stanceColors[item.stance] }}
                  />
                </div>
                <div className="stakeholder-meta">
                  {item.role || "Ingen rolle"} · {item.organization || "Ingen organisation"}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="main-grid">
          <section className="card">
            <div className="row section-head">
              <div>
                <h2>Stakeholder Map</h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "var(--muted)",
                    fontSize: "0.92rem"
                  }}
                >
                  {selectedProject.description || "Ingen projektbeskrivelse endnu."}
                </p>
              </div>

              <div className="legend">
                <span>
                  <i className="legend-dot supportive"></i>
                  Supportive
                </span>
                <span>
                  <i className="legend-dot neutral"></i>
                  Neutral
                </span>
                <span>
                  <i className="legend-dot critical"></i>
                  Critical
                </span>
              </div>
            </div>

            <div className="map-wrapper">
              <div className="map-label top-left">Monitorér</div>
              <div className="map-label top-right">Håndtér tæt</div>
              <div className="map-label bottom-left">Hold informeret</div>
              <div className="map-label bottom-right">Hold tilfreds</div>

              <div className="axis-label x-axis">Indflydelse →</div>
              <div className="axis-label y-axis">Interesse →</div>

              <div className="map">
                {filteredStakeholders.map((item) => {
                  const left = `${((item.influence - 1) / 9) * 100}%`;
                  const bottom = `${((item.interest - 1) / 9) * 100}%`;

                  return (
                    <button
                      key={item.id}
                      className={`map-node ${
                        item.id === selectedStakeholderId ? "active" : ""
                      }`}
                      style={{
                        left,
                        bottom,
                        backgroundColor: stanceColors[item.stance]
                      }}
                      title={item.name}
                      onClick={() => setSelectedStakeholderId(item.id)}
                    >
                      <span className="node-label">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <h2>Redigér stakeholder</h2>
            </div>

            {!selectedStakeholder ? (
              <div className="empty-editor">
                Vælg en stakeholder i listen eller på kortet.
              </div>
            ) : (
              <div className="editor-grid">
                <label>
                  <span>Navn</span>
                  <input
                    value={selectedStakeholder.name}
                    onChange={(e) =>
                      updateSelectedStakeholder("name", e.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Rolle</span>
                  <input
                    value={selectedStakeholder.role}
                    onChange={(e) =>
                      updateSelectedStakeholder("role", e.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Organisation</span>
                  <input
                    value={selectedStakeholder.organization}
                    onChange={(e) =>
                      updateSelectedStakeholder("organization", e.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Kategori</span>
                  <input
                    value={selectedStakeholder.category}
                    onChange={(e) =>
                      updateSelectedStakeholder("category", e.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Holdning</span>
                  <select
                    value={selectedStakeholder.stance}
                    onChange={(e) =>
                      updateSelectedStakeholder("stance", e.target.value)
                    }
                  >
                    <option value="supportive">Supportive</option>
                    <option value="neutral">Neutral</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>

                <label>
                  <span>Indflydelse: {selectedStakeholder.influence}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedStakeholder.influence}
                    onChange={(e) =>
                      updateSelectedStakeholder("influence", Number(e.target.value))
                    }
                  />
                </label>

                <label>
                  <span>Interesse: {selectedStakeholder.interest}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedStakeholder.interest}
                    onChange={(e) =>
                      updateSelectedStakeholder("interest", Number(e.target.value))
                    }
                  />
                </label>

                <label className="full-width">
                  <span>Noter</span>
                  <textarea
                    rows="5"
                    value={selectedStakeholder.notes}
                    onChange={(e) =>
                      updateSelectedStakeholder("notes", e.target.value)
                    }
                  />
                </label>

                <div className="actions full-width">
                  <button className="btn btn-danger" onClick={deleteSelectedStakeholder}>
                    Slet stakeholder
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {showProjectModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowProjectModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">New project</div>
                <h2>Opret projekt</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowProjectModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-form">
              <label>
                <span>Projektnavn</span>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Fx. Nyt Ringnet"
                />
              </label>

              <label>
                <span>Beskrivelse</span>
                <textarea
                  rows="4"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Kort beskrivelse af projektet"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="btn modal-secondary-btn"
                onClick={() => setShowProjectModal(false)}
              >
                Annullér
              </button>
              <button className="btn btn-primary" onClick={createNewProject}>
                Opret projekt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
