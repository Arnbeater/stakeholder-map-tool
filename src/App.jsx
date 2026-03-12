import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "stakeholder-map-tool-data";

const defaultStakeholders = [
  {
    id: crypto.randomUUID(),
    name: "Hillerød Kommune",
    role: "Kommune",
    organization: "Hillerød Kommune",
    influence: 8,
    interest: 9,
    stance: "supportive",
    category: "Public",
    notes: "Vigtig i godkendelser og lokal koordinering."
  },
  {
    id: crypto.randomUUID(),
    name: "Movia Infrastruktur",
    role: "Intern stakeholder",
    organization: "Movia",
    influence: 9,
    interest: 8,
    stance: "supportive",
    category: "Internal",
    notes: "Høj indflydelse på drift og implementering."
  },
  {
    id: crypto.randomUUID(),
    name: "Leverandør",
    role: "Ekstern partner",
    organization: "Ekstern",
    influence: 7,
    interest: 6,
    stance: "neutral",
    category: "Vendor",
    notes: "Afhænger af scope, ressourcer og kontrakt."
  },
  {
    id: crypto.randomUUID(),
    name: "Lokale borgere",
    role: "Brugere",
    organization: "Offentlighed",
    influence: 4,
    interest: 7,
    stance: "neutral",
    category: "Citizen",
    notes: "Påvirkes direkte, men har lav formel beslutningskraft."
  },
  {
    id: crypto.randomUUID(),
    name: "Projektleder",
    role: "Projektansvarlig",
    organization: "Movia",
    influence: 8,
    interest: 10,
    stance: "supportive",
    category: "Internal",
    notes: "Driver fremdrift og koordinering."
  }
];

const stanceColors = {
  supportive: "#16a34a",
  neutral: "#d97706",
  critical: "#dc2626"
};

function loadStakeholders() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultStakeholders;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultStakeholders;
  } catch {
    return defaultStakeholders;
  }
}

export default function App() {
  const [stakeholders, setStakeholders] = useState(loadStakeholders);
  const [selectedId, setSelectedId] = useState(loadStakeholders()[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [stanceFilter, setStanceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stakeholders));
  }, [stakeholders]);

  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter((item) => {
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
  }, [stakeholders, search, stanceFilter, categoryFilter]);

  const selectedStakeholder =
    stakeholders.find((item) => item.id === selectedId) ?? null;

  function updateSelected(field, value) {
    setStakeholders((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, [field]: value } : item
      )
    );
  }

  function addStakeholder() {
    const newItem = {
      id: crypto.randomUUID(),
      name: "Ny stakeholder",
      role: "",
      organization: "",
      influence: 5,
      interest: 5,
      stance: "neutral",
      category: "",
      notes: ""
    };

    setStakeholders((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
  }

  function deleteSelected() {
    if (!selectedStakeholder) return;

    const ok = window.confirm(`Vil du slette "${selectedStakeholder.name}"?`);
    if (!ok) return;

    const next = stakeholders.filter((item) => item.id !== selectedId);
    setStakeholders(next);
    setSelectedId(next[0]?.id ?? null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div className="row header-row">
          <h1>Stakeholder Map Tool</h1>
          <button className="btn btn-primary" onClick={addStakeholder}>
            + Ny
          </button>
        </div>

        <div className="stack">
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
              className={`stakeholder-item ${item.id === selectedId ? "active" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="stakeholder-item-top">
                <span className="stakeholder-name">{item.name}</span>
                <span
                  className="dot"
                  style={{ backgroundColor: stanceColors[item.stance] }}
                />
              </div>
              <div className="stakeholder-meta">
                {item.role} · {item.organization}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="main-grid">
        <section className="card">
          <div className="row section-head">
            <h2>Stakeholder Map</h2>
            <div className="legend">
              <span><i className="legend-dot supportive"></i>Supportive</span>
              <span><i className="legend-dot neutral"></i>Neutral</span>
              <span><i className="legend-dot critical"></i>Critical</span>
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
                    className={`map-node ${item.id === selectedId ? "active" : ""}`}
                    style={{
                      left,
                      bottom,
                      backgroundColor: stanceColors[item.stance]
                    }}
                    title={item.name}
                    onClick={() => setSelectedId(item.id)}
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
                  onChange={(e) => updateSelected("name", e.target.value)}
                />
              </label>

              <label>
                <span>Rolle</span>
                <input
                  value={selectedStakeholder.role}
                  onChange={(e) => updateSelected("role", e.target.value)}
                />
              </label>

              <label>
                <span>Organisation</span>
                <input
                  value={selectedStakeholder.organization}
                  onChange={(e) => updateSelected("organization", e.target.value)}
                />
              </label>

              <label>
                <span>Kategori</span>
                <input
                  value={selectedStakeholder.category}
                  onChange={(e) => updateSelected("category", e.target.value)}
                />
              </label>

              <label>
                <span>Holdning</span>
                <select
                  value={selectedStakeholder.stance}
                  onChange={(e) => updateSelected("stance", e.target.value)}
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
                    updateSelected("influence", Number(e.target.value))
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
                    updateSelected("interest", Number(e.target.value))
                  }
                />
              </label>

              <label className="full-width">
                <span>Noter</span>
                <textarea
                  rows="5"
                  value={selectedStakeholder.notes}
                  onChange={(e) => updateSelected("notes", e.target.value)}
                />
              </label>

              <div className="actions full-width">
                <button className="btn btn-danger" onClick={deleteSelected}>
                  Slet
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
