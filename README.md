# Auscultation LGV — Tunnel Aïn Harouda

Application web statique reproduisant le classeur `auscultation_LGV_autoroute.xlsm` (TOARC 2, marché ONCF 624C02).

## Démarrage

Double-clique sur `index.html` — l'app se lance dans le navigateur. Aucune installation, aucun serveur.

Si tu veux un vrai serveur local (recommandé pour Chrome strict) :

```
cd C:\aus\web
python -m http.server 8080
```
puis ouvre `http://localhost:8080`.

## Fonctionnalités

- **Tableau de bord** — KPI + graphiques par campagne et côté
- **Carte** — fond Esri/OSM, marqueurs colorés selon statut, popup avec valeurs
- **Calculs** — table complète des écarts ΔX/ΔY/ΔZ, plani, 3D, statuts auto
- **Import campagne** — .txt drag & drop, format `R1.X x y z` (idem xlsm)
- **Mesures brutes** — édition / suppression
- **Cibles** — inventaire et édition de l'état 0
- **Rapport** — fiche imprimable type ONCF, prête pour PDF (Ctrl+P → "Enregistrer en PDF")
- **Paramètres** — projet, tolérances, signataires
- **Export / Import projet** — JSON unique pour archivage ou bascule machine

## Données par défaut

À la première ouverture, les 16 cibles V0 (R1-R8 / C1-C8) du xlsm sont chargées automatiquement, ainsi que les paramètres projet et signataires (HICHAME MAHA, JOUAN TAOUFIQ, BOUDHAIM FARID).

## Tester avec les données du xlsm

Importe successivement, depuis le dossier `exemples/` :
- `campagne1_casa.txt` (campagne 1)
- `campagne1_rabat.txt` (campagne 1)
- `campagne2_casa.txt` (campagne 2)
- `campagne3_rabat.txt` (campagne 3)

Puis ouvre le **Tableau de bord**, sélectionne campagne 3 / côté Rabat → tu retrouves les 5 cibles non tolérables identiques au xlsm.

## Stockage

Les données sont stockées dans `localStorage` du navigateur. Pour partager ou sauvegarder, utilise **Exporter projet (JSON)** dans la barre latérale.

## Déploiement (optionnel)

Le dossier est 100% statique, donc déployable sur :
- GitHub Pages
- Netlify (drag & drop du dossier)
- Un partage réseau interne ONCF
- Une clé USB

## Migration ultérieure

Si tu veux passer à du multi-utilisateur avec auth/historique partagé, on peut greffer **Supabase** (backend SQL + auth) sans réécrire le front. Le format JSON exporté servira à initialiser la base.
