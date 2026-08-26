import type { Language } from './i18n'

export type DiscussionCopy = {
  discussion: string
  noComments: string
  placeholder: string
  send: string
  signIn: string
  closed: string
  deleteComment: string
  confirmDelete: string
  translate: string
  translating: string
  viewOriginal: string
  loadFailed: string
  sendFailed: string
  translationFailed: string
  addImages: string
  removeImage: string
  openImage: string
  imageLimit: string
  imageInvalid: string
  imageProcessing: string
}

type BaseDiscussionCopy = Omit<DiscussionCopy, 'addImages' | 'removeImage' | 'openImage' | 'imageLimit' | 'imageInvalid' | 'imageProcessing'>

const en: BaseDiscussionCopy = {
  discussion: 'Discussion', noComments: 'No comments yet.', placeholder: 'Write a comment...', send: 'Send',
  signIn: 'Sign in as a verified member to join the discussion.', closed: 'This discussion is closed.',
  deleteComment: 'Delete comment', confirmDelete: 'Delete this comment?', translate: 'Translate', translating: 'Translating...',
  viewOriginal: 'View original', loadFailed: 'Unable to load the discussion.', sendFailed: 'Unable to send the comment.',
  translationFailed: 'Unable to translate this comment.',
}

const copies: Record<Language, BaseDiscussionCopy> = {
  en,
  pt: { discussion:'Discussão',noComments:'Ainda não existem comentários.',placeholder:'Escreva um comentário...',send:'Enviar',signIn:'Entre como membro verificado para participar na discussão.',closed:'Esta discussão está encerrada.',deleteComment:'Eliminar comentário',confirmDelete:'Eliminar este comentário?',translate:'Traduzir',translating:'A traduzir...',viewOriginal:'Ver original',loadFailed:'Não foi possível carregar a discussão.',sendFailed:'Não foi possível enviar o comentário.',translationFailed:'Não foi possível traduzir este comentário.' },
  es: { discussion:'Discusión',noComments:'Todavía no hay comentarios.',placeholder:'Escribe un comentario...',send:'Enviar',signIn:'Inicia sesión como miembro verificado para participar.',closed:'Esta discusión está cerrada.',deleteComment:'Eliminar comentario',confirmDelete:'¿Eliminar este comentario?',translate:'Traducir',translating:'Traduciendo...',viewOriginal:'Ver original',loadFailed:'No se pudo cargar la discusión.',sendFailed:'No se pudo enviar el comentario.',translationFailed:'No se pudo traducir este comentario.' },
  fr: { discussion:'Discussion',noComments:'Aucun commentaire pour le moment.',placeholder:'Écrivez un commentaire...',send:'Envoyer',signIn:'Connectez-vous comme membre vérifié pour participer.',closed:'Cette discussion est fermée.',deleteComment:'Supprimer le commentaire',confirmDelete:'Supprimer ce commentaire ?',translate:'Traduire',translating:'Traduction...',viewOriginal:'Voir l’original',loadFailed:'Impossible de charger la discussion.',sendFailed:'Impossible d’envoyer le commentaire.',translationFailed:'Impossible de traduire ce commentaire.' },
  de: { discussion:'Diskussion',noComments:'Noch keine Kommentare.',placeholder:'Kommentar schreiben...',send:'Senden',signIn:'Melde dich als verifiziertes Mitglied an, um teilzunehmen.',closed:'Diese Diskussion ist geschlossen.',deleteComment:'Kommentar löschen',confirmDelete:'Diesen Kommentar löschen?',translate:'Übersetzen',translating:'Wird übersetzt...',viewOriginal:'Original anzeigen',loadFailed:'Die Diskussion konnte nicht geladen werden.',sendFailed:'Der Kommentar konnte nicht gesendet werden.',translationFailed:'Dieser Kommentar konnte nicht übersetzt werden.' },
  it: { discussion:'Discussione',noComments:'Nessun commento.',placeholder:'Scrivi un commento...',send:'Invia',signIn:'Accedi come membro verificato per partecipare.',closed:'Questa discussione è chiusa.',deleteComment:'Elimina commento',confirmDelete:'Eliminare questo commento?',translate:'Traduci',translating:'Traduzione...',viewOriginal:'Vedi originale',loadFailed:'Impossibile caricare la discussione.',sendFailed:'Impossibile inviare il commento.',translationFailed:'Impossibile tradurre questo commento.' },
  pl: { discussion:'Dyskusja',noComments:'Brak komentarzy.',placeholder:'Napisz komentarz...',send:'Wyślij',signIn:'Zaloguj się jako zweryfikowany członek, aby dołączyć.',closed:'Ta dyskusja jest zamknięta.',deleteComment:'Usuń komentarz',confirmDelete:'Usunąć ten komentarz?',translate:'Przetłumacz',translating:'Tłumaczenie...',viewOriginal:'Pokaż oryginał',loadFailed:'Nie udało się wczytać dyskusji.',sendFailed:'Nie udało się wysłać komentarza.',translationFailed:'Nie udało się przetłumaczyć komentarza.' },
  ru: { discussion:'Обсуждение',noComments:'Комментариев пока нет.',placeholder:'Напишите комментарий...',send:'Отправить',signIn:'Войдите как подтверждённый участник.',closed:'Обсуждение закрыто.',deleteComment:'Удалить комментарий',confirmDelete:'Удалить этот комментарий?',translate:'Перевести',translating:'Перевод...',viewOriginal:'Показать оригинал',loadFailed:'Не удалось загрузить обсуждение.',sendFailed:'Не удалось отправить комментарий.',translationFailed:'Не удалось перевести комментарий.' },
  tr: { discussion:'Tartışma',noComments:'Henüz yorum yok.',placeholder:'Yorum yaz...',send:'Gönder',signIn:'Katılmak için doğrulanmış üye olarak giriş yapın.',closed:'Bu tartışma kapalı.',deleteComment:'Yorumu sil',confirmDelete:'Bu yorum silinsin mi?',translate:'Çevir',translating:'Çevriliyor...',viewOriginal:'Orijinali göster',loadFailed:'Tartışma yüklenemedi.',sendFailed:'Yorum gönderilemedi.',translationFailed:'Yorum çevrilemedi.' },
  id: { discussion:'Diskusi',noComments:'Belum ada komentar.',placeholder:'Tulis komentar...',send:'Kirim',signIn:'Masuk sebagai anggota terverifikasi untuk bergabung.',closed:'Diskusi ini ditutup.',deleteComment:'Hapus komentar',confirmDelete:'Hapus komentar ini?',translate:'Terjemahkan',translating:'Menerjemahkan...',viewOriginal:'Lihat asli',loadFailed:'Diskusi tidak dapat dimuat.',sendFailed:'Komentar tidak dapat dikirim.',translationFailed:'Komentar tidak dapat diterjemahkan.' },
  vi: { discussion:'Thảo luận',noComments:'Chưa có bình luận.',placeholder:'Viết bình luận...',send:'Gửi',signIn:'Đăng nhập với tư cách thành viên đã xác minh để tham gia.',closed:'Cuộc thảo luận đã đóng.',deleteComment:'Xóa bình luận',confirmDelete:'Xóa bình luận này?',translate:'Dịch',translating:'Đang dịch...',viewOriginal:'Xem bản gốc',loadFailed:'Không thể tải thảo luận.',sendFailed:'Không thể gửi bình luận.',translationFailed:'Không thể dịch bình luận.' },
  th: { discussion:'การสนทนา',noComments:'ยังไม่มีความคิดเห็น',placeholder:'เขียนความคิดเห็น...',send:'ส่ง',signIn:'เข้าสู่ระบบในฐานะสมาชิกที่ยืนยันแล้วเพื่อเข้าร่วม',closed:'การสนทนานี้ปิดแล้ว',deleteComment:'ลบความคิดเห็น',confirmDelete:'ลบความคิดเห็นนี้หรือไม่',translate:'แปล',translating:'กำลังแปล...',viewOriginal:'ดูต้นฉบับ',loadFailed:'ไม่สามารถโหลดการสนทนาได้',sendFailed:'ไม่สามารถส่งความคิดเห็นได้',translationFailed:'ไม่สามารถแปลความคิดเห็นได้' },
  ja: { discussion:'ディスカッション',noComments:'コメントはまだありません。',placeholder:'コメントを書く...',send:'送信',signIn:'認証済みメンバーとしてログインしてください。',closed:'このディスカッションは終了しました。',deleteComment:'コメントを削除',confirmDelete:'このコメントを削除しますか？',translate:'翻訳',translating:'翻訳中...',viewOriginal:'原文を表示',loadFailed:'ディスカッションを読み込めません。',sendFailed:'コメントを送信できません。',translationFailed:'コメントを翻訳できません。' },
  ko: { discussion:'토론',noComments:'아직 댓글이 없습니다.',placeholder:'댓글 작성...',send:'보내기',signIn:'인증된 회원으로 로그인하여 참여하세요.',closed:'이 토론은 종료되었습니다.',deleteComment:'댓글 삭제',confirmDelete:'이 댓글을 삭제하시겠습니까?',translate:'번역',translating:'번역 중...',viewOriginal:'원문 보기',loadFailed:'토론을 불러올 수 없습니다.',sendFailed:'댓글을 보낼 수 없습니다.',translationFailed:'댓글을 번역할 수 없습니다.' },
  ar: { discussion:'النقاش',noComments:'لا توجد تعليقات بعد.',placeholder:'اكتب تعليقًا...',send:'إرسال',signIn:'سجّل الدخول كعضو موثّق للمشاركة.',closed:'هذا النقاش مغلق.',deleteComment:'حذف التعليق',confirmDelete:'حذف هذا التعليق؟',translate:'ترجمة',translating:'جارٍ الترجمة...',viewOriginal:'عرض الأصل',loadFailed:'تعذر تحميل النقاش.',sendFailed:'تعذر إرسال التعليق.',translationFailed:'تعذرت ترجمة التعليق.' },
  'zh-CN': { discussion:'讨论',noComments:'暂无评论。',placeholder:'写评论...',send:'发送',signIn:'请以已验证成员身份登录以参与讨论。',closed:'此讨论已关闭。',deleteComment:'删除评论',confirmDelete:'删除此评论？',translate:'翻译',translating:'正在翻译...',viewOriginal:'查看原文',loadFailed:'无法加载讨论。',sendFailed:'无法发送评论。',translationFailed:'无法翻译此评论。' },
  'zh-TW': { discussion:'討論',noComments:'尚無留言。',placeholder:'撰寫留言...',send:'傳送',signIn:'請以已驗證成員身分登入以參與討論。',closed:'此討論已關閉。',deleteComment:'刪除留言',confirmDelete:'刪除此留言？',translate:'翻譯',translating:'正在翻譯...',viewOriginal:'查看原文',loadFailed:'無法載入討論。',sendFailed:'無法傳送留言。',translationFailed:'無法翻譯此留言。' },
}

