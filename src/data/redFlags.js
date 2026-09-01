export const RED_FLAG_TRIGGERS = [
  {
    key: 'chestPain',
    triggerQuestionIndex: 0, // chief complaint
    keywords: ['chest', 'chest pain', 'chest discomfort', 'सीने', 'सीना', 'छाती'],
    followUp: {
      English: 'Are you also experiencing shortness of breath, sweating, or pain spreading to your arm or jaw?',
      Hindi: 'क्या आपको सांस लेने में तकलीफ, पसीना आना, या दर्द बांह/जबड़े तक फैलना भी महसूस हो रहा है?'
    },
    alert: {
      English: 'Chest pain reported — possible cardiac-pattern symptoms. Flagged for urgent physician review.',
      Hindi: 'सीने में दर्द दर्ज — संभावित हृदय-संबंधी लक्षण। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'breathingDifficulty',
    triggerQuestionIndex: 3, // associated symptoms
    keywords: ['breath', 'breathing', 'breathless', 'सांस लेने', 'साँस लेने'],
    followUp: {
      English: 'How long have you had difficulty breathing, and does it get worse with activity or when lying down?',
      Hindi: 'सांस लेने में तकलीफ कब से है, और क्या यह गतिविधि करने या लेटने पर बढ़ जाती है?'
    },
    alert: {
      English: 'Breathing difficulty reported — flagged for urgent physician review.',
      Hindi: 'सांस लेने में तकलीफ दर्ज — तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'severeSeverity',
    triggerQuestionIndex: 2, // severity 1-10
    keywords: ['9', '10', 'very severe', 'बहुत गंभीर'],
    followUp: {
      English: 'Since this is very severe, is the discomfort constant, or does it come and go?',
      Hindi: 'चूंकि यह बहुत गंभीर है, क्या यह तकलीफ लगातार बनी रहती है या आती-जाती रहती है?'
    },
    alert: {
      English: 'Patient-reported severity is very high (9–10/10) — recommend prioritizing this case.',
      Hindi: 'मरीज़ द्वारा दर्ज गंभीरता बहुत अधिक है (9–10/10) — इस केस को प्राथमिकता देने की सलाह।'
    },
    severity: 'medium'
  }
]

export function detectRedFlagTrigger(questionIndex, answerText, alreadyFiredKeys = []) {
  const text = (answerText || '').toLowerCase()
  if (!text) return null
  return (
    RED_FLAG_TRIGGERS.find(
      (t) =>
        t.triggerQuestionIndex === questionIndex &&
        !alreadyFiredKeys.includes(t.key) &&
        t.keywords.some((kw) => text.includes(kw.toLowerCase()))
    ) || null
  )
}

export function getTriggerByKey(key) {
  return RED_FLAG_TRIGGERS.find((t) => t.key === key) || null
}

