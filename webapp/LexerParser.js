import fs from "fs";
import path from "path";

class SupremeSkillEngine {
  constructor(registryFile = "skill_registry.json") {
    this.registryFile = path.resolve(registryFile);

    // Intensificadores ordenados por prioridade (do mais forte ao mais fraco)
    // Using an array of [key, value] to preserve insertion order and priority
    this.intensifiers = [
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

    this.commonAcronyms = new Set([
      "SQL", "AWS", "AZURE", "GCP", "AI", "ML", "NLP", "ERP", "CRM",
      "API", "UI", "UX", "HTML", "CSS", "JS", "TS", "REACT", "NODE",
      "DOCKER", "K8S", "CI", "CD", "ETL", "BI", "POWERBI", "LLM", "LLMS",
      "C#", "C++", "PHP", "VUE", "SEO", "QA", "PO", "PM", "SM"
    ]);

    this.actionVerbs = new Set([
      "trabalhar", "desenvolver", "atuar", "implementar", "manter", "corrigir",
      "apoiar", "participar", "colaborar", "gostar", "curtir", "residir", "enviar",
      "possuir", "ter", "criar", "garantir", "auxiliar", "gerar", "planejar", 
      "executar", "entregar", "realizar", "projetar", "testar", "otimizar",
      "analisar", "resolver", "escrever", "comunicar", "liderar", "gerenciar",
      "definir", "validar", "monitorar", "acompanhar", "estruturar", "organizar"
    ]);

    this.ignoreKeywords = new Set([
      "benefício", "benefícios", "remoto", "híbrido", "contratação", "salário", 
      "requisito", "requisitos", "diferencial", "diferenciais", "local", "modelo", 
      "horário", "vaga", "candidatar", "ajuda custo", "vt", "vr", "vale", 
      "transporte", "refeição", "plano de saúde", "seguro de vida", "idade",
      "gênero", "etnia", "currículo", "cv", "portfolio", "portfólio",
      "estamos contratando", "oportunidade", "empresa", "equipe", "ambiente"
    ]);

    const allIntensifiers = this.intensifiers
      .map(([k]) => k)
      .sort((a, b) => b.length - a.length);

    const prepositions = [
      "em", "com", "de", "do", "da", "dos", "das", "na", "no", "nas", "nos", 
      "para", "pra", "pro", "por", "pelo", "pela", "pelos", "pelas",
      "a", "o", "as", "os", "um", "uma", "uns", "umas", "sobre", "sem"
    ];

    const removeTerms = [...allIntensifiers, ...prepositions];

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
        let cleanPart = part.replace(/^[.:;,\-\s]+|[.:;,\-\s]+$/g, "").trim();

        const words = cleanPart.split(/\s+/);
        while (words.length > 0 && this.actionVerbs.has(words[0].toLowerCase())) {
          words.shift();
        }
        cleanPart = words.join(" ");

        if (!cleanPart || cleanPart.length < 2) continue;

        if (words.length > 4) continue;

        const lowerPart = cleanPart.toLowerCase();
        let isGarbage = false;
        for (const ignore of this.ignoreKeywords) {
          if (lowerPart.includes(ignore)) {
            isGarbage = true;
            break;
          }
        }
        if (/^[\d.:;,\-]+$/.test(lowerPart)) isGarbage = true;
        
        if (isGarbage) continue;

        const skillName = this._normalizeSkillName(cleanPart);
        const skillKey = skillName.toLowerCase();

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
  const dir = path.dirname(new URL(import.meta.url).pathname);

  const vagas = [
    { file: "vaga_ti.txt", categoria: "TI" },
    { file: "vaga_artes.txt", categoria: "Artes" },
    { file: "vaga_psicologia.txt", categoria: "Psicologia" },
  ];

  const engine = new SupremeSkillEngine();

  // Clear registry for demo purposes so it's clean
  engine.skillRegistry = { TI: [], Artes: [], Psicologia: [], Outros: [] };

  for (const { file, categoria } of vagas) {
    const filePath = path.resolve(dir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      continue;
    }
    
    const texto = fs.readFileSync(filePath, "utf-8");
    const result = engine.parseVaga(texto, categoria);
    
    console.log(`\n── Resultado da Vaga (${file}) ──────────────────────────────────`);
    console.log(JSON.stringify(result, null, 2));

    console.log(`\n── Chaves geradas (lowercase map) ──────────────────────────────`);
    console.log(JSON.stringify(Object.keys(result), null, 2));
  }
}

// Run only when executed directly (not when imported as a module)
const isMain =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) ===
    fs.realpathSync(new URL(import.meta.url).pathname);

if (isMain) {
  main();
}
