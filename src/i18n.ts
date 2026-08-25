export const languages = [
  ['pt', 'Português'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français'],
  ['de', 'Deutsch'], ['it', 'Italiano'], ['pl', 'Polski'], ['ru', 'Русский'],
  ['tr', 'Türkçe'], ['id', 'Indonesia'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'],
  ['ja', '日本語'], ['ko', '한국어'], ['ar', 'العربية'], ['zh-CN', '简体中文'],
  ['zh-TW', '繁體中文'],
] as const

export type Language = (typeof languages)[number][0]

export type Copy = {
  navHome: string; navRanks: string; navPolls: string; navR4: string; navRules: string; admin: string
  eyebrow: string; heroTitle: string; heroText: string; enterRanks: string; officialGame: string
  alertLabel: string; alertText: string; strength: string; unity: string; discipline: string
  rosterLabel: string; rosterTitle: string; rosterText: string; members: string; updated: string
  combatPower: string; kills: string; weeklyContribution: string; search: string; rank: string; member: string; role: string
  pollsLabel: string; pollsTitle: string; pollsText: string; active: string; votes: string; vote: string
  pollOperation: string; pollTraining: string; rallyCoordination: string; defensiveFormations: string; resourceEfficiency: string
  applyLabel: string; applyTitle: string; applyText: string; selectMember: string; choose: string; reason: string
  reasonHint: string; experience: string; experienceHint: string; availability: string; submit: string
  rulesLabel: string; rulesTitle: string; rulesText: string; ruleItems: string[]
  adminTitle: string; adminText: string; email: string; password: string; login: string; close: string
  footer: string; fanNotice: string; successVote: string; successApply: string; language: string
  portalUnavailable: string; loginRequired: string; inactiveMember: string; signOut: string; signedInAs: string
  adminDashboard: string; createPoll: string; question: string; options: string; closingDate: string; publish: string
  applications: string; approve: string; reject: string; memberAccess: string; activate: string; deactivate: string
  noPolls: string; selectOption: string; duplicateVote: string
}

const en: Copy = {
  navHome: 'Command', navRanks: 'Roster', navPolls: 'Polls', navR4: 'R4 application', navRules: 'Code', admin: 'Admin',
  eyebrow: 'Dark War: Survival Alliance', heroTitle: 'Survive together. Conquer as one.',
  heroText: 'The operational hub of FFF-Spartan: roster performance, alliance decisions and leadership applications in one place.',
  enterRanks: 'View roster', officialGame: 'Official game', alertLabel: 'Alliance directive',
  alertText: 'Shield before reset. Join rallies on time and report extended absences to R4/R5.',
  strength: 'Strength', unity: 'Unity', discipline: 'Discipline', rosterLabel: 'Alliance intelligence',
  rosterTitle: 'FFF-Spartan roster', rosterText: 'Compare member performance by rank and operational metric.',
  members: 'members', updated: 'Updated today', combatPower: 'Combat Power', kills: 'Kills', weeklyContribution: 'Weekly Contribution',
  search: 'Search survivor', rank: 'Rank', member: 'Member', role: 'Role', pollsLabel: 'Collective decisions',
  pollsTitle: 'Active polls', pollsText: 'Only verified alliance members may vote. One response per member.', active: 'Active', votes: 'votes', vote: 'Vote',
  pollOperation: 'Which UTC window should we use for the next alliance operation?', pollTraining: 'What should be our weekly training priority?',
  rallyCoordination: 'Rally coordination', defensiveFormations: 'Defensive formations', resourceEfficiency: 'Resource efficiency',
  applyLabel: 'Leadership pipeline', applyTitle: 'Apply for R4', applyText: 'R4 is a service role. Candidates must be reliable, fair and available during key alliance operations.',
  selectMember: 'Alliance member', choose: 'Choose your name', reason: 'Why do you want to become R4?', reasonHint: 'Explain how you will help the alliance.',
  experience: 'Leadership experience', experienceHint: 'Rallies, events, diplomacy, mentoring or coordination.', availability: 'Usual availability (UTC)', submit: 'Submit application',
  rulesLabel: 'Leadership standard', rulesTitle: 'R4 operating code', rulesText: 'Proposed FFF-Spartan rules, based on alliance-management needs in a survival strategy game. They are not official game rules.',
  ruleItems: ['Protect the alliance first; never use rank for personal retaliation.', 'Apply rules consistently and record warnings before demotion or removal.', 'Coordinate rallies, events, territory and defenses with R5 and other R4 officers.', 'Keep member data, poll results and private discussions confidential.', 'Welcome and mentor new members; communicate clearly across languages.', 'Declare conflicts of interest and abstain from decisions involving close disputes.', 'Remain active, contribute weekly and warn leadership before extended absence.', 'Never promise rewards, promotions or diplomacy without authority.'],
  adminTitle: 'Administration access', adminText: 'Poll creation, roster changes and application review require a protected backend. This screen is the interface preview.',
  email: 'Email', password: 'Password', login: 'Sign in', close: 'Close', footer: 'FFF-Spartan · Alliance community hub',
  fanNotice: 'Unofficial fan community. Not affiliated with or endorsed by Dark War: Survival.', successVote: 'Your vote was recorded in this preview.', successApply: 'Application saved in this preview.', language: 'Language',
  portalUnavailable: 'The secure portal is not configured in this deployment.', loginRequired: 'Sign in as a verified alliance member to continue.',
  inactiveMember: 'Your account is waiting for alliance verification.', signOut: 'Sign out', signedInAs: 'Signed in as', adminDashboard: 'Administration portal',
  createPoll: 'Create poll', question: 'Question', options: 'Options, one per line', closingDate: 'Closing date (optional)', publish: 'Publish',
  applications: 'R4 applications', approve: 'Approve', reject: 'Reject', memberAccess: 'Member access', activate: 'Activate', deactivate: 'Deactivate',
  noPolls: 'There are no active polls.', selectOption: 'Select an option before voting.', duplicateVote: 'You have already voted in this poll.',
}

const pt: Copy = {
  ...en,
  navHome: 'Comando', navRanks: 'Membros', navPolls: 'Votações', navR4: 'Candidatura R4', navRules: 'Código', admin: 'Administração',
  eyebrow: 'Aliança de Dark War: Survival', heroTitle: 'Sobreviver juntos. Conquistar como um só.',
  heroText: 'O centro operacional da FFF-Spartan: desempenho dos membros, decisões da aliança e candidaturas à liderança num único lugar.',
  enterRanks: 'Ver membros', officialGame: 'Jogo oficial', alertLabel: 'Diretiva da aliança',
  alertText: 'Ative o escudo antes do reset. Entre nos rallies a horas e comunique ausências prolongadas aos R4/R5.',
  strength: 'Força', unity: 'União', discipline: 'Disciplina', rosterLabel: 'Inteligência da aliança', rosterTitle: 'Membros FFF-Spartan',
  rosterText: 'Compare o desempenho dos membros por patente e métrica operacional.', members: 'membros', updated: 'Atualizado hoje',
  combatPower: 'Poder de Combate', kills: 'Abates', weeklyContribution: 'Contribuição Semanal', search: 'Pesquisar sobrevivente', rank: 'Posição', member: 'Membro', role: 'Patente',
  pollsLabel: 'Decisões coletivas', pollsTitle: 'Votações ativas', pollsText: 'Apenas membros verificados da aliança podem votar. Uma resposta por membro.', active: 'Ativa', votes: 'votos', vote: 'Votar',
  pollOperation: 'Que horário UTC devemos usar na próxima operação da aliança?', pollTraining: 'Qual deve ser a prioridade do treino semanal?',
  rallyCoordination: 'Coordenação de rallies', defensiveFormations: 'Formações defensivas', resourceEfficiency: 'Eficiência de recursos',
  applyLabel: 'Preparar líderes', applyTitle: 'Candidatura a R4', applyText: 'R4 é uma função de serviço. Os candidatos devem ser fiáveis, imparciais e disponíveis nas operações importantes da aliança.',
  selectMember: 'Membro da aliança', choose: 'Selecione o seu nome', reason: 'Porque pretende tornar-se R4?', reasonHint: 'Explique como irá ajudar a aliança.',
  experience: 'Experiência de liderança', experienceHint: 'Rallies, eventos, diplomacia, mentoria ou coordenação.', availability: 'Disponibilidade habitual (UTC)', submit: 'Enviar candidatura',
  rulesLabel: 'Padrão de liderança', rulesTitle: 'Código operacional R4', rulesText: 'Regras propostas para a FFF-Spartan, baseadas nas necessidades de gestão de uma aliança num jogo de estratégia e sobrevivência. Não são regras oficiais do jogo.',
  ruleItems: ['Proteger primeiro a aliança; nunca usar a patente para retaliação pessoal.', 'Aplicar as regras de forma consistente e registar avisos antes de despromover ou expulsar.', 'Coordenar rallies, eventos, território e defesas com o R5 e os restantes R4.', 'Manter confidenciais os dados dos membros, resultados de votações e conversas privadas.', 'Acolher e orientar novos membros; comunicar com clareza entre idiomas.', 'Declarar conflitos de interesses e abster-se em decisões sobre disputas próximas.', 'Manter atividade e contribuição semanal; avisar a liderança antes de ausências prolongadas.', 'Nunca prometer recompensas, promoções ou diplomacia sem autorização.'],
  adminTitle: 'Acesso de administração', adminText: 'A criação de votações, alterações aos membros e análise de candidaturas exigem um backend protegido. Este ecrã é a pré-visualização da interface.',
  email: 'Email', password: 'Palavra-passe', login: 'Entrar', close: 'Fechar', footer: 'FFF-Spartan · Centro da comunidade da aliança',
  fanNotice: 'Comunidade não oficial de fãs, sem afiliação ou aprovação de Dark War: Survival.', successVote: 'O seu voto foi registado nesta demonstração.', successApply: 'Candidatura guardada nesta demonstração.', language: 'Idioma',
  portalUnavailable: 'O portal seguro ainda não está configurado nesta publicação.', loginRequired: 'Entre como membro verificado da aliança para continuar.',
  inactiveMember: 'A sua conta aguarda validação pela liderança.', signOut: 'Terminar sessão', signedInAs: 'Sessão iniciada como', adminDashboard: 'Portal de administração',
  createPoll: 'Criar votação', question: 'Pergunta', options: 'Opções, uma por linha', closingDate: 'Data de fecho (opcional)', publish: 'Publicar',
  applications: 'Candidaturas R4', approve: 'Aprovar', reject: 'Rejeitar', memberAccess: 'Acesso dos membros', activate: 'Ativar', deactivate: 'Desativar',
  noPolls: 'Não existem votações ativas.', selectOption: 'Selecione uma opção antes de votar.', duplicateVote: 'Já votou nesta votação.',
}

const translated: Record<Exclude<Language, 'en' | 'pt'>, Partial<Copy>> = {
  es: { navHome:'Mando',navRanks:'Miembros',navPolls:'Encuestas',navR4:'Solicitud R4',navRules:'Código',admin:'Administración',heroTitle:'Sobrevivir juntos. Conquistar como uno.',heroText:'El centro operativo de FFF-Spartan: rendimiento, decisiones y solicitudes de liderazgo.',enterRanks:'Ver miembros',officialGame:'Juego oficial',combatPower:'Poder de combate',kills:'Bajas',weeklyContribution:'Contribución semanal',search:'Buscar superviviente',pollsTitle:'Encuestas activas',applyTitle:'Solicitar R4',submit:'Enviar solicitud',language:'Idioma' },
  fr: { navHome:'Commandement',navRanks:'Membres',navPolls:'Sondages',navR4:'Candidature R4',navRules:'Code',admin:'Administration',heroTitle:'Survivre ensemble. Conquérir unis.',heroText:'Le centre opérationnel FFF-Spartan : performances, décisions et candidatures.',enterRanks:'Voir les membres',officialGame:'Jeu officiel',combatPower:'Puissance de combat',kills:'Éliminations',weeklyContribution:'Contribution hebdomadaire',search:'Rechercher un survivant',pollsTitle:'Sondages actifs',applyTitle:'Candidature R4',submit:'Envoyer la candidature',language:'Langue' },
  de: { navHome:'Kommando',navRanks:'Mitglieder',navPolls:'Umfragen',navR4:'R4-Bewerbung',navRules:'Kodex',admin:'Verwaltung',heroTitle:'Gemeinsam überleben. Vereint siegen.',heroText:'Die Einsatzzentrale von FFF-Spartan: Leistung, Entscheidungen und Führungsbewerbungen.',enterRanks:'Mitglieder ansehen',officialGame:'Offizielles Spiel',combatPower:'Kampfkraft',kills:'Abschüsse',weeklyContribution:'Wöchentlicher Beitrag',search:'Überlebenden suchen',pollsTitle:'Aktive Umfragen',applyTitle:'Als R4 bewerben',submit:'Bewerbung senden',language:'Sprache' },
  it: { navHome:'Comando',navRanks:'Membri',navPolls:'Sondaggi',navR4:'Candidatura R4',navRules:'Codice',admin:'Amministrazione',heroTitle:'Sopravvivere insieme. Conquistare uniti.',heroText:'Il centro operativo FFF-Spartan: prestazioni, decisioni e candidature.',enterRanks:'Vedi membri',officialGame:'Gioco ufficiale',combatPower:'Potere di combattimento',kills:'Uccisioni',weeklyContribution:'Contributo settimanale',search:'Cerca sopravvissuto',pollsTitle:'Sondaggi attivi',applyTitle:'Candidatura R4',submit:'Invia candidatura',language:'Lingua' },
  pl: { navHome:'Dowództwo',navRanks:'Członkowie',navPolls:'Ankiety',navR4:'Podanie R4',navRules:'Kodeks',admin:'Administracja',heroTitle:'Przetrwajmy razem. Zwyciężajmy jako jedność.',enterRanks:'Zobacz członków',officialGame:'Oficjalna gra',combatPower:'Siła bojowa',kills:'Zabójstwa',weeklyContribution:'Wkład tygodniowy',search:'Szukaj ocalałego',pollsTitle:'Aktywne ankiety',applyTitle:'Zgłoś się na R4',submit:'Wyślij podanie',language:'Język' },
  ru: { navHome:'Штаб',navRanks:'Участники',navPolls:'Опросы',navR4:'Заявка R4',navRules:'Кодекс',admin:'Управление',heroTitle:'Выживаем вместе. Побеждаем как один.',enterRanks:'Состав альянса',officialGame:'Официальная игра',combatPower:'Боевая мощь',kills:'Убийства',weeklyContribution:'Недельный вклад',search:'Найти выжившего',pollsTitle:'Активные опросы',applyTitle:'Заявка на R4',submit:'Отправить заявку',language:'Язык' },
  tr: { navHome:'Komuta',navRanks:'Üyeler',navPolls:'Anketler',navR4:'R4 Başvurusu',navRules:'Kurallar',admin:'Yönetim',heroTitle:'Birlikte hayatta kal. Tek yürek fethet.',enterRanks:'Üyeleri gör',officialGame:'Resmî oyun',combatPower:'Savaş Gücü',kills:'Öldürmeler',weeklyContribution:'Haftalık Katkı',search:'Hayatta kalan ara',pollsTitle:'Aktif anketler',applyTitle:'R4 için başvur',submit:'Başvuruyu gönder',language:'Dil' },
  id: { navHome:'Komando',navRanks:'Anggota',navPolls:'Polling',navR4:'Lamaran R4',navRules:'Kode',admin:'Admin',heroTitle:'Bertahan bersama. Menaklukkan sebagai satu.',enterRanks:'Lihat anggota',officialGame:'Game resmi',combatPower:'Kekuatan Tempur',kills:'Eliminasi',weeklyContribution:'Kontribusi Mingguan',search:'Cari penyintas',pollsTitle:'Polling aktif',applyTitle:'Daftar R4',submit:'Kirim lamaran',language:'Bahasa' },
  vi: { navHome:'Chỉ huy',navRanks:'Thành viên',navPolls:'Bình chọn',navR4:'Ứng tuyển R4',navRules:'Quy tắc',admin:'Quản trị',heroTitle:'Cùng sinh tồn. Đồng lòng chinh phục.',enterRanks:'Xem thành viên',officialGame:'Trò chơi chính thức',combatPower:'Lực chiến',kills:'Tiêu diệt',weeklyContribution:'Cống hiến tuần',search:'Tìm người sống sót',pollsTitle:'Bình chọn đang mở',applyTitle:'Ứng tuyển R4',submit:'Gửi đơn',language:'Ngôn ngữ' },
  th: { navHome:'กองบัญชาการ',navRanks:'สมาชิก',navPolls:'โหวต',navR4:'สมัคร R4',navRules:'กฎ',admin:'ผู้ดูแล',heroTitle:'เอาชีวิตรอดร่วมกัน พิชิตเป็นหนึ่งเดียว',enterRanks:'ดูสมาชิก',officialGame:'เกมอย่างเป็นทางการ',combatPower:'พลังรบ',kills:'สังหาร',weeklyContribution:'ผลงานรายสัปดาห์',search:'ค้นหาผู้รอดชีวิต',pollsTitle:'การโหวตที่เปิดอยู่',applyTitle:'สมัครเป็น R4',submit:'ส่งใบสมัคร',language:'ภาษา' },
  ja: { navHome:'司令部',navRanks:'メンバー',navPolls:'投票',navR4:'R4申請',navRules:'規範',admin:'管理',heroTitle:'共に生き残り、一つになって征服する。',enterRanks:'メンバーを見る',officialGame:'公式ゲーム',combatPower:'戦闘力',kills:'撃破数',weeklyContribution:'週間貢献',search:'生存者を検索',pollsTitle:'実施中の投票',applyTitle:'R4に申請',submit:'申請を送信',language:'言語' },
  ko: { navHome:'지휘부',navRanks:'연맹원',navPolls:'투표',navR4:'R4 지원',navRules:'규정',admin:'관리',heroTitle:'함께 생존하고 하나로 정복하라.',enterRanks:'연맹원 보기',officialGame:'공식 게임',combatPower:'전투력',kills:'처치',weeklyContribution:'주간 공헌',search:'생존자 검색',pollsTitle:'진행 중인 투표',applyTitle:'R4 지원',submit:'지원서 제출',language:'언어' },
  ar: { navHome:'القيادة',navRanks:'الأعضاء',navPolls:'التصويت',navR4:'طلب R4',navRules:'القواعد',admin:'الإدارة',heroTitle:'ننجو معًا. وننتصر كفريق واحد.',enterRanks:'عرض الأعضاء',officialGame:'اللعبة الرسمية',combatPower:'قوة القتال',kills:'الإقصاءات',weeklyContribution:'المساهمة الأسبوعية',search:'ابحث عن ناجٍ',pollsTitle:'التصويتات النشطة',applyTitle:'التقدم إلى R4',submit:'إرسال الطلب',language:'اللغة' },
  'zh-CN': { navHome:'指挥部',navRanks:'成员',navPolls:'投票',navR4:'R4申请',navRules:'准则',admin:'管理',heroTitle:'共同生存，同心征服。',enterRanks:'查看成员',officialGame:'官方网站',combatPower:'战斗力',kills:'击杀',weeklyContribution:'每周贡献',search:'搜索幸存者',pollsTitle:'进行中的投票',applyTitle:'申请R4',submit:'提交申请',language:'语言' },
  'zh-TW': { navHome:'指揮部',navRanks:'成員',navPolls:'投票',navR4:'R4申請',navRules:'準則',admin:'管理',heroTitle:'共同生存，同心征服。',enterRanks:'查看成員',officialGame:'官方網站',combatPower:'戰鬥力',kills:'擊殺',weeklyContribution:'每週貢獻',search:'搜尋倖存者',pollsTitle:'進行中的投票',applyTitle:'申請R4',submit:'提交申請',language:'語言' },
}

export function getCopy(language: Language): Copy {
  if (language === 'pt') return pt
  if (language === 'en') return en
  return { ...en, ...translated[language] }
}
