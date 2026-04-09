import fs from "fs";
import path from "path";

class SupremeSkillEngine {
  constructor(registryFile = "skill_registry.json") {
    this.registryFile = path.resolve(registryFile);

    // Intensificadores ordenados por prioridade (do mais forte ao mais fraco)
    // Using an array of [key, value] to preserve insertion order and priority
    this.intensifiers = [
      ["obrigatório", 100],
      ["imprescindível", 100],
      ["expert", 100],
      ["especialista", 100],
      ["avançado", 90],
      ["domínio", 90],
      ["experiência sólida", 85],
      ["sólida", 85],
      ["sólidas", 85],
      ["sólido", 85],
      ["sólidos", 85],
      ["experiência", 65],
      ["conhecimento", 40],
      ["familiaridade", 50],
      ["noções", 30],
      ["básico", 30],
      ["desejável", 50],
      ["preferencial", 50],
    ];

    // Acrônimos comuns que devem ficar em MAIÚSCULAS
    this.commonAcronyms = new Set([
      "SQL", "AWS", "AZURE", "GCP", "AI", "ML", "NLP", "ERP", "CRM",
      "API", "UI", "UX", "HTML", "CSS", "JS", "TS", "REACT", "NODE",
      "DOCKER", "K8S", "CI", "CD", "ETL", "BI", "POWERBI", "LLM", "LLMS", "C#", "C++",
    ]);

    // Precompila o padrão de remoção (muito mais eficiente)
    // Note: JS \b doesn't work with accented chars — use Unicode lookarounds
    const allIntensifiers = this.intensifiers
      .map(([k]) => k)
      .sort((a, b) => b.length - a.length);

    const removeTerms = [
      ...allIntensifiers,
      "em", "com", "de", "na", "no", "para", "a", "o", "as", "os", "um", "uma"
    ];

    const escaped = removeTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Unicode-aware word boundary: (?<!\p{L}) ... (?!\p{L})
    this._removePattern = new RegExp(
      `(?<!\\p{L})(${escaped.join("|")})(?!\\p{L})`,
      "giu"
    );

    this.defaultCategories = ["Psicologia", "Artes", "TI", "Outros"];
    this.skillRegistry = this._loadRegistry();
  }

  // ── persistence ──────────────────────────────────────────────────────

  _loadRegistry() {
    try {
      if (fs.existsSync(this.registryFile)) {
        const raw = fs.readFileSync(this.registryFile, "utf-8");
        const data = JSON.parse(raw);

        // Garante que todas as categorias padrão existam
        for (const cat of this.defaultCategories) {
          if (!(cat in data)) data[cat] = [];
        }
        return data;
      }
    } catch (e) {
      console.error(`Erro ao carregar registro: ${e}`);
    }

    return Object.fromEntries(this.defaultCategories.map((c) => [c, []]));
  }

  _saveRegistry() {
    fs.writeFileSync(
      this.registryFile,
      JSON.stringify(this.skillRegistry, null, 4),
      "utf-8"
    );
  }

  // ── helpers ──────────────────────────────────────────────────────────

  /**
   * Padroniza o nome e trata acrônimos corretamente.
   */
  _normalizeSkillName(skill) {
    const clean = skill.replace(/\s+/g, " ").trim();
    if (!clean) return "";

    const upperClean = clean.toUpperCase();

    // Acrônimos conhecidos ficam em MAIÚSCULAS
    if (this.commonAcronyms.has(upperClean)) return upperClean;

    // Title-case for words longer than 3 chars, otherwise uppercase
    if (clean.length > 3) {
      return clean.split(/\s+/).map((w) => {
        // Keep acronyms in the middle of sentences capitalized if they are known
        const wUpper = w.toUpperCase();
        if (this.commonAcronyms.has(wUpper.replace(/[(),]/g, ""))) return wUpper;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ");
    }
    return clean.toUpperCase();
  }

  /**
   * Detecta o score e faz limpeza completa
   * (remove TODOS intensificadores + preposições).
   * @returns {[number, string]} [score, linha_limpa]
   */
  _extractIntensityAndClean(line) {
    const lowerLine = line.toLowerCase().trim();

    // 1. Detecção de intensidade (mantém prioridade do array)
    let detectedScore = 40; // default mais realista
    for (const [word, val] of this.intensifiers) {
      const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordPattern = new RegExp(`(?<!\\p{L})${esc}(?!\\p{L})`, "iu");
      if (wordPattern.test(lowerLine)) {
        detectedScore = val;
        break;
      }
    }

    // 2. Limpeza total com regex precompilado
    let cleanLine = lowerLine.replace(this._removePattern, "");

    // Limpeza final
    cleanLine = cleanLine
      .replace(/^[.:;,\-\s]+|[.:;,\-\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return [detectedScore, cleanLine];
  }

  // ── main entry point ─────────────────────────────────────────────────

  parseVaga(texto, categoria = "Outros") {
    if (!(categoria in this.skillRegistry)) {
      this.skillRegistry[categoria] = [];
    }

    // Set rápido para checar duplicatas (case-insensitive)
    const existingSkillsLower = new Set(
      this.skillRegistry[categoria].map((s) => s.toLowerCase())
    );

    const vagaMapeada = {};
    let novidades = false;

    // Considera apenas as linhas que são itens de lista para não pegar lixo
    const lines = texto
      .split("\n")
      .filter((l) => /^\s*(?:[-•*]|\d+[.)])\s+/.test(l))
      .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim());

    for (const line of lines) {
      const [score, cleanPhrase] = this._extractIntensityAndClean(line);
      if (!cleanPhrase) continue;

      // Divide skills compostas (agora suporta "ou" e "e/ou")
      const parts = cleanPhrase.split(
        /\s*(?:,|\/|;|\be\b|\band\b|\bou\b|\be\/ou\b)\s*/i
      );

      for (const part of parts) {
        if (!part || part.length < 2) continue;

        const skillName = this._normalizeSkillName(part);
        const skillKey = skillName.toLowerCase();

        // Evita sentenças longas e não tira preposição do meio se quebrou errado
        const wordCount = skillName.trim().split(/\s+/).length;
        if (wordCount > 4) continue;

        // Adiciona ao registry global se for nova
        if (!existingSkillsLower.has(skillKey)) {
          console.log(`✨ Novo requisito em ${categoria}: ${skillName}`);
          this.skillRegistry[categoria].push(skillName);
          existingSkillsLower.add(skillKey);
          novidades = true;
        }

        // Mantém o maior score encontrado para essa skill na vaga
        vagaMapeada[skillKey] = Math.max(vagaMapeada[skillKey] ?? 0, score);
      }
    }

    if (novidades) {
      this._saveRegistry();
    }

    return vagaMapeada;
  }
}

export default SupremeSkillEngine;

// ── CLI runner ──────────────────────────────────────────────────────────

function main() {
  const examplePath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "example.txt"
  );

  if (!fs.existsSync(examplePath)) {
    console.error(`❌ Arquivo não encontrado: ${examplePath}`);
    process.exit(1);
  }

  const texto = fs.readFileSync(examplePath, "utf-8");
  const engine = new SupremeSkillEngine();
  const result = engine.parseVaga(texto, "TI");

  console.log("\n── Resultado da Vaga ──────────────────────────────────");
  console.log(JSON.stringify(result, null, 2));

  console.log("\n── Registro Global (TI) ──────────────────────────────");
  console.log(JSON.stringify(engine.skillRegistry["TI"], null, 2));
}

// Run only when executed directly (not when imported as a module)
const isMain =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) ===
    fs.realpathSync(new URL(import.meta.url).pathname);

if (isMain) {
  main();
}