const imageCopies: Record<Language, Pick<DiscussionCopy, 'addImages' | 'removeImage' | 'openImage' | 'imageLimit' | 'imageInvalid' | 'imageProcessing'>> = {
  en: { addImages:'Add images',removeImage:'Remove image',openImage:'Open image',imageLimit:'A comment may contain up to 5 images.',imageInvalid:'Use JPEG, PNG or WebP images up to 20 MB.',imageProcessing:'Optimizing images...' },
  pt: { addImages:'Adicionar imagens',removeImage:'Remover imagem',openImage:'Abrir imagem',imageLimit:'Um comentário pode conter até 5 imagens.',imageInvalid:'Use imagens JPEG, PNG ou WebP até 20 MB.',imageProcessing:'A otimizar imagens...' },
  es: { addImages:'Añadir imágenes',removeImage:'Eliminar imagen',openImage:'Abrir imagen',imageLimit:'Un comentario puede contener hasta 5 imágenes.',imageInvalid:'Usa imágenes JPEG, PNG o WebP de hasta 20 MB.',imageProcessing:'Optimizando imágenes...' },
  fr: { addImages:'Ajouter des images',removeImage:'Supprimer l’image',openImage:'Ouvrir l’image',imageLimit:'Un commentaire peut contenir jusqu’à 5 images.',imageInvalid:'Utilisez des images JPEG, PNG ou WebP de 20 Mo maximum.',imageProcessing:'Optimisation des images...' },
  de: { addImages:'Bilder hinzufügen',removeImage:'Bild entfernen',openImage:'Bild öffnen',imageLimit:'Ein Kommentar kann bis zu 5 Bilder enthalten.',imageInvalid:'Verwende JPEG-, PNG- oder WebP-Bilder bis 20 MB.',imageProcessing:'Bilder werden optimiert...' },
  it: { addImages:'Aggiungi immagini',removeImage:'Rimuovi immagine',openImage:'Apri immagine',imageLimit:'Un commento può contenere fino a 5 immagini.',imageInvalid:'Usa immagini JPEG, PNG o WebP fino a 20 MB.',imageProcessing:'Ottimizzazione immagini...' },
  pl: { addImages:'Dodaj obrazy',removeImage:'Usuń obraz',openImage:'Otwórz obraz',imageLimit:'Komentarz może zawierać do 5 obrazów.',imageInvalid:'Użyj obrazów JPEG, PNG lub WebP do 20 MB.',imageProcessing:'Optymalizowanie obrazów...' },
  ru: { addImages:'Добавить изображения',removeImage:'Удалить изображение',openImage:'Открыть изображение',imageLimit:'Комментарий может содержать до 5 изображений.',imageInvalid:'Используйте JPEG, PNG или WebP до 20 МБ.',imageProcessing:'Оптимизация изображений...' },
  tr: { addImages:'Görsel ekle',removeImage:'Görseli kaldır',openImage:'Görseli aç',imageLimit:'Bir yorum en fazla 5 görsel içerebilir.',imageInvalid:'En fazla 20 MB JPEG, PNG veya WebP kullanın.',imageProcessing:'Görseller optimize ediliyor...' },
  id: { addImages:'Tambahkan gambar',removeImage:'Hapus gambar',openImage:'Buka gambar',imageLimit:'Komentar dapat berisi hingga 5 gambar.',imageInvalid:'Gunakan JPEG, PNG, atau WebP hingga 20 MB.',imageProcessing:'Mengoptimalkan gambar...' },
  vi: { addImages:'Thêm hình ảnh',removeImage:'Xóa hình ảnh',openImage:'Mở hình ảnh',imageLimit:'Một bình luận có thể chứa tối đa 5 hình ảnh.',imageInvalid:'Dùng ảnh JPEG, PNG hoặc WebP tối đa 20 MB.',imageProcessing:'Đang tối ưu hình ảnh...' },
  th: { addImages:'เพิ่มรูปภาพ',removeImage:'ลบรูปภาพ',openImage:'เปิดรูปภาพ',imageLimit:'ความคิดเห็นมีรูปภาพได้สูงสุด 5 รูป',imageInvalid:'ใช้รูป JPEG, PNG หรือ WebP ขนาดไม่เกิน 20 MB',imageProcessing:'กำลังปรับรูปภาพ...' },
  ja: { addImages:'画像を追加',removeImage:'画像を削除',openImage:'画像を開く',imageLimit:'コメントには最大5枚の画像を追加できます。',imageInvalid:'20 MB以下のJPEG、PNG、WebPを使用してください。',imageProcessing:'画像を最適化しています...' },
  ko: { addImages:'이미지 추가',removeImage:'이미지 삭제',openImage:'이미지 열기',imageLimit:'댓글에는 최대 5개의 이미지를 추가할 수 있습니다.',imageInvalid:'20MB 이하의 JPEG, PNG 또는 WebP를 사용하세요.',imageProcessing:'이미지 최적화 중...' },
  ar: { addImages:'إضافة صور',removeImage:'إزالة الصورة',openImage:'فتح الصورة',imageLimit:'يمكن أن يحتوي التعليق على 5 صور كحد أقصى.',imageInvalid:'استخدم صور JPEG أو PNG أو WebP حتى 20 ميغابايت.',imageProcessing:'جارٍ تحسين الصور...' },
  'zh-CN': { addImages:'添加图片',removeImage:'移除图片',openImage:'打开图片',imageLimit:'每条评论最多可包含5张图片。',imageInvalid:'请使用不超过20 MB的JPEG、PNG或WebP图片。',imageProcessing:'正在优化图片...' },
  'zh-TW': { addImages:'新增圖片',removeImage:'移除圖片',openImage:'開啟圖片',imageLimit:'每則留言最多可包含5張圖片。',imageInvalid:'請使用不超過20 MB的JPEG、PNG或WebP圖片。',imageProcessing:'正在最佳化圖片...' },
}

export const getDiscussionCopy = (language: Language): DiscussionCopy => ({
  ...(copies[language] ?? en),
  ...imageCopies[language],
})