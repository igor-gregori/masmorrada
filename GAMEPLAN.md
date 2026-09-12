# Masmorrada — Gameplan

> Roguelike web simples: recrute bestas, monte um esquadrão, defina táticas e
> assista a batalhas automáticas para descer a masmorra.

- **Nome:** Masmorrada
- **Stack:** Vite + TypeScript + Canvas 2D (sem engine) + localStorage
- **Deploy:** GitHub Pages / Vercel (sem backend)
- **Escopo F1:** MVP vertical mínimo — um loop completo jogável

---

## Visão de produto

O caçador recruta **bestas**, monta um esquadrão de 4 unidades, define
posicionamento/táticas e assiste batalhas automáticas. Primeira versão: **um
andar com chefe e finito**, sem meta-progressão entre runs.

---

## Spec do MVP

### Grid

- 8x8, unidades do jogador em um lado, inimigos no outro.
- Combate acontece em turnos, ordem por Velocidade.

### Tipos de criatura (2–3 para começar)

| Tipo       | Categoria | Bônus do par (2 unidades do mesmo tipo) |
|------------|-----------|------------------------------------------|
| **Besta**  | Tanque    | +ATQ e +DEF                              |
| **Espectro** | Veloz   | +VEL e esquiva                           |
| **Arauto** (opcional) | Suporte | +Vida e cura                   |

### Unidade

Nome, Tipo, Vida, Ataque, Defesa, Velocidade, Nível, Raridade
(Comum / Rara / Lendária).

### Loop de gameplay

```
Recrutar (escolher 1 de 3 após vitória) → Montar (4 slots, mostrar sinergias)
→ Tática (frente/trás) → Batalha automática (≤5s, grid, turnos por VEL)
→ Recompensa (ouro + escolher 1 de 3: criatura/item/mutação)
→ Chefe no andar final → Run acaba (vitória ou derrota)
```

### Regras

- Esquadrão zerado = fim da run.
- Andar único com chefe = "vitória" do MVP.
- Derrota ou vitória => tela de Game Over com score.

### Telas

1. Título
2. Recrutar (escolher 1 de 3)
3. Batalha (simulação automática)
4. Recompensa
5. Game Over (score, reiniciar run)

---

## Decisões de design (confirmadas)

1. A run **começa com um recrutamento inicial** (escolher 1 de 3).
2. A run tem **3 batalhas normais + 1 chefe**.
3. A recompensa pós-batalha oferece **1 de 3: criatura / item / mutação**.
4. Unidades de trás **só são atacadas depois que a linha da frente cair**.
5. Sem tempo máximo por batalha — objetivo de design é uma batalha **rápida e agradável** (~5s).
6. Fórmula simples de stats (tabela abaixo).
7. Esquiva = **chance percentual fixa**.
8. Score = fórmula simples (abaixo).
9. **Morte = reset total** da run. Nada acumula entre runs. Só o **recorde** fica em localStorage.

### Fórmulas propostas (a validar nos testes)

**Stats base por tipo:**

| Tipo | Vida | Ataque | Defesa | Velocidade | Bônus (par de 2) |
|------|-----:|-------:|-------:|-----------:|------------------|
| Besta | 90 | 12 | 10 | 6 | +20% ATQ e +20% DEF |
| Espectro | 60 | 8 | 4 | 12 | +20% VEL e +10% esquiva |
| Arauto | 70 | 6 | 6 | 8 | +15% Vida e cura 5/turno |

**Escalonamento:** `Stat = Base × (1 + 0,2 × (Nível − 1)) × mult. Raridade`
(Raridade: Comum ×1,0 · Rara ×1,25 · Lendária ×1,5)

**Dano:** `dano = max(1, ATQ − DEF)`

**Ordem de turno:** VEL decrescente; desempate aleatório.

**Esquiva:** chance fixa de esquivar o ataque (10% base do Espectro + 10% por par de Espectros, cap 50%).

**Score:** `Σ (inimigo derrotado × 10 × raridade: 1/2/3) + sobreviventes × 25 + vitória 50 + chefe 100`

**Item (F1):** buff fixo aplicado a 1 unidade à escolha (ex.: +15 Vida, +3 ATQ, +2 DEF, +10% esquiva). Consome ao aplicar.
**Mutação (F1):** +1 Nível na unidade escolhida.
**Criatura (F1):** entra no banco/esquadrão (troca por um dos 4 slots).

---

## Plano de desenvolvimento (fases testáveis)

> Fluxo de trabalho: ao terminar cada fase marco o checkbox e aviso. Você testa com `npm run dev`.

- [x] **F1 · Setup + grade** — Vite + TypeScript + Canvas 2D, grid 8x8 desenhado, loop de render, unidades placeholder por lado. *Teste: ver a grade com placeholders coloridos.*
- [x] **F2 · Modelo de dados** — Tipos, Raridade, Criatura, Esquadrão, Sinergias e a tabela de fórmulas configurável. *Teste: nada visual; validar com um preview dos stats no console.*
- [ ] **F3 · Recrutamento inicial** — Pool de criaturas, tela "Escolher 1 de 3". *Teste: recrutar uma criatura e vê-la no esquadrão.*
- [ ] **F4 · Montagem + Tática** — 4 slots (troca por criaturas do banco), sinergias por tipo, posicionamento frente/trás. *Teste: montar o time e ver os bônus de par.*
- [ ] **F5 · Motor de batalha + IA** — Turnos por VEL, mover/atacar no grid, esquiva, morte, regra de frente/trás, IA simples por unidade. *Teste: assistir uma batalha terminar.*
- [ ] **F6 · Inimigos e chefe** — Geração escalonada de inimigos por batalha (1→2→3) + chefe; organização das 4 batalhas da run. *Teste: batalhas com dificuldade crescente.*
- [ ] **F7 · Loop completo + recompensas** — Recrutar → Montar → Tática → Batalha → Recompensa (1 de 3: criatura/item/mutação) ×3 → Chefe → Game Over. *Teste: jogar uma run inteira.*
- [ ] **F8 · Score + persistência** — Cálculo de score, tela de Game Over, recorde em localStorage, botão de reiniciar (reset total). *Teste: morrer/vitórificar e o recorde ser salvo.*
- [ ] **F9 · Polish** — HUD, barras de vida, feedback de dano, cores por tipo, tela do chefe. *Teste: batalhas legíveis e agradáveis.*

---

## Arquitetura planejada (esboço)

```
src/
  main.ts             # bootstrap + game loop
  core/
    types.ts          # Criatura, Esquadrão, Tipo, Raridade
    sinergies.ts      # regras de bônus por tipo
    combat.ts         # simulação de batalha automática
  generation/
    enemy.ts          # inimigos/chefe escalonados
  render/
    canvas.ts         # grid + desenho de unidades
    hud.ts            # barras de vida, feedback de dano
  ui/
    screens.ts        # Telas: título, recrutar, batalha, recompensa, over
    store.ts          # estado da run + localStorage
```