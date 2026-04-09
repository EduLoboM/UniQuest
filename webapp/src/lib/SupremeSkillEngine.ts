/**
 * SupremeSkillEngine — TypeScript port of LexerParser.py
 *
 * Lexes and parses job-posting text to extract skills with intensity scores.
 * Maintains a persistent skill registry via localStorage.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SkillRegistry {
    [category: string]: string[];
}

export interface VagaMapeada {
    [skillKey: string]: number;
}

export interface ParseResult {
    vagaMapeada: VagaMapeada;
    newSkills: string[];
}

// ── Engine ─────────────────────────────────────────────────────────────────────

export class SupremeSkillEngine {
    private registryKey: string;

    /** Intensifiers ordered by priority (strongest → weakest) */
    private readonly intensifiers: [string, number][] = [
        ["obrigatório", 100],
        ["imprescindível", 100],
        ["expert", 100],
        ["especialista", 100],
        ["avançado", 90],
        ["domínio", 90],
        ["experiência sólida", 85],
        ["sólida", 85],
        ["experiência", 65],
        ["conhecimento", 40],
        ["familiaridade", 50],
        ["noções", 30],
        ["básico", 30],
        ["desejável", 50],
        ["preferencial", 50],
    ];

    /** Acronyms that should stay UPPERCASED */
    private readonly commonAcronyms = new Set([
        "SQL", "AWS", "AZURE", "GCP", "AI", "ML", "NLP", "ERP", "CRM",
        "API", "UI", "UX", "HTML", "CSS", "JS", "TS", "REACT", "NODE",
        "DOCKER", "K8S", "CI", "CD", "ETL", "BI", "POWERBI", "LLM", "LLMS",
    ]);

    /** Pre-compiled removal pattern (intensifiers + prepositions) */
    private readonly removePattern: RegExp;

    readonly defaultCategories = ["Psicologia", "Artes", "TI", "Outros"];

    skillRegistry: SkillRegistry;

    constructor(registryKey = "skill_registry") {
        this.registryKey = registryKey;

        // Build the removal regex — longest terms first so greedy match works
        const allIntensifiers = this.intensifiers
            .map(([word]) => word)
            .sort((a, b) => b.length - a.length);

        const removeTerms = [
            ...allIntensifiers,
            "em", "com", "de", "na", "no", "para", "a", "o", "as", "os", "e",
        ];

        const escaped = removeTerms.map((t) =>
            t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        );
        this.removePattern = new RegExp(
            `\\b(${escaped.join("|")})\\b`,
            "gi"
        );

        this.skillRegistry = this.loadRegistry();
    }

    // ── Registry persistence (localStorage) ──────────────────────────────────

    private loadRegistry(): SkillRegistry {
        try {
            const raw = localStorage.getItem(this.registryKey);
            if (raw) {
                const data: SkillRegistry = JSON.parse(raw);
                // Ensure all default categories exist
                for (const cat of this.defaultCategories) {
                    if (!data[cat]) data[cat] = [];
                }
                return data;
            }
        } catch (err) {
            console.error("Erro ao carregar registro:", err);
        }
        return Object.fromEntries(this.defaultCategories.map((c) => [c, []]));
    }

    private saveRegistry(): void {
        localStorage.setItem(
            this.registryKey,
            JSON.stringify(this.skillRegistry, null, 2)
        );
    }

    // ── Normalisation ────────────────────────────────────────────────────────

    private normalizeSkillName(skill: string): string {
        const clean = skill.replace(/\s+/g, " ").trim();
        if (!clean) return "";

        const upper = clean.toUpperCase();
        if (this.commonAcronyms.has(upper)) return upper;

        // Short ≤3 chars → uppercase; otherwise Title Case
        if (clean.length <= 3) return upper;
        return clean
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
    }

    // ── Intensity detection + cleanup ────────────────────────────────────────

    private extractIntensityAndClean(line: string): [number, string] {
        const lowerLine = line.toLowerCase().trim();

        // 1. Detect intensity (first match wins — priority order)
        let detectedScore = 40; // realistic default
        for (const [word, val] of this.intensifiers) {
            const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            if (re.test(lowerLine)) {
                detectedScore = val;
                break;
            }
        }

        // 2. Remove intensifiers + prepositions
        let cleanLine = lowerLine.replace(this.removePattern, "");

        // Final trim of leading/trailing punctuation + whitespace
        cleanLine = cleanLine.replace(/^[.:;,\-\s]+|[.:;,\-\s]+$/g, "");
        cleanLine = cleanLine.replace(/\s+/g, " ").trim();

        return [detectedScore, cleanLine];
    }

    // ── Main parser ──────────────────────────────────────────────────────────

    parseVaga(texto: string, categoria = "Outros"): ParseResult {
        if (!this.skillRegistry[categoria]) {
            this.skillRegistry[categoria] = [];
        }

        const existingLower = new Set(
            this.skillRegistry[categoria].map((s) => s.toLowerCase())
        );

        const vagaMapeada: VagaMapeada = {};
        const newSkills: string[] = [];
        let novidades = false;

        // Clean bullets and blank lines
        const lines = texto
            .split("\n")
            .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
            .filter((l) => l.length > 0);

        for (const line of lines) {
            const [score, cleanPhrase] = this.extractIntensityAndClean(line);
            if (!cleanPhrase) continue;

            // Split composite skills (supports "ou", "e/ou", commas, slashes, semicolons)
            const parts = cleanPhrase.split(
                /\s*(?:,|\/|;|\be\b|\band\b|\bou\b|\be\/ou\b)\s*/i
            );

            for (const part of parts) {
                if (!part || part.length < 2) continue;

                const skillName = this.normalizeSkillName(part);
                const skillKey = skillName.toLowerCase();

                // Add to global registry if new
                if (!existingLower.has(skillKey)) {
                    console.log(`✨ Novo requisito em ${categoria}: ${skillName}`);
                    this.skillRegistry[categoria].push(skillName);
                    existingLower.add(skillKey);
                    newSkills.push(skillName);
                    novidades = true;
                }

                // Keep highest score for this skill in this posting
                vagaMapeada[skillKey] = Math.max(vagaMapeada[skillKey] ?? 0, score);
            }
        }

        if (novidades) {
            this.saveRegistry();
        }

        return { vagaMapeada, newSkills };
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    getRegistry(): SkillRegistry {
        return { ...this.skillRegistry };
    }

    clearRegistry(): void {
        this.skillRegistry = Object.fromEntries(
            this.defaultCategories.map((c) => [c, []])
        );
        this.saveRegistry();
    }

    addCategory(name: string): void {
        if (!this.skillRegistry[name]) {
            this.skillRegistry[name] = [];
            this.saveRegistry();
        }
    }

    removeCategory(name: string): void {
        if (!this.defaultCategories.includes(name)) {
            delete this.skillRegistry[name];
            this.saveRegistry();
        }
    }
}
