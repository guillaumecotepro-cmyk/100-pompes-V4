# 100 Pompes

Application web mobile-first pour vous accompagner jusqu'à réussir **100 pompes d'affilée**.

## Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Recharts** pour les graphiques
- **localStorage** pour le stockage (pas de backend requis)

## Fonctionnalités

- **Test initial** : évalue ton niveau (Débutant / Intermédiaire / Avancé / Élite)
- **Programme adaptatif** : généré automatiquement selon ton score
- **Comptage multi-mode** :
  - Capteur de mouvement (accéléromètre, téléphone sur le dos)
  - Caméra frontale (téléphone au sol, détection par luminosité)
  - Tap manuel (toujours disponible)
- **Calibration** avant chaque séance
- **Dashboard** : progression, streak, statistiques, badges
- **Historique** complet des séances
- **Gamification** : badges, streaks, records personnels

## Installation

```bash
# Cloner le repo
git clone https://github.com/<you>/100-pompes.git
cd 100-pompes

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Déploiement sur Vercel

1. Pousse le code sur GitHub
2. Importe le repo sur [vercel.com](https://vercel.com)
3. Vercel détecte automatiquement Next.js — déploie sans configuration

Aucune variable d'environnement n'est requise pour le MVP.

## Variables d'environnement

Voir `.env.example` — aucune n'est requise pour la version actuelle.  
Prévue pour une future intégration Supabase :

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

```
src/
├── app/                   # Pages (App Router)
│   ├── page.tsx           # Landing
│   ├── onboarding/        # Onboarding 3 étapes
│   ├── test/              # Test initial
│   ├── calibration/       # Calibration capteur
│   ├── workout/           # Séance active
│   ├── dashboard/         # Tableau de bord
│   ├── history/           # Historique
│   ├── progress/          # Progression
│   ├── profile/           # Profil + badges
│   └── settings/          # Paramètres
├── components/
│   ├── ui/                # Composants atomiques (Button, Card, Badge…)
│   ├── InitialTest.tsx    # Test initial avec compteur tap
│   ├── SensorCalibration.tsx  # Sélection et test du mode de détection
│   ├── ActiveWorkout.tsx  # Interface de séance (compteur + repos)
│   ├── ProgressDashboard.tsx  # Graphiques et stats
│   ├── WorkoutSummary.tsx # Résumé post-séance + badges
│   └── Navigation.tsx     # Barre de navigation bas
├── hooks/
│   ├── usePushupCounter.ts    # Hook central de comptage (accéléromètre/caméra/tap)
│   ├── useLocalStorage.ts     # Persistance localStorage
│   ├── useWorkoutProgram.ts   # Gestion du programme et des données
│   └── useVibration.ts        # Retour haptique
├── lib/
│   ├── programGenerator.ts    # Génération du programme adaptatif
│   ├── storage.ts             # Logique de sauvegarde et stats
│   ├── motivation.ts          # Messages motivants
│   └── utils.ts               # Utilitaires généraux
└── types/
    └── index.ts               # Types TypeScript partagés
```

## Modes de comptage

| Mode | Comment | Requis |
|------|---------|--------|
| **Accéléromètre** | Téléphone sur le dos/nuque, détecte le mouvement vertical | Permission iOS 13+ |
| **Caméra** | Téléphone au sol, détecte les variations de luminosité | Permission caméra |
| **Tap manuel** | Tape l'écran à chaque pompe | Rien |

## Niveaux

| Niveau | Score test initial |
|--------|-------------------|
| Débutant | < 10 pompes |
| Intermédiaire | 10–25 pompes |
| Avancé | 26–50 pompes |
| Élite | > 50 pompes |

## Roadmap

- [ ] Synchronisation cloud (Supabase)
- [ ] Mode compétition / amis
- [ ] Notifications push (rappels de séance)
- [ ] Export données (CSV/PDF)
- [ ] Détection via ML (pose estimation)
