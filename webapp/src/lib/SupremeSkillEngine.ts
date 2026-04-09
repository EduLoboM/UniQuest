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
        ["obrigatório", 100], ["mandatório", 100], ["imprescindível", 100],
        ["essencial", 100], ["indispensável", 100], ["requisito", 100],
        ["expert", 100], ["especialista", 100], ["senior", 100], ["sênior", 100],
        ["avançado", 90], ["avançada", 90], ["avançadas", 90], ["avançados", 90], 
        ["domínio", 90], ["fluente", 90], ["impecável", 90],
        ["experiência sólida", 85], ["sólida", 85], ["sólidas", 85], ["sólido", 85], ["sólidos", 85],
        ["experiência", 65], ["vivência", 65], ["pleno", 65],
        ["conhecimento", 50], ["intermediário", 50],
        ["familiaridade", 40],
        ["noções", 30], ["básico", 30], ["junior", 30], ["júnior", 30],
        ["diferencial positivo", 60], ["positivo", 60], ["desejável", 60], ["diferencial", 60], ["plus", 60], ["preferencial", 60],
    ];

    /** Acronyms that should stay UPPERCASED */
    private readonly commonAcronyms = new Set([
        "SQL", "AWS", "AZURE", "GCP", "AI", "ML", "NLP", "ERP", "CRM",
        "API", "UI", "UX", "HTML", "CSS", "JS", "TS", "REACT", "NODE",
        "DOCKER", "K8S", "CI", "CD", "ETL", "BI", "POWERBI", "LLM", "LLMS",
        "C#", "C++", "PHP", "VUE", "SEO", "QA", "PO", "PM", "SM"
    ]);

    /** Verbs to strip from the start of skills (e.g. "Desenvolver sistemas" -> "sistemas") */
    private readonly actionVerbs = new Set([
        "trabalhar", "desenvolver", "atuar", "implementar", "manter", "corrigir",
        "apoiar", "participar", "colaborar", "gostar", "curtir", "residir", "enviar",
        "possuir", "ter", "criar", "garantir", "auxiliar", "gerar", "planejar", 
        "executar", "entregar", "realizar", "projetar", "testar", "otimizar",
        "analisar", "resolver", "escrever", "comunicar", "liderar", "gerenciar",
        "definir", "validar", "monitorar", "acompanhar", "estruturar", "organizar"
    ]);

    /** Keywords that indicate a phrase is not a skill but a job attribute */
    private readonly ignoreKeywords = new Set([
        "benefício", "benefícios", "remoto", "híbrido", "contratação", "salário", 
        "requisito", "requisitos", "diferencial", "diferenciais", "local", "modelo", 
        "horário", "vaga", "candidatar", "ajuda custo", "vt", "vr", "vale", 
        "transporte", "refeição", "plano de saúde", "seguro de vida", "idade",
        "gênero", "etnia", "currículo", "cv", "portfolio", "portfólio",
        "estamos contratando", "oportunidade", "empresa", "equipe", "ambiente"
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

        const prepositions = [
            "em", "com", "de", "do", "da", "dos", "das", "na", "no", "nas", "nos", 
            "para", "pra", "pro", "por", "pelo", "pela", "pelos", "pelas",
            "a", "o", "as", "os", "um", "uma", "uns", "umas", "sobre", "sem"
        ];

        const removeTerms = [...allIntensifiers, ...prepositions];

        const escaped = removeTerms.map((t) =>
            t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        );
        this.removePattern = new RegExp(
            `(?<!\\p{L})(${escaped.join("|")})(?!\\p{L})`,
            "giu"
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
        if (this.commonAcronyms.has(upper.replace(/[(),]/g, ""))) return upper;

        return clean
            .split(/\s+/)
            .map((w) => {
                const wUpper = w.toUpperCase();
                if (this.commonAcronyms.has(wUpper.replace(/[(),]/g, ""))) return wUpper;
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            })
            .join(" ");
    }

    // ── Intensity detection + cleanup ────────────────────────────────────────

    private extractIntensityAndClean(line: string): [number, string] {
        const lowerLine = line.toLowerCase().trim();

        // 1. Detect intensity (first match wins — priority order)
        let detectedScore = 40; // realistic default
        for (const [word, val] of this.intensifiers) {
            const re = new RegExp(`(?<!\\p{L})${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\p{L})`, "iu");
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

            // Split composite skills (supports "ou", "e/ou", commas, slashes, semicolons, and "+")
            const parts = cleanPhrase.split(
                /\s*(?:,|\/|;|\be\b|\band\b|\bou\b|\be\/ou\b|\b\+\b)\s*/i
            );

            for (const part of parts) {
                let cleanPart = part.replace(/^[.:;,\-\s]+|[.:;,\-\s]+$/g, "").trim();

                // Strip starting action verb if present
                const words = cleanPart.split(/\s+/);
                while (words.length > 0 && this.actionVerbs.has(words[0].toLowerCase())) {
                    words.shift();
                }
                cleanPart = words.join(" ");

                if (!cleanPart || cleanPart.length < 2) continue;

                // Word limit to avoid full sentences masquerading as skills
                if (words.length > 4) continue;

                const lowerPart = cleanPart.toLowerCase();

                // Check for garbage keywords that are common in job boards
                let isGarbage = false;
                for (const ignore of this.ignoreKeywords) {
                    if (lowerPart.includes(ignore)) {
                        isGarbage = true;
                        break;
                    }
                }
                
                // Exclude pure punctuation/numbers
                if (/^[\d.:;,\-]+$/.test(lowerPart)) isGarbage = true;
                
                if (isGarbage) continue;

                const skillName = this.normalizeSkillName(cleanPart);
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
