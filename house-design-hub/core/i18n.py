"""UI translations for 12 languages. English is the default and the fallback.

The first 7 languages live as columns in the tables below. The rest (ja, de, pt,
ko, it) live in core/i18n_extra.py as one dict per language.

To add another language: add it to LANGS and add a dict for it in i18n_extra.py
(missing keys automatically fall back to English).
"""
from .i18n_extra import EXTRA

LANGS = [  # (code, native name, direction)
    ("en", "English", "ltr"),
    ("hi", "हिन्दी", "ltr"),
    ("es", "Español", "ltr"),
    ("fr", "Français", "ltr"),
    ("ar", "العربية", "rtl"),
    ("bn", "বাংলা", "ltr"),
    ("zh", "中文", "ltr"),
    ("ja", "日本語", "ltr"),
    ("de", "Deutsch", "ltr"),
    ("pt", "Português", "ltr"),
    ("ko", "한국어", "ltr"),
    ("it", "Italiano", "ltr"),
]
CODES = [c for c, _, _ in LANGS]
_NCOLS = 7  # languages stored as tuple columns; the rest come from EXTRA

# key -> (en, hi, es, fr, ar, bn, zh)
_UI = {
    "tagline": ("Thousands of house designs in 2D, 3D and 4D, made by AI",
                "AI से बने हज़ारों घर के डिज़ाइन: 2D, 3D और 4D में",
                "Miles de diseños de casas en 2D, 3D y 4D, creados con IA",
                "Des milliers de plans de maison en 2D, 3D et 4D, créés par l'IA",
                "آلاف تصاميم المنازل بتقنيات 2D و3D و4D بواسطة الذكاء الاصطناعي",
                "AI দিয়ে তৈরি হাজার হাজার বাড়ির ডিজাইন: 2D, 3D ও 4D তে",
                "由 AI 生成的数千种 2D、3D、4D 房屋设计"),
    "nav_home": ("Home", "होम", "Inicio", "Accueil", "الرئيسية", "হোম", "首页"),
    "nav_gallery": ("Gallery", "गैलरी", "Galería", "Galerie", "المعرض", "গ্যালারি", "图库"),
    "nav_designer": ("AI Designer", "AI डिज़ाइनर", "Diseñador IA", "Concepteur IA", "مصمم الذكاء الاصطناعي", "AI ডিজাইনার", "AI 设计师"),
    "nav_topics": ("Collections", "संग्रह", "Colecciones", "Collections", "المجموعات", "সংগ্রহ", "合集"),
    "theme": ("Theme", "थीम", "Tema", "Thème", "المظهر", "থিম", "主题"),
    "theme_light": ("Light", "लाइट", "Claro", "Clair", "فاتح", "লাইট", "浅色"),
    "theme_dark": ("Dark", "डार्क", "Oscuro", "Sombre", "داكن", "ডার্ক", "深色"),
    "language": ("Language", "भाषा", "Idioma", "Langue", "اللغة", "ভাষা", "语言"),
    "hero_title": ("Design your dream house", "अपने सपनों का घर डिज़ाइन करें", "Diseña la casa de tus sueños", "Concevez la maison de vos rêves", "صمّم منزل أحلامك", "আপনার স্বপ্নের বাড়ি ডিজাইন করুন", "设计你的梦想之家"),
    "hero_sub": ("Browse the gallery or ask the AI designer for a plan that fits your plot, family and budget.",
                 "गैलरी देखें या अपने प्लॉट, परिवार और बजट के अनुसार AI डिज़ाइनर से प्लान बनवाएं।",
                 "Explora la galería o pide al diseñador IA un plano para tu terreno, tu familia y tu presupuesto.",
                 "Parcourez la galerie ou demandez à l'IA un plan adapté à votre terrain, votre famille et votre budget.",
                 "تصفّح المعرض أو اطلب من المصمم الذكي مخططًا يناسب أرضك وعائلتك وميزانيتك.",
                 "গ্যালারি দেখুন বা আপনার প্লট, পরিবার ও বাজেট অনুযায়ী AI ডিজাইনারকে দিয়ে প্ল্যান বানান।",
                 "浏览图库，或让 AI 设计师根据你的地块、家庭和预算生成方案。"),
    "cta_gallery": ("Browse designs", "डिज़ाइन देखें", "Ver diseños", "Voir les plans", "تصفح التصاميم", "ডিজাইন দেখুন", "浏览设计"),
    "cta_ai": ("Ask the AI designer", "AI डिज़ाइनर से पूछें", "Preguntar al diseñador IA", "Demander à l'IA", "اسأل المصمم الذكي", "AI ডিজাইনারকে জিজ্ঞাসা করুন", "询问 AI 设计师"),
    "designs_count": ("designs", "डिज़ाइन", "diseños", "plans", "تصميم", "টি ডিজাইন", "个设计"),
    "collections": ("Collections", "संग्रह", "Colecciones", "Collections", "المجموعات", "সংগ্রহ", "合集"),
    "styles": ("Styles", "शैलियाँ", "Estilos", "Styles", "الأنماط", "ধরন", "风格"),
    "search_ph": ("Search: village, 3 bhk, duplex, 30x40...", "खोजें: village, 3 bhk, duplex, 30x40...", "Buscar: village, 3 bhk, duplex, 30x40...", "Rechercher : village, 3 bhk, duplex, 30x40...", "ابحث: village, 3 bhk, duplex, 30x40...", "খুঁজুন: village, 3 bhk, duplex, 30x40...", "搜索：village、3 bhk、duplex、30x40…"),
    "all": ("All", "सभी", "Todos", "Tous", "الكل", "সব", "全部"),
    "style": ("Style", "शैली", "Estilo", "Style", "النمط", "ধরন", "风格"),
    "bedrooms": ("Bedrooms", "शयनकक्ष", "Dormitorios", "Chambres", "غرف النوم", "শোবার ঘর", "卧室"),
    "floors": ("Floors", "मंज़िलें", "Pisos", "Étages", "الطوابق", "তলা", "楼层"),
    "facing": ("Facing", "दिशा", "Orientación", "Orientation", "الاتجاه", "মুখ", "朝向"),
    "plot": ("Plot (ft)", "प्लॉट (फ़ीट)", "Terreno (pies)", "Terrain (pieds)", "الأرض (قدم)", "প্লট (ফুট)", "地块（英尺）"),
    "width": ("Width", "चौड़ाई", "Ancho", "Largeur", "العرض", "প্রস্থ", "宽度"),
    "depth": ("Depth", "गहराई", "Fondo", "Profondeur", "العمق", "দৈর্ঘ্য", "进深"),
    "area": ("Built-up area", "निर्मित क्षेत्र", "Área construida", "Surface bâtie", "المساحة المبنية", "নির্মিত এলাকা", "建筑面积"),
    "cost": ("Est. cost", "अनुमानित लागत", "Costo est.", "Coût est.", "التكلفة التقديرية", "আনুমানিক খরচ", "预估造价"),
    "sort": ("Sort", "क्रम", "Ordenar", "Trier", "ترتيب", "সাজান", "排序"),
    "sort_popular": ("Popular", "लोकप्रिय", "Populares", "Populaires", "الأكثر شيوعًا", "জনপ্রিয়", "热门"),
    "sort_cost_asc": ("Cost: low to high", "लागत: कम से ज़्यादा", "Costo: menor a mayor", "Coût : croissant", "التكلفة: من الأقل", "খরচ: কম থেকে বেশি", "造价：从低到高"),
    "sort_cost_desc": ("Cost: high to low", "लागत: ज़्यादा से कम", "Costo: mayor a menor", "Coût : décroissant", "التكلفة: من الأعلى", "খরচ: বেশি থেকে কম", "造价：从高到低"),
    "sort_area_desc": ("Area: large first", "क्षेत्र: बड़ा पहले", "Área: mayor primero", "Surface : grande d'abord", "المساحة: الأكبر أولًا", "এলাকা: বড় আগে", "面积：从大到小"),
    "load_more": ("Load more", "और दिखाएं", "Ver más", "Voir plus", "عرض المزيد", "আরও দেখুন", "加载更多"),
    "no_results": ("No designs match. Try fewer filters.", "कोई डिज़ाइन नहीं मिला। फ़िल्टर कम करें।", "Ningún diseño coincide. Prueba con menos filtros.", "Aucun plan trouvé. Essayez moins de filtres.", "لا توجد تصاميم مطابقة. جرّب فلاتر أقل.", "কোনো ডিজাইন মেলেনি। ফিল্টার কমান।", "没有匹配的设计，请减少筛选条件。"),
    "view_details": ("View design", "डिज़ाइन देखें", "Ver diseño", "Voir le plan", "عرض التصميم", "ডিজাইন দেখুন", "查看设计"),
    "view_2d": ("2D Plan", "2D प्लान", "Plano 2D", "Plan 2D", "مخطط 2D", "2D প্ল্যান", "2D 平面图"),
    "view_3d": ("3D Model", "3D मॉडल", "Modelo 3D", "Modèle 3D", "نموذج 3D", "3D মডেল", "3D 模型"),
    "view_4d": ("4D Timeline", "4D टाइमलाइन", "Línea de tiempo 4D", "Chronologie 4D", "الجدول الزمني 4D", "4D টাইমলাইন", "4D 时间线"),
    "floor_label": ("Floor", "मंज़िल", "Piso", "Étage", "طابق", "তলা", "楼层"),
    "ground": ("Ground", "भूतल", "Planta baja", "Rez-de-chaussée", "الأرضي", "নিচতলা", "首层"),
    "day": ("Day", "दिन", "Día", "Jour", "نهار", "দিন", "白天"),
    "night": ("Night", "रात", "Noche", "Nuit", "ليل", "রাত", "夜晚"),
    "time_of_day": ("Time of day", "दिन का समय", "Hora del día", "Heure du jour", "وقت اليوم", "দিনের সময়", "时间"),
    "construction": ("Construction progress", "निर्माण की प्रगति", "Avance de obra", "Avancement du chantier", "تقدم البناء", "নির্মাণের অগ্রগতি", "施工进度"),
    "stage_foundation": ("Foundation", "नींव", "Cimientos", "Fondations", "الأساسات", "ভিত", "地基"),
    "stage_walls": ("Walls", "दीवारें", "Muros", "Murs", "الجدران", "দেয়াল", "墙体"),
    "stage_roof": ("Roof", "छत", "Techo", "Toit", "السقف", "ছাদ", "屋顶"),
    "stage_finish": ("Finishing", "फिनिशिंग", "Acabados", "Finitions", "التشطيبات", "ফিনিশিং", "装修"),
    "play": ("Play", "चलाएं", "Reproducir", "Lecture", "تشغيل", "চালান", "播放"),
    "pause": ("Pause", "रोकें", "Pausa", "Pause", "إيقاف مؤقت", "থামান", "暂停"),
    "rotate": ("Auto-rotate", "ऑटो-रोटेट", "Rotación automática", "Rotation auto", "دوران تلقائي", "অটো-রোটেট", "自动旋转"),
    "cutaway": ("Cutaway (hide roof)", "छत हटाएं (अंदर देखें)", "Corte (ocultar techo)", "Coupe (masquer le toit)", "مقطع (إخفاء السقف)", "ছাদ লুকান (ভিতর দেখুন)", "剖切（隐藏屋顶）"),
    "drag_hint": ("Drag to rotate, scroll or pinch to zoom", "घुमाने के लिए खींचें, ज़ूम के लिए स्क्रॉल करें", "Arrastra para girar, rueda para hacer zoom", "Glissez pour tourner, molette pour zoomer", "اسحب للتدوير، وقم بالتمرير للتكبير", "ঘোরাতে টানুন, জুম করতে স্ক্রল করুন", "拖动旋转，滚轮或双指缩放"),
    "download_svg": ("Download plan (SVG)", "प्लान डाउनलोड (SVG)", "Descargar plano (SVG)", "Télécharger le plan (SVG)", "تنزيل المخطط (SVG)", "প্ল্যান ডাউনলোড (SVG)", "下载平面图 (SVG)"),
    "open_in_ai": ("Customize with AI", "AI से बदलें", "Personalizar con IA", "Personnaliser avec l'IA", "تخصيص بالذكاء الاصطناعي", "AI দিয়ে বদলান", "用 AI 定制"),
    "rooms": ("Rooms", "कमरे", "Habitaciones", "Pièces", "الغرف", "কক্ষ", "房间"),
    "similar": ("Similar designs", "मिलते-जुलते डिज़ाइन", "Diseños similares", "Plans similaires", "تصاميم مشابهة", "অনুরূপ ডিজাইন", "相似设计"),
    "ai_title": ("AI House Designer", "AI हाउस डिज़ाइनर", "Diseñador de casas IA", "Concepteur de maisons IA", "مصمم المنازل الذكي", "AI হাউস ডিজাইনার", "AI 房屋设计师"),
    "ai_hello": ("Tell me what you need, for example: \"3 bedroom modern house 30x40 two floors\".",
                 "बताइए आपको क्या चाहिए, जैसे: \"3 bedroom modern house 30x40 two floors\"।",
                 "Dime qué necesitas, por ejemplo: \"3 bedroom modern house 30x40 two floors\".",
                 "Dites-moi ce qu'il vous faut, par exemple : \"3 bedroom modern house 30x40 two floors\".",
                 "أخبرني بما تحتاج، مثلًا: \"3 bedroom modern house 30x40 two floors\".",
                 "কী চান বলুন, যেমন: \"3 bedroom modern house 30x40 two floors\"।",
                 "告诉我你的需求，例如：\"3 bedroom modern house 30x40 two floors\"。"),
    "ai_ph": ("Describe your house...", "अपने घर का वर्णन करें...", "Describe tu casa...", "Décrivez votre maison...", "صف منزلك...", "আপনার বাড়ির বিবরণ দিন...", "描述你的房子…"),
    "ai_send": ("Design", "डिज़ाइन करें", "Diseñar", "Concevoir", "صمّم", "ডিজাইন করুন", "生成"),
    "ai_surprise": ("Surprise me", "कुछ नया दिखाओ", "Sorpréndeme", "Surprenez-moi", "فاجئني", "চমকে দিন", "随机生成"),
    "ai_reply": ("Here is a {beds} BHK {style} house on a {w}x{d} ft plot with {floors} floor(s): about {area} sq ft built-up, estimated cost around ₹{cost} lakh.",
                 "यह रहा {w}x{d} फ़ीट प्लॉट पर {floors} मंज़िल का {beds} BHK {style} घर: लगभग {area} वर्ग फ़ीट निर्मित क्षेत्र, अनुमानित लागत लगभग ₹{cost} लाख।",
                 "Aquí tienes una casa {style} de {beds} BHK en un terreno de {w}x{d} pies con {floors} piso(s): unos {area} pies² construidos, costo estimado de ₹{cost} lakh.",
                 "Voici une maison {style} de {beds} BHK sur un terrain de {w}x{d} pieds, {floors} étage(s) : environ {area} pi² bâtis, coût estimé ≈ ₹{cost} lakh.",
                 "إليك منزلًا بنمط {style} من {beds} غرف نوم على أرض {w}x{d} قدم بعدد طوابق {floors}: مساحة مبنية نحو {area} قدم مربع وتكلفة تقديرية نحو ₹{cost} لاك.",
                 "{w}x{d} ফুট প্লটে {floors} তলার {beds} BHK {style} বাড়ি: প্রায় {area} বর্গফুট নির্মিত এলাকা, আনুমানিক খরচ প্রায় ₹{cost} লাখ।",
                 "为你生成：{w}x{d} 英尺地块、{floors} 层、{beds} 室的{style}住宅，建筑面积约 {area} 平方英尺，预估造价约 ₹{cost} lakh（1 lakh = 10 万）。"),
    "ai_notes_title": ("Design notes", "डिज़ाइन नोट्स", "Notas de diseño", "Notes de conception", "ملاحظات التصميم", "ডিজাইন নোট", "设计说明"),
    "footer": ("Plans are illustrative concepts with rough cost estimates. Always have a licensed architect or engineer verify structure, local bylaws and costs before building.",
               "ये प्लान केवल अवधारणात्मक हैं और लागत मोटा अनुमान है। निर्माण से पहले लाइसेंस प्राप्त आर्किटेक्ट या इंजीनियर से संरचना, स्थानीय नियम और लागत ज़रूर जाँचवाएं।",
               "Los planos son conceptos ilustrativos con costos aproximados. Pide siempre a un arquitecto o ingeniero colegiado que verifique la estructura, la normativa local y los costos antes de construir.",
               "Les plans sont des concepts illustratifs avec des coûts approximatifs. Faites toujours vérifier la structure, la réglementation locale et les coûts par un architecte ou ingénieur agréé avant de construire.",
               "المخططات مفاهيم توضيحية بتكاليف تقريبية. يجب أن يراجع مهندس معماري أو مدني مرخّص الهيكل والأنظمة المحلية والتكاليف قبل البناء.",
               "প্ল্যানগুলো ধারণামূলক এবং খরচ আনুমানিক। নির্মাণের আগে লাইসেন্সপ্রাপ্ত স্থপতি বা ইঞ্জিনিয়ার দিয়ে কাঠামো, স্থানীয় নিয়ম ও খরচ যাচাই করান।",
               "方案仅为示意概念，造价为粗略估算。施工前请务必由持证建筑师或工程师核实结构、当地规范和费用。"),
    "design_name": ("{style} {beds} BHK · {floors} floor(s) · {w}x{d} ft",
                    "{style} {beds} BHK · {floors} मंज़िल · {w}x{d} फ़ीट",
                    "{style} {beds} BHK · {floors} piso(s) · {w}x{d} pies",
                    "{style} {beds} BHK · {floors} étage(s) · {w}x{d} pieds",
                    "{style} {beds} BHK · {floors} طابق · {w}x{d} قدم",
                    "{style} {beds} BHK · {floors} তলা · {w}x{d} ফুট",
                    "{style} {beds} BHK · {floors} 层 · {w}x{d} 英尺"),
    "N": ("North", "उत्तर", "Norte", "Nord", "شمال", "উত্তর", "北"),
    "E": ("East", "पूर्व", "Este", "Est", "شرق", "পূর্ব", "东"),
    "S": ("South", "दक्षिण", "Sur", "Sud", "جنوب", "দক্ষিণ", "南"),
    "W": ("West", "पश्चिम", "Oeste", "Ouest", "غرب", "পশ্চিম", "西"),
    "road": ("Road", "सड़क", "Calle", "Route", "الشارع", "রাস্তা", "道路"),
    "foot_faq": ("FAQ", "अक्सर पूछे सवाल", "Preguntas frecuentes", "FAQ", "الأسئلة الشائعة", "প্রশ্নোত্তর", "常见问题"),
    "foot_contact": ("Contact", "संपर्क", "Contacto", "Contact", "اتصل بنا", "যোগাযোগ", "联系我们"),
    "foot_terms": ("Terms of Service", "नियम और शर्तें", "Términos", "Conditions", "الشروط", "শর্তাবলী", "服务条款"),
    "foot_privacy": ("Privacy Policy", "गोपनीयता", "Privacidad", "Confidentialité", "الخصوصية", "গোপনীয়তা", "隐私政策"),
    "foot_cookies": ("Cookies", "कुकीज़", "Cookies", "Cookies", "ملفات تعريف الارتباط", "কুকিজ", "Cookie 政策"),
}

