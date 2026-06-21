# Comfy-ExtraUI

Extension [ComfyUI](https://github.com/comfyanonymous/ComfyUI) purement frontend — aucun nœud Python, aucune dépendance. Elle affine l'interface de ComfyUI sans toucher à son comportement de génération.

## Fonctionnalités

- **Grille de points** — remplace la grille de lignes native par des points discrets qui s'adaptent au niveau de zoom (les points se regroupent au dézoom pour rester lisibles).
- **Snap to grid permanent** — les nœuds s'alignent à la grille à tout niveau de zoom (`LiteGraph.alwaysSnapToGrid`).
- **Onglet latéral mis en évidence** — l'onglet actif du rail gauche reçoit la couleur d'accent du thème courant (fond teinté + bordure + icône).
- **Variable CSS `--cs-accent`** — la couleur primaire du thème est exposée en valeur concrète pour être utilisable dans `style.css` sans les limitations de `@property`.
- **Fond `<body>` aligné** — évite le flash de couleur qui apparaît au-delà de 150 % de zoom.

## Installation

**Via ComfyUI Manager** *(recommandé)*

Chercher `Comfy-ExtraUI` dans le gestionnaire et installer.

**Manuellement**

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Black0S/Comfy-ExtraUI
```

Redémarrer ComfyUI. L'extension est chargée automatiquement via `WEB_DIRECTORY = "./web"`.

## Structure

```
Comfy-ExtraUI/
├── __init__.py      # Déclaration de l'extension (WEB_DIRECTORY)
└── web/
    ├── main.js      # Logique : grille, snap, onglets, helpers console
    └── style.css    # Styles du chrome (sidebar, survols…)
```

## Personnalisation

### Canvas (`web/main.js`)

Trois fonctions sont prévues pour la zone « ZONE À MODIFIER » :

| Fonction | Rôle |
|---|---|
| `applyLiteGraph(LG, canvas)` | Réglages globaux LiteGraph (grille, couleurs…) |
| `drawBackground(ctx, area, canvas)` | Dessin derrière les nœuds (grille de points) |
| `drawForeground(ctx, area, canvas)` | Overlay au-dessus des nœuds (vide par défaut) |

Les coordonnées de `ctx` dans `drawBackground` / `drawForeground` sont en **coordonnées graphe** (pas écran).

Repères disponibles dans `main.js` :

```js
window.LiteGraph   // API LiteGraph
app.canvas         // LGraphCanvas courant
app.graph._nodes   // Tableau de tous les nœuds
app.runningNodeId  // ID du nœud en cours d'exécution
```

### Chrome (`web/style.css`)

Cibler les **classes stables** (ex. `.side-bar-button`) avec `!important`. Ne pas cibler les attributs `data-v-XXXX` (hash Vue qui change à chaque mise à jour du frontend).

### Console

L'objet `window.comfyExtra` est exposé en console de navigateur :

```js
window.comfyExtra.refresh()    // Réapplique tous les réglages immédiatement
window.comfyExtra.alignAll()   // Accroche tous les nœuds à la grille
```

## Compatibilité

- ComfyUI (frontend Vue — version courante)
- Python 3.x (uniquement pour la déclaration `__init__.py`)
- Navigateurs modernes (Chrome, Firefox, Edge)

## Licence

MIT
