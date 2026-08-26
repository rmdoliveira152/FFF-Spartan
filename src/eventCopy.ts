import type { Language } from './i18n'

export type EventGuideItem = {
  title: string
  summary: string
  objective: string
  strategy: string
  image: string
}

export type EventGuideCopy = {
  navEvents: string
  eventsLabel: string
  eventsTitle: string
  eventsIntro: string
  eventObjective: string
  eventStrategy: string
  eventItems: EventGuideItem[]
}

const images = ['black-gold.jpg', 'biochemical-monster.jpg', 'build-shelter.jpg', 'alliance-duel.jpg']
const items = (content: Omit<EventGuideItem, 'image'>[]) => content.map((item, index) => ({ ...item, image: images[index] }))

export const eventGuideCopy: Record<Language, EventGuideCopy> = {
  en: {
    navEvents: 'Events', eventsLabel: 'Field manual', eventsTitle: 'Main events', eventsIntro: 'Objectives, essential rules and alliance tactics for the four core activities.', eventObjective: 'Objective', eventStrategy: 'Alliance plan',
    eventItems: items([
      { title: 'Black Gold Battlefield', summary: 'Two alliances fight for facilities, rare-earth transport and continuous control points. The alliance with the most points at the end wins.', objective: 'Capture and hold strategic facilities, protect resource routes and score through combat.', strategy: 'Assign attack, defence and transport squads. Prioritise the Rare Earth Factory and regroup before counterattacks.' },
      { title: 'Biochemical Monster', summary: 'R4/R5 summons Frankenstein for coordinated rallies. Each round has a limited attack window and the second opening must be scheduled 42 minutes later.', objective: 'Maximise collective damage through organised rallies without spending energy.', strategy: 'Publish both times early, position rally leaders near the target and fill the strongest rallies first.' },
      { title: 'Build a Shelter', summary: 'Daily preparation themes award points, medals and ranking rewards. The activity and opponent group reset at 00:00.', objective: 'Complete each day’s themed tasks and collect enough medals for preparation rewards.', strategy: 'Check the calendar in advance and save hero, troop, research and equipment resources for the matching day.' },
      { title: 'Alliance Duel', summary: 'A multi-day seasonal confrontation where each day rewards a different development or combat activity.', objective: 'Beat the opposing alliance in daily points and qualify for weekly and seasonal rewards.', strategy: 'Announce the daily theme at reset, stockpile resources beforehand and avoid spending heavily on a day that cannot be won.' },
    ]),
  },
  pt: {
    navEvents: 'Eventos', eventsLabel: 'Manual de campo', eventsTitle: 'Eventos principais', eventsIntro: 'Objetivos, regras essenciais e táticas da aliança para as quatro atividades principais.', eventObjective: 'Objetivo', eventStrategy: 'Plano da aliança',
    eventItems: items([
      { title: 'Campo de Batalha do Ouro Negro', summary: 'Duas alianças disputam instalações, transporte de terra rara e pontos contínuos de ocupação. Vence a aliança com mais pontos no final.', objective: 'Capturar e manter instalações estratégicas, proteger rotas de recursos e pontuar em combate.', strategy: 'Definir equipas de ataque, defesa e transporte. Priorizar a Fábrica de Terra Rara e reagrupar antes dos contra-ataques.' },
      { title: 'Monstro Bioquímico', summary: 'R4/R5 invoca Frankenstein para rallies coordenados. Cada ronda tem uma janela limitada e a segunda abertura deve ser marcada 42 minutos depois.', objective: 'Maximizar o dano coletivo através de rallies organizados, sem gastar energia.', strategy: 'Publicar os dois horários cedo, posicionar os líderes perto do alvo e preencher primeiro os rallies mais fortes.' },
      { title: 'Construa um Abrigo', summary: 'Temas diários de preparação atribuem pontos, medalhas e recompensas de ranking. A atividade e o grupo adversário reiniciam às 00:00.', objective: 'Concluir as tarefas temáticas do dia e reunir medalhas suficientes para as recompensas de preparação.', strategy: 'Consultar o calendário e guardar recursos de heróis, tropas, investigação e equipamento para o dia correspondente.' },
      { title: 'Duelo da Aliança', summary: 'Confronto sazonal de vários dias em que cada dia recompensa uma atividade diferente de desenvolvimento ou combate.', objective: 'Superar a aliança adversária nos pontos diários e qualificar-se para recompensas semanais e sazonais.', strategy: 'Anunciar o tema no reset, acumular recursos antecipadamente e evitar gastos elevados num dia que já não pode ser ganho.' },
    ]),
  },
  es: {
    navEvents: 'Eventos', eventsLabel: 'Manual de campo', eventsTitle: 'Eventos principales', eventsIntro: 'Objetivos, reglas esenciales y tácticas de alianza para las cuatro actividades principales.', eventObjective: 'Objetivo', eventStrategy: 'Plan de alianza',
    eventItems: items([
      { title: 'Campo de Batalla del Oro Negro', summary: 'Dos alianzas luchan por instalaciones, transporte de tierras raras y puntos continuos de ocupación.', objective: 'Capturar instalaciones, proteger rutas y sumar puntos de combate.', strategy: 'Asignar grupos de ataque, defensa y transporte. Priorizar la Fábrica de Tierras Raras.' },
      { title: 'Monstruo Bioquímico', summary: 'R4/R5 invoca a Frankenstein para rallies coordinados; la segunda ronda debe programarse 42 minutos después.', objective: 'Maximizar el daño colectivo sin gastar energía.', strategy: 'Publicar ambos horarios, acercar a los líderes y llenar primero los rallies más fuertes.' },
      { title: 'Construye un Refugio', summary: 'Temas diarios otorgan puntos, medallas y recompensas; la actividad se reinicia a las 00:00.', objective: 'Completar tareas temáticas y reunir medallas.', strategy: 'Consultar el calendario y guardar recursos para el día correspondiente.' },
      { title: 'Duelo de Alianzas', summary: 'Confrontación estacional de varios días con un tema distinto cada jornada.', objective: 'Superar al rival en puntos diarios y obtener recompensas.', strategy: 'Anunciar el tema al reinicio, acumular recursos y evitar gastos inútiles.' },
    ]),
  },
  fr: {
    navEvents: 'Événements', eventsLabel: 'Manuel de terrain', eventsTitle: 'Événements principaux', eventsIntro: 'Objectifs, règles essentielles et tactiques d’alliance pour les quatre activités majeures.', eventObjective: 'Objectif', eventStrategy: 'Plan d’alliance',
    eventItems: items([
      { title: 'Champ de bataille de l’Or noir', summary: 'Deux alliances se disputent des installations, le transport de terres rares et des points d’occupation continus.', objective: 'Capturer les installations, protéger les routes et marquer au combat.', strategy: 'Former des groupes d’attaque, de défense et de transport. Prioriser l’Usine de terres rares.' },
      { title: 'Monstre biochimique', summary: 'R4/R5 invoque Frankenstein pour des rally coordonnés; la seconde manche doit être programmée 42 minutes plus tard.', objective: 'Maximiser les dégâts collectifs sans dépenser d’énergie.', strategy: 'Publier les deux horaires et remplir d’abord les rally les plus puissants.' },
      { title: 'Construire un abri', summary: 'Des thèmes quotidiens donnent points, médailles et récompenses; réinitialisation à 00:00.', objective: 'Terminer les tâches du jour et réunir les médailles.', strategy: 'Consulter le calendrier et conserver les ressources pour le bon jour.' },
      { title: 'Duel d’alliance', summary: 'Affrontement saisonnier sur plusieurs jours avec un thème différent chaque jour.', objective: 'Battre l’alliance adverse aux points quotidiens.', strategy: 'Annoncer le thème au reset, stocker les ressources et limiter les dépenses inutiles.' },
    ]),
  },
  de: {
    navEvents: 'Events', eventsLabel: 'Feldhandbuch', eventsTitle: 'Hauptereignisse', eventsIntro: 'Ziele, wichtige Regeln und Allianz-Taktiken für die vier Hauptaktivitäten.', eventObjective: 'Ziel', eventStrategy: 'Allianzplan',
    eventItems: items([
      { title: 'Schlachtfeld des Schwarzen Goldes', summary: 'Zwei Allianzen kämpfen um Anlagen, Seltene-Erden-Transporte und laufende Besetzungspunkte.', objective: 'Anlagen halten, Routen schützen und im Kampf punkten.', strategy: 'Angriff, Verteidigung und Transport aufteilen. Die Seltene-Erden-Fabrik priorisieren.' },
      { title: 'Biochemisches Monster', summary: 'R4/R5 beschwört Frankenstein für koordinierte Rallys; Runde zwei muss 42 Minuten später angesetzt werden.', objective: 'Gemeinsamen Schaden ohne Energieverbrauch maximieren.', strategy: 'Beide Zeiten ankündigen und zuerst die stärksten Rallys füllen.' },
      { title: 'Baue einen Unterschlupf', summary: 'Tägliche Themen bringen Punkte, Medaillen und Rangbelohnungen; Reset um 00:00.', objective: 'Tagesthemen abschließen und Medaillen sammeln.', strategy: 'Kalender prüfen und passende Ressourcen zurückhalten.' },
      { title: 'Allianzduell', summary: 'Mehrtägiger Saisonkampf mit einem anderen Entwicklungs- oder Kampfthema pro Tag.', objective: 'Die gegnerische Allianz täglich übertreffen.', strategy: 'Thema beim Reset melden, Ressourcen ansparen und unnötige Ausgaben vermeiden.' },
    ]),
  },
  it: {
    navEvents: 'Eventi', eventsLabel: 'Manuale operativo', eventsTitle: 'Eventi principali', eventsIntro: 'Obiettivi, regole essenziali e tattiche dell’alleanza per le quattro attività principali.', eventObjective: 'Obiettivo', eventStrategy: 'Piano alleanza',
    eventItems: items([
      { title: 'Campo di battaglia dell’Oro Nero', summary: 'Due alleanze competono per strutture, trasporto di terre rare e punti di occupazione.', objective: 'Conquistare strutture, proteggere le rotte e fare punti in combattimento.', strategy: 'Dividere attacco, difesa e trasporto. Dare priorità alla Fabbrica di Terre Rare.' },
      { title: 'Mostro biochimico', summary: 'R4/R5 evoca Frankenstein per rally coordinati; il secondo round va fissato 42 minuti dopo.', objective: 'Massimizzare il danno collettivo senza energia.', strategy: 'Pubblicare entrambi gli orari e riempire prima i rally più forti.' },
      { title: 'Costruisci un rifugio', summary: 'Temi giornalieri assegnano punti, medaglie e ricompense; reset alle 00:00.', objective: 'Completare i compiti del giorno e raccogliere medaglie.', strategy: 'Controllare il calendario e conservare le risorse adatte.' },
      { title: 'Duello dell’alleanza', summary: 'Sfida stagionale di più giorni con un tema diverso ogni giorno.', objective: 'Superare l’alleanza avversaria nei punti giornalieri.', strategy: 'Annunciare il tema al reset, accumulare risorse ed evitare spese inutili.' },
    ]),
  },
  pl: {
    navEvents: 'Wydarzenia', eventsLabel: 'Podręcznik polowy', eventsTitle: 'Główne wydarzenia', eventsIntro: 'Cele, najważniejsze zasady i taktyka sojuszu dla czterech głównych aktywności.', eventObjective: 'Cel', eventStrategy: 'Plan sojuszu',
    eventItems: items([
      { title: 'Pole bitwy Czarnego Złota', summary: 'Dwa sojusze walczą o obiekty, transport metali ziem rzadkich i punkty okupacji.', objective: 'Przejmować obiekty, chronić trasy i zdobywać punkty w walce.', strategy: 'Podzielić atak, obronę i transport. Priorytetem jest Fabryka Ziem Rzadkich.' },
      { title: 'Potwór biochemiczny', summary: 'R4/R5 przywołuje Frankensteina do wspólnych rally; druga runda musi ruszyć 42 minuty później.', objective: 'Maksymalizować wspólne obrażenia bez energii.', strategy: 'Podać oba terminy i najpierw zapełniać najsilniejsze rally.' },
      { title: 'Zbuduj schronienie', summary: 'Codzienne tematy dają punkty, medale i nagrody; reset o 00:00.', objective: 'Wykonywać zadania dnia i zbierać medale.', strategy: 'Sprawdzać kalendarz i zachować właściwe zasoby.' },
      { title: 'Pojedynek sojuszy', summary: 'Wielodniowe starcie sezonowe z innym tematem każdego dnia.', objective: 'Pokonać przeciwnika w dziennych punktach.', strategy: 'Ogłaszać temat po resecie, gromadzić zasoby i unikać zbędnych wydatków.' },
    ]),
  },
  ru: {
    navEvents: 'События', eventsLabel: 'Полевое руководство', eventsTitle: 'Главные события', eventsIntro: 'Цели, основные правила и тактика альянса для четырёх главных активностей.', eventObjective: 'Цель', eventStrategy: 'План альянса',
    eventItems: items([
      { title: 'Поле битвы Чёрного золота', summary: 'Два альянса борются за объекты, перевозку редкоземельных ресурсов и очки удержания.', objective: 'Захватывать объекты, защищать маршруты и получать очки в бою.', strategy: 'Разделить атаку, защиту и перевозку. Главная цель — фабрика редких земель.' },
      { title: 'Биохимический монстр', summary: 'R4/R5 вызывает Франкенштейна для общих rally; второй раунд назначается через 42 минуты.', objective: 'Максимизировать общий урон без затрат энергии.', strategy: 'Сообщить оба времени и сначала заполнять сильнейшие rally.' },
      { title: 'Постройте убежище', summary: 'Ежедневные темы дают очки, медали и награды; сброс в 00:00.', objective: 'Выполнять задания дня и собирать медали.', strategy: 'Проверять календарь и сохранять нужные ресурсы.' },
      { title: 'Дуэль альянсов', summary: 'Многодневное сезонное противостояние с новой темой каждый день.', objective: 'Обойти соперника по ежедневным очкам.', strategy: 'Объявлять тему после сброса, копить ресурсы и не тратить их впустую.' },
    ]),
  },
  tr: {
    navEvents: 'Etkinlikler', eventsLabel: 'Saha kılavuzu', eventsTitle: 'Ana etkinlikler', eventsIntro: 'Dört ana etkinlik için hedefler, temel kurallar ve ittifak taktikleri.', eventObjective: 'Hedef', eventStrategy: 'İttifak planı',
    eventItems: items([
      { title: 'Kara Altın Savaş Alanı', summary: 'İki ittifak tesisler, nadir toprak taşımaları ve sürekli işgal puanları için savaşır.', objective: 'Tesisleri ele geçir, rotaları koru ve savaş puanı kazan.', strategy: 'Saldırı, savunma ve taşıma ekipleri kur. Nadir Toprak Fabrikasına öncelik ver.' },
      { title: 'Biyokimyasal Canavar', summary: 'R4/R5 ortak rally için Frankenstein çağırır; ikinci tur 42 dakika sonra planlanmalıdır.', objective: 'Enerji harcamadan ortak hasarı artır.', strategy: 'İki saati de duyur ve en güçlü rallyleri önce doldur.' },
      { title: 'Bir Sığınak İnşa Et', summary: 'Günlük temalar puan, madalya ve sıralama ödülü verir; 00:00’da sıfırlanır.', objective: 'Günün görevlerini tamamla ve madalya topla.', strategy: 'Takvimi kontrol et ve doğru kaynakları sakla.' },
      { title: 'İttifak Düellosu', summary: 'Her gün farklı temaya sahip çok günlük sezonluk karşılaşma.', objective: 'Günlük puanlarda rakip ittifakı geç.', strategy: 'Temayı sıfırlamada duyur, kaynak biriktir ve gereksiz harcamadan kaçın.' },
    ]),
  },
  id: {
    navEvents: 'Event', eventsLabel: 'Panduan lapangan', eventsTitle: 'Event utama', eventsIntro: 'Tujuan, aturan penting, dan taktik aliansi untuk empat aktivitas utama.', eventObjective: 'Tujuan', eventStrategy: 'Rencana aliansi',
    eventItems: items([
      { title: 'Medan Perang Emas Hitam', summary: 'Dua aliansi memperebutkan fasilitas, pengangkutan tanah jarang, dan poin pendudukan.', objective: 'Kuasai fasilitas, lindungi rute, dan raih poin tempur.', strategy: 'Bagi tim serang, bertahan, dan angkut. Utamakan Pabrik Tanah Jarang.' },
      { title: 'Monster Biokimia', summary: 'R4/R5 memanggil Frankenstein untuk rally; ronde kedua dijadwalkan 42 menit kemudian.', objective: 'Maksimalkan kerusakan bersama tanpa energi.', strategy: 'Umumkan kedua waktu dan isi rally terkuat lebih dulu.' },
      { title: 'Bangun Perlindungan', summary: 'Tema harian memberi poin, medali, dan hadiah; reset pukul 00:00.', objective: 'Selesaikan tugas harian dan kumpulkan medali.', strategy: 'Periksa kalender dan simpan sumber daya yang sesuai.' },
      { title: 'Duel Aliansi', summary: 'Pertarungan musiman beberapa hari dengan tema berbeda setiap hari.', objective: 'Kalahkan aliansi lawan dalam poin harian.', strategy: 'Umumkan tema saat reset, kumpulkan sumber daya, dan hindari pengeluaran sia-sia.' },
    ]),
  },
  vi: {
    navEvents: 'Sự kiện', eventsLabel: 'Cẩm nang chiến trường', eventsTitle: 'Sự kiện chính', eventsIntro: 'Mục tiêu, quy tắc thiết yếu và chiến thuật liên minh cho bốn hoạt động chính.', eventObjective: 'Mục tiêu', eventStrategy: 'Kế hoạch liên minh',
    eventItems: items([
      { title: 'Chiến trường Vàng Đen', summary: 'Hai liên minh tranh giành cơ sở, vận chuyển đất hiếm và điểm chiếm đóng liên tục.', objective: 'Chiếm cơ sở, bảo vệ tuyến đường và ghi điểm chiến đấu.', strategy: 'Chia đội tấn công, phòng thủ và vận chuyển. Ưu tiên Nhà máy Đất hiếm.' },
      { title: 'Quái vật Sinh hóa', summary: 'R4/R5 triệu hồi Frankenstein cho rally; vòng hai phải lên lịch sau 42 phút.', objective: 'Tối đa sát thương tập thể mà không tốn năng lượng.', strategy: 'Thông báo cả hai giờ và lấp đầy rally mạnh nhất trước.' },
      { title: 'Xây dựng Nơi trú ẩn', summary: 'Chủ đề hàng ngày cho điểm, huy chương và phần thưởng; đặt lại lúc 00:00.', objective: 'Hoàn thành nhiệm vụ ngày và thu thập huy chương.', strategy: 'Xem lịch và giữ tài nguyên phù hợp.' },
      { title: 'Đấu Liên minh', summary: 'Đối đầu theo mùa nhiều ngày với chủ đề khác nhau mỗi ngày.', objective: 'Vượt liên minh đối thủ về điểm hàng ngày.', strategy: 'Thông báo chủ đề khi đặt lại, tích trữ tài nguyên và tránh chi tiêu lãng phí.' },
    ]),
  },
  th: {
    navEvents: 'กิจกรรม', eventsLabel: 'คู่มือสนาม', eventsTitle: 'กิจกรรมหลัก', eventsIntro: 'เป้าหมาย กฎสำคัญ และกลยุทธ์พันธมิตรสำหรับกิจกรรมหลักทั้งสี่', eventObjective: 'เป้าหมาย', eventStrategy: 'แผนพันธมิตร',
    eventItems: items([
      { title: 'สนามรบทองคำดำ', summary: 'สองพันธมิตรแย่งชิงสิ่งปลูกสร้าง การขนส่งแร่หายาก และคะแนนยึดครอง', objective: 'ยึดสิ่งปลูกสร้าง ป้องกันเส้นทาง และทำคะแนนการต่อสู้', strategy: 'แบ่งทีมโจมตี ป้องกัน และขนส่ง โดยให้โรงงานแร่หายากมาก่อน' },
      { title: 'สัตว์ประหลาดชีวเคมี', summary: 'R4/R5 เรียก Frankenstein เพื่อ rally และรอบสองต้องกำหนดหลัง 42 นาที', objective: 'เพิ่มความเสียหายรวมโดยไม่ใช้พลังงาน', strategy: 'ประกาศเวลาทั้งสองและเติม rally ที่แข็งแกร่งก่อน' },
      { title: 'สร้างที่พักพิง', summary: 'ธีมรายวันให้คะแนน เหรียญ และรางวัล โดยรีเซ็ตเวลา 00:00', objective: 'ทำภารกิจประจำวันและเก็บเหรียญ', strategy: 'ตรวจปฏิทินและเก็บทรัพยากรให้ตรงวัน' },
      { title: 'ดวลพันธมิตร', summary: 'การแข่งขันตามฤดูกาลหลายวัน โดยแต่ละวันมีธีมต่างกัน', objective: 'ทำคะแนนรายวันให้มากกว่าพันธมิตรคู่แข่ง', strategy: 'ประกาศธีมเมื่อรีเซ็ต สะสมทรัพยากร และหลีกเลี่ยงการใช้จ่ายเปล่า' },
    ]),
  },
  ja: {
    navEvents: 'イベント', eventsLabel: 'フィールドマニュアル', eventsTitle: '主要イベント', eventsIntro: '4つの主要活動の目的、重要ルール、同盟戦術。', eventObjective: '目的', eventStrategy: '同盟計画',
    eventItems: items([
      { title: 'ブラックゴールド戦場', summary: '2つの同盟が施設、レアアース輸送、継続占領ポイントを争います。', objective: '施設を占領し、輸送路を守り、戦闘で得点する。', strategy: '攻撃・防衛・輸送班を編成し、レアアース工場を最優先する。' },
      { title: '生化学モンスター', summary: 'R4/R5がrally用にフランケンシュタインを召喚。第2ラウンドは42分後に設定します。', objective: 'エネルギーを使わず総ダメージを最大化する。', strategy: '両方の時刻を告知し、強いrallyから埋める。' },
      { title: 'シェルター建設', summary: '日替わりテーマでポイント、メダル、順位報酬を獲得。00:00にリセット。', objective: '当日の課題を完了しメダルを集める。', strategy: '予定表を確認し、該当資源を温存する。' },
      { title: '同盟決闘', summary: '毎日異なるテーマで競う複数日のシーズン対戦。', objective: '日次ポイントで相手同盟を上回る。', strategy: 'リセット時にテーマを告知し、資源を備蓄して無駄遣いを避ける。' },
    ]),
  },
  ko: {
    navEvents: '이벤트', eventsLabel: '현장 안내서', eventsTitle: '주요 이벤트', eventsIntro: '네 가지 핵심 활동의 목표, 필수 규칙 및 연맹 전술입니다.', eventObjective: '목표', eventStrategy: '연맹 계획',
    eventItems: items([
      { title: '블랙 골드 전장', summary: '두 연맹이 시설, 희토류 운송, 지속 점령 점수를 두고 경쟁합니다.', objective: '시설을 점령하고 경로를 보호하며 전투 점수를 얻습니다.', strategy: '공격, 방어, 운송팀을 나누고 희토류 공장을 우선합니다.' },
      { title: '생화학 몬스터', summary: 'R4/R5가 rally를 위해 프랑켄슈타인을 소환하며 2라운드는 42분 뒤에 예약합니다.', objective: '에너지 없이 연맹 총 피해를 극대화합니다.', strategy: '두 시간을 공지하고 강한 rally부터 채웁니다.' },
      { title: '대피소 건설', summary: '일일 테마로 점수, 메달, 순위 보상을 얻으며 00:00에 초기화됩니다.', objective: '당일 과제를 완료하고 메달을 모읍니다.', strategy: '달력을 확인하고 해당 자원을 보관합니다.' },
      { title: '연맹 결투', summary: '매일 다른 테마로 진행되는 여러 날의 시즌 대결입니다.', objective: '일일 점수에서 상대 연맹을 이깁니다.', strategy: '리셋 때 테마를 알리고 자원을 비축하며 불필요한 소비를 피합니다.' },
    ]),
  },
  ar: {
    navEvents: 'الفعاليات', eventsLabel: 'الدليل الميداني', eventsTitle: 'الفعاليات الرئيسية', eventsIntro: 'الأهداف والقواعد الأساسية وخطط التحالف للأنشطة الأربعة الرئيسية.', eventObjective: 'الهدف', eventStrategy: 'خطة التحالف',
    eventItems: items([
      { title: 'ساحة معركة الذهب الأسود', summary: 'يتنافس تحالفان على المنشآت ونقل العناصر النادرة ونقاط السيطرة المستمرة.', objective: 'السيطرة على المنشآت وحماية الطرق وكسب نقاط القتال.', strategy: 'قسّم فرق الهجوم والدفاع والنقل وأعط الأولوية لمصنع العناصر النادرة.' },
      { title: 'الوحش الكيميائي الحيوي', summary: 'يستدعي R4/R5 فرانكنشتاين لتجمعات rally وتُجدول الجولة الثانية بعد 42 دقيقة.', objective: 'زيادة الضرر الجماعي دون استهلاك الطاقة.', strategy: 'أعلن الموعدين واملأ أقوى rally أولاً.' },
      { title: 'ابنِ ملجأ', summary: 'تمنح المواضيع اليومية نقاطاً وميداليات ومكافآت ويعاد الضبط عند 00:00.', objective: 'أكمل مهام اليوم واجمع الميداليات.', strategy: 'راجع التقويم واحتفظ بالموارد المناسبة.' },
      { title: 'مبارزة التحالف', summary: 'مواجهة موسمية لعدة أيام بموضوع مختلف كل يوم.', objective: 'تجاوز التحالف الخصم في النقاط اليومية.', strategy: 'أعلن الموضوع عند إعادة الضبط وخزّن الموارد وتجنب الإنفاق غير المفيد.' },
    ]),
  },
  'zh-CN': {
    navEvents: '活动', eventsLabel: '战地手册', eventsTitle: '主要活动', eventsIntro: '四项核心活动的目标、关键规则和联盟战术。', eventObjective: '目标', eventStrategy: '联盟计划',
    eventItems: items([
      { title: '黑金战场', summary: '两个联盟争夺设施、稀土运输和持续占领积分。', objective: '占领设施、保护路线并通过战斗得分。', strategy: '分配进攻、防守和运输队，优先控制稀土工厂。' },
      { title: '生化怪物', summary: 'R4/R5召唤弗兰肯斯坦进行rally，第二轮须在42分钟后开启。', objective: '不消耗能量，最大化联盟总伤害。', strategy: '提前公布两个时间，优先填满最强rally。' },
      { title: '建造庇护所', summary: '每日主题提供积分、奖章和排名奖励，00:00重置。', objective: '完成当天主题任务并收集奖章。', strategy: '提前查看日历，为对应日期保留资源。' },
      { title: '联盟对决', summary: '持续多日的赛季对抗，每天主题不同。', objective: '在每日积分上击败对手联盟。', strategy: '重置时公布主题，提前囤积资源，避免无效消耗。' },
    ]),
  },
  'zh-TW': {
    navEvents: '活動', eventsLabel: '戰地手冊', eventsTitle: '主要活動', eventsIntro: '四項核心活動的目標、關鍵規則與聯盟戰術。', eventObjective: '目標', eventStrategy: '聯盟計畫',
    eventItems: items([
      { title: '黑金戰場', summary: '兩個聯盟爭奪設施、稀土運輸與持續佔領積分。', objective: '佔領設施、保護路線並透過戰鬥得分。', strategy: '分配進攻、防守與運輸隊，優先控制稀土工廠。' },
      { title: '生化怪物', summary: 'R4/R5召喚科學怪人進行rally，第二輪須在42分鐘後開啟。', objective: '不消耗能量，最大化聯盟總傷害。', strategy: '提前公布兩個時間，優先填滿最強rally。' },
      { title: '建造庇護所', summary: '每日主題提供積分、獎章與排名獎勵，00:00重設。', objective: '完成當天主題任務並收集獎章。', strategy: '提前查看日曆，為對應日期保留資源。' },
      { title: '聯盟對決', summary: '持續多日的賽季對抗，每天主題不同。', objective: '在每日積分上擊敗對手聯盟。', strategy: '重設時公布主題，提前囤積資源，避免無效消耗。' },
    ]),
  },
}