_STYLE = {
    "modern": ("Modern", "आधुनिक", "Moderna", "Moderne", "عصري", "আধুনিক", "现代"),
    "minimalist": ("Minimalist", "न्यूनतम", "Minimalista", "Minimaliste", "بسيط", "মিনিমালিস্ট", "极简"),
    "contemporary": ("Contemporary", "समकालीन", "Contemporánea", "Contemporaine", "معاصر", "সমসাময়িক", "当代"),
    "village": ("Village", "गाँव", "Rural", "Rustique", "ريفي", "গ্রামীণ", "乡村"),
    "assam": ("Assam Type", "असम शैली", "Estilo Assam", "Style Assam", "طراز آسام", "অসম ধাঁচের", "阿萨姆风格"),
    "traditional": ("Traditional", "पारंपरिक", "Tradicional", "Traditionnelle", "تقليدي", "ঐতিহ্যবাহী", "传统"),
    "duplex": ("Duplex", "डुप्लेक्स", "Dúplex", "Duplex", "دوبلكس", "ডুপ্লেক্স", "复式"),
    "passive": ("Passive Eco", "पैसिव इको", "Pasiva Eco", "Passive Éco", "موفّر للطاقة", "প্যাসিভ ইকো", "被动式节能"),
    "loft": ("Loft", "लॉफ्ट", "Loft", "Loft", "لوفت", "লফট", "阁楼式"),
    "farmhouse": ("Farmhouse", "फार्महाउस", "Casa de campo", "Ferme", "مزرعة", "ফার্মহাউস", "农舍"),
    "bungalow": ("Bungalow", "बंगला", "Bungalow", "Bungalow", "بنغل", "বাংলো", "平房"),
    "villa": ("Luxury Villa", "लक्ज़री विला", "Villa de lujo", "Villa de luxe", "فيلا فاخرة", "বিলাসবহুল ভিলা", "豪华别墅"),
    "lowcost": ("Low Cost", "कम लागत", "Bajo costo", "Économique", "منخفض التكلفة", "কম খরচের", "低成本"),
    "compact": ("Compact", "कॉम्पैक्ट", "Compacta", "Compacte", "مدمج", "কমপ্যাক্ট", "小型紧凑"),
    "mansion": ("Mansion", "हवेली", "Mansión", "Manoir", "قصر", "প্রাসাদোপম বাড়ি", "豪宅"),
}

