export const RED_FLAG_TRIGGERS = [
  {
    key: 'chestPain',
    triggerQuestionIndex: 0, // chief complaint
    triggerQuestionIndices: [0, 3],
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
    triggerQuestionIndices: [0, 3],
    keywords: ['breath', 'breathing', 'breathless', 'shortness of breath', 'सांस लेने', 'साँस लेने', 'दम फूलना'],
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
    keywords: ['9', '10', 'very severe', 'बहुत गंभीर', 'असहनीय'],
    followUp: {
      English: 'Since this is very severe, is the discomfort constant, or does it come and go?',
      Hindi: 'चूंकि यह बहुत गंभीर है, क्या यह तकलीफ लगातार बनी रहती है या आती-जाती रहती है?'
    },
    alert: {
      English: 'Patient-reported severity is very high (9–10/10) — recommend prioritizing this case.',
      Hindi: 'मरीज़ द्वारा दर्ज गंभीरता बहुत अधिक है (9–10/10) — इस केस को प्राथमिकता देने की सलाह।'
    },
    severity: 'medium'
  },
  {
    key: 'suddenNeurological',
    triggerQuestionIndex: 0,
    triggerQuestionIndices: [0, 3],
    keywords: [
      'weakness', 'numbness', 'slurred', 'slurring', 'speech difficulty',
      'paralysis', 'vision loss', 'cannot walk', 'facial droop',
      'कमजोरी', 'सुन्न', 'लड़खड़ाहट', 'लकवा', 'आँखों के आगे अंधेरा'
    ],
    followUp: {
      English: 'Did the weakness, numbness, speech difficulty, or change in vision start suddenly?',
      Hindi: 'क्या यह कमजोरी, सुन्नता, बोलने में कठिनाई, या देखने में बदलाव अचानक शुरू हुआ था?'
    },
    alert: {
      English: 'Sudden neurological changes or focal weakness reported. Flagged for urgent physician review.',
      Hindi: 'अचानक न्यूरोलॉजिकल बदलाव या कमजोरी दर्ज। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'significantBleeding',
    triggerQuestionIndex: 0,
    triggerQuestionIndices: [0, 3],
    keywords: [
      'bleeding', 'blood', 'hemorrhage', 'vomiting blood', 'blood in stool',
      'coughing blood', 'खून', 'रक्तस्राव', 'खून बह रहा', 'खून की उल्टी'
    ],
    followUp: {
      English: 'Is the bleeding continuing right now, or are you feeling faint or unusually weak?',
      Hindi: 'क्या रक्तस्राव अभी भी जारी है, या आपको बेहोशी/अत्यधिक कमजोरी महसूस हो रही है?'
    },
    alert: {
      English: 'Significant or active bleeding reported. Flagged for urgent physician review.',
      Hindi: 'गंभीर या सक्रिय रक्तस्राव दर्ज। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'severeAbdominal',
    triggerQuestionIndex: 0,
    triggerQuestionIndices: [0, 3],
    keywords: [
      'stomach pain', 'abdominal pain', 'belly pain', 'severe stomach',
      'पेट दर्द', 'पेट में दर्द', 'तेज पेट दर्द'
    ],
    followUp: {
      English: 'Did the abdominal pain start suddenly, and are you having repeated vomiting or worsening pain?',
      Hindi: 'क्या यह पेट दर्द अचानक शुरू हुआ था, और क्या आपको बार-बार उल्टी या बढ़ता हुआ दर्द है?'
    },
    alert: {
      English: 'Severe acute abdominal symptoms reported. Flagged for urgent physician review.',
      Hindi: 'गंभीर पेट दर्द लक्षण दर्ज। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'severeAllergy',
    triggerQuestionIndex: 0,
    triggerQuestionIndices: [0, 3, 6],
    keywords: [
      'allergy', 'allergic', 'reaction', 'lip swelling', 'throat swelling',
      'face swelling', 'एलर्जी', 'गले में सूजन', 'होठों पर सूजन'
    ],
    followUp: {
      English: 'Are you experiencing any swelling in your face, lips, tongue, or throat, or trouble breathing?',
      Hindi: 'क्या आपको चेहरे, होंठ, जीभ, या गले में सूजन या सांस लेने में परेशानी हो रही है?'
    },
    alert: {
      English: 'Possible severe allergic reaction with swelling or airway risk. Flagged for urgent physician review.',
      Hindi: 'संभावित गंभीर एलर्जी प्रतिक्रिया दर्ज (चेहरे/श्वास नली संबंधी)। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  },
  {
    key: 'alteredConsciousness',
    triggerQuestionIndex: 0,
    triggerQuestionIndices: [0, 3],
    keywords: [
      'faint', 'fainted', 'loss of consciousness', 'passed out', 'blackout',
      'confused', 'confusion', 'disoriented', 'unconscious',
      'बेहोश', 'बेहोशी', 'चक्कर खाकर गिर', 'भ्रम'
    ],
    followUp: {
      English: 'Did you completely lose consciousness, or are you currently having trouble staying awake and alert?',
      Hindi: 'क्या आप पूरी तरह बेहोश हो गए थे, या आपको जागते रहने और सचेत रहने में कठिनाई हो रही है?'
    },
    alert: {
      English: 'Altered consciousness, syncope, or acute confusion reported. Flagged for urgent physician review.',
      Hindi: 'बेहोशी, भ्रम या चेतना में बदलाव दर्ज। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।'
    },
    severity: 'high'
  }
]

export function detectRedFlagTrigger(questionIndex, answerText, alreadyFiredKeys = []) {
  const text = (answerText || '').toLowerCase()
  if (!text) return null
  return (
    RED_FLAG_TRIGGERS.find(
      (t) =>
        (t.triggerQuestionIndex === questionIndex ||
          (Array.isArray(t.triggerQuestionIndices) && t.triggerQuestionIndices.includes(questionIndex))) &&
        !alreadyFiredKeys.includes(t.key) &&
        t.keywords.some((kw) => text.includes(kw.toLowerCase()))
    ) || null
  )
}

export function getTriggerByKey(key) {
  return RED_FLAG_TRIGGERS.find((t) => t.key === key) || null
}
