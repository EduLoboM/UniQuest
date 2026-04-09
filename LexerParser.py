import re
import json
from pathlib import Path
from collections import OrderedDict


class SupremeSkillEngine:
    def __init__(self, registry_file="skill_registry.json"):
        self.registry_file = Path(registry_file)
        
        # Intensificadores ordenados por prioridade (do mais forte ao mais fraco)
        self.intensifiers = OrderedDict([
            ("obrigatório", 100),
            ("imprescindível", 100),
            ("expert", 100),
            ("especialista", 100),
            ("avançado", 90),
            ("domínio", 90),
            ("experiência sólida", 85),
            ("sólida", 85),
            ("experiência", 65),
            ("conhecimento", 40),
            ("familiaridade", 50),
            ("noções", 30),
            ("básico", 30),
            ("desejável", 50),
            ("preferencial", 50)
        ])
        
        # Acrônimos comuns que devem ficar em MAIÚSCULAS
        self.common_acronyms = {
            "SQL", "AWS", "AZURE", "GCP", "AI", "ML", "NLP", "ERP", "CRM",
            "API", "UI", "UX", "HTML", "CSS", "JS", "TS", "REACT", "NODE",
            "DOCKER", "K8S", "CI", "CD", "ETL", "BI", "POWERBI", "LLM", "LLMS"
        }
        
        # Precompila o padrão de remoção (muito mais eficiente)
        all_intensifiers = sorted(self.intensifiers.keys(), key=len, reverse=True)
        remove_terms = all_intensifiers + ["em", "com", "de", "na", "no", "para", "a", "o", "as", "os", "e"]
        self._remove_pattern = re.compile(
            r"\b(" + "|".join(re.escape(term) for term in remove_terms) + r")\b",
            re.IGNORECASE
        )
        
        self.default_categories = ["Psicologia", "Artes", "TI", "Outros"]
        self.skill_registry = self._load_registry()

    def _load_registry(self):
        try:
            if self.registry_file.exists():
                with self.registry_file.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                # Garante que todas as categorias padrão existam
                for cat in self.default_categories:
                    data.setdefault(cat, [])
                return data
        except Exception as e:
            print(f"Erro ao carregar registro: {e}")
        
        return {cat: [] for cat in self.default_categories}

    def _save_registry(self):
        with self.registry_file.open("w", encoding="utf-8") as f:
            json.dump(self.skill_registry, f, ensure_ascii=False, indent=4)

    def _normalize_skill_name(self, skill):
        """Padroniza o nome e trata acrônimos corretamente."""
        clean = re.sub(r"\s+", " ", skill).strip()
        if not clean:
            return ""
        
        upper_clean = clean.upper()
        # Acrônimos conhecidos ficam em MAIÚSCULAS
        if upper_clean in self.common_acronyms:
            return upper_clean
        
        return clean.title() if len(clean) > 3 else clean.upper()

    def _extract_intensity_and_clean(self, line):
        """
        Detecta o score e faz limpeza completa (remove TODOS intensificadores + preposições).
        Retorna: (score, linha_limpa)
        """
        lower_line = line.lower().strip()
        
        # 1. Detecção de intensidade (mantém prioridade do OrderedDict)
        detected_score = 40  # default mais realista
        for word, val in self.intensifiers.items():
            if re.search(rf"\b{re.escape(word)}\b", lower_line):
                detected_score = val
                break
        
        # 2. Limpeza total com regex precompilado
        clean_line = self._remove_pattern.sub("", lower_line)
        
        # Limpeza final
        clean_line = re.sub(r"^[.:;,\-\s]+|[.:;,\-\s]+$", "", clean_line)
        clean_line = re.sub(r"\s+", " ", clean_line).strip()
        
        return detected_score, clean_line

    def parse_vaga(self, texto, categoria="Outros"):
        if categoria not in self.skill_registry:
            self.skill_registry[categoria] = []

        # Set rápido para checar duplicatas (case-insensitive)
        existing_skills_lower = {s.lower() for s in self.skill_registry[categoria]}
        
        vaga_mapeada = {}
        novidades = False

        # Limpa bullets e linhas vazias
        lines = [
            re.sub(r"^\s*(?:[-•*]|\d+[.)])\s*", "", l).strip()
            for l in texto.splitlines() if l.strip()
        ]

        for line in lines:
            score, clean_phrase = self._extract_intensity_and_clean(line)
            if not clean_phrase:
                continue

            # Divide skills compostas (agora suporta "ou" e "e/ou")
            parts = re.split(
                r"\s*(?:,|/|;|\be\b|\band\b|\bou\b|\be/ou\b)\s*",
                clean_phrase,
                flags=re.I
            )
            
            for part in parts:
                if not part or len(part) < 2:
                    continue
                
                skill_name = self._normalize_skill_name(part)
                skill_key = skill_name.lower()

                # Adiciona ao registry global se for nova
                if skill_key not in existing_skills_lower:
                    print(f"✨ Novo requisito em {categoria}: {skill_name}")
                    self.skill_registry[categoria].append(skill_name)
                    existing_skills_lower.add(skill_key)
                    novidades = True

                # Mantém o maior score encontrado para essa skill na vaga
                vaga_mapeada[skill_key] = max(vaga_mapeada.get(skill_key, 0), score)

        if novidades:
            self._save_registry()

        return vaga_mapeada