_ROOM = {
    "living": ("Living", "बैठक", "Sala", "Salon", "المعيشة", "বসার ঘর", "客厅"),
    "kitchen": ("Kitchen", "रसोई", "Cocina", "Cuisine", "مطبخ", "রান্নাঘর", "厨房"),
    "dining": ("Dining", "भोजन कक्ष", "Comedor", "Salle à manger", "الطعام", "খাবার ঘর", "餐厅"),
    "bedroom": ("Bedroom", "शयनकक्ष", "Dormitorio", "Chambre", "غرفة نوم", "শোবার ঘর", "卧室"),
    "master": ("Master Bed", "मुख्य शयनकक्ष", "Dorm. principal", "Ch. parentale", "النوم الرئيسية", "মাস্টার বেড", "主卧"),
    "bath": ("Bath", "स्नानघर", "Baño", "Sdb", "حمام", "বাথরুম", "卫生间"),
    "porch": ("Porch", "पोर्च", "Pórtico", "Porche", "مدخل", "পোর্চ", "门廊"),
    "verandah": ("Verandah", "बरामदा", "Veranda", "Véranda", "رواق", "বারান্দা", "走廊"),
    "pooja": ("Pooja", "पूजा घर", "Oración", "Prière", "صلاة", "ঠাকুরঘর", "祈祷室"),
    "balcony": ("Balcony", "बालकनी", "Balcón", "Balcon", "شرفة", "ব্যালকনি", "阳台"),
    "lounge": ("Lounge", "पारिवारिक कक्ष", "Sala familiar", "Salon fam.", "صالة", "লাউঞ্জ", "家庭厅"),
    "stair": ("Stairs", "सीढ़ी", "Escalera", "Escalier", "درج", "সিঁড়ি", "楼梯"),
    "store": ("Store", "भंडार", "Almacén", "Cellier", "مخزن", "ভাঁড়ার", "储藏室"),
    "carport": ("Car Porch", "कार पोर्च", "Cochera", "Garage", "موقف", "কার পোর্চ", "车库"),
    "study": ("Study", "अध्ययन कक्ष", "Estudio", "Bureau", "دراسة", "পড়ার ঘর", "书房"),
}


def _col(table, idx):
    return {k: v[idx] for k, v in table.items()}


def get_dict(lang):
    if lang not in CODES:
        lang = "en"
    i = CODES.index(lang)
    extra = EXTRA.get(lang) if i >= _NCOLS else None
    out = {}
    for prefix, table in (("", _UI), ("style.", _STYLE), ("room.", _ROOM)):
        for k, v in table.items():
            if extra is not None:
                out[prefix + k] = extra.get(prefix + k) or v[0]   # English fallback
            else:
                out[prefix + k] = v[i] or v[0]
    return {"lang": lang, "dir": dict((c, d) for c, _, d in LANGS)[lang], "t": out}


def style_names():
    """Every translated style name -> style key (used by the chat parser)."""
    names = {}
    for key, row in _STYLE.items():
        for n in row:
            names[n.lower()] = key
    for table in EXTRA.values():
        for k, n in table.items():
            if k.startswith("style."):
                names[n.lower()] = k[len("style."):]
    return names 