import { Level } from '@/types'

const repMessages = [
  'Bien !', 'Continue !', 'Super !', 'Encore !', 'Vas-y !',
  'Force !', 'Top !', 'Boom !', 'Ça déchire !', 'Excellent !',
]

const restMessages = [
  'Récupère, tu le mérites.', 'Bonne série !', 'Repose-toi bien.',
  'Souffler pour mieux repartir.', 'Le vrai travail recommence bientôt.',
]

const completionMessages: Record<Level, string[]> = {
  beginner: [
    'Chaque répétition compte. Tu progresses !',
    'Le plus dur, c\'est de commencer. C\'est fait !',
    'Bravo, tu bâtis ta fondation !',
    'La régularité bat la perfection. Continue !',
  ],
  intermediate: [
    'Solide ! Tu bâtis une vraie base.',
    'Tu vas plus loin à chaque séance.',
    'La progression est au rendez-vous !',
    'Ton corps se transforme, séance après séance.',
  ],
  advanced: [
    'Impressionnant. Les 100 pompes sont proches !',
    'Tu es dans le top. Ne lâche pas.',
    'La discipline fait la différence.',
    'Chaque séance te rapproche du but.',
  ],
  elite: [
    'Niveau élite confirmé. Spectaculaire.',
    'Tu redéfinis tes limites à chaque fois.',
    'Excellence. Pur.',
    'Les 100 pompes sont ta norme maintenant.',
  ],
}

const motivationQuotes = [
  { quote: 'Le succès, c\'est tomber sept fois et se relever huit.', author: 'Proverbe japonais' },
  { quote: 'La douleur est temporaire. La fierté est permanente.', author: 'Inconnu' },
  { quote: 'Ne comptez pas les jours, faites que les jours comptent.', author: 'Muhammad Ali' },
  { quote: 'Le corps accomplit ce que l\'esprit ordonne.', author: 'Inconnu' },
  { quote: 'La force ne vient pas d\'une capacité physique, elle vient d\'une volonté indomptable.', author: 'Gandhi' },
  { quote: 'Ce qui ne te tue pas te rend plus fort.', author: 'Nietzsche' },
  { quote: 'Chaque champion a été un jour un débutant.', author: 'Inconnu' },
]

export function getRandomRepMessage(): string {
  return repMessages[Math.floor(Math.random() * repMessages.length)]
}

export function getRandomRestMessage(): string {
  return restMessages[Math.floor(Math.random() * restMessages.length)]
}

export function getCompletionMessage(level: Level): string {
  const msgs = completionMessages[level]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export function getRandomQuote() {
  return motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Lance ton premier streak aujourd\'hui !'
  if (streak === 1) return 'C\'est parti ! Premier jour de streak.'
  if (streak < 7)  return `${streak} jours d'affilée. Continue !`
  if (streak < 30) return `${streak} jours ! Tu es en feu 🔥`
  return `${streak} jours de streak. Légendaire.`
}
