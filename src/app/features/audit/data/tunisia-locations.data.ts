/**
 * Tunisia Locations Data
 * 24 Governorates with main cities
 * Source: Official Tunisia administrative divisions 2025
 */

export interface TunisiaCity {
    name: string;
    nameAr: string;
}

export interface TunisiaGovernorate {
    code: string;
    name: string;
    nameAr: string;
    cities: TunisiaCity[];
}

export const TUNISIA_GOVERNORATES: TunisiaGovernorate[] = [
    {
        code: 'TU',
        name: 'Tunis',
        nameAr: 'تونس',
        cities: [
            { name: 'Tunis', nameAr: 'تونس' },
            { name: 'La Medina', nameAr: 'المدينة' },
            { name: 'Bab Bhar', nameAr: 'باب بحر' },
            { name: 'Bab Souika', nameAr: 'باب سويقة' },
            { name: 'El Omrane', nameAr: 'العمران' },
            { name: 'Ettahrir', nameAr: 'التحرير' },
            { name: 'El Menzah', nameAr: 'المنزه' },
            { name: 'Cité El Khadra', nameAr: 'سيدي الخضراء' }
        ]
    },
    {
        code: 'AR',
        name: 'Ariana',
        nameAr: 'أريانة',
        cities: [
            { name: 'Ariana Ville', nameAr: 'أريانة المدينة' },
            { name: 'La Soukra', nameAr: 'السكرة' },
            { name: 'Raoued', nameAr: 'رواد' },
            { name: 'Kalâat el-Andalous', nameAr: 'قلعة الأندلس' },
            { name: 'Sidi Thabet', nameAr: 'سيدي ثابت' },
            { name: 'Ettadhamen', nameAr: 'التضامن' },
            { name: 'Mnihla', nameAr: 'منيهلة' }
        ]
    },
    {
        code: 'BA',
        name: 'Ben Arous',
        nameAr: 'بن عروس',
        cities: [
            { name: 'Ben Arous', nameAr: 'بن عروس' },
            { name: 'Radès', nameAr: 'رادس' },
            { name: 'Hammam Lif', nameAr: 'حمام الأنف' },
            { name: 'Hammam Chott', nameAr: 'حمام الشط' },
            { name: 'Boumhel', nameAr: 'بومهل' },
            { name: 'Ezzahra', nameAr: 'الزهراء' },
            { name: 'Fouchana', nameAr: 'فوشانة' },
            { name: 'Mégrine', nameAr: 'المقرين' },
            { name: 'Mohamedia', nameAr: 'المحمدية' },
            { name: 'Mornag', nameAr: 'مرناق' }
        ]
    },
    {
        code: 'MA',
        name: 'Manouba',
        nameAr: 'منوبة',
        cities: [
            { name: 'Manouba', nameAr: 'منوبة' },
            { name: 'Douar Hicher', nameAr: 'دوار هيشر' },
            { name: 'Oued Ellil', nameAr: 'وادي الليل' },
            { name: 'Mornaguia', nameAr: 'المرناقية' },
            { name: 'Borj El Amri', nameAr: 'برج العامري' },
            { name: 'Djedeida', nameAr: 'الجديدة' },
            { name: 'Tebourba', nameAr: 'طبربة' },
            { name: 'El Battan', nameAr: 'البطان' }
        ]
    },
    {
        code: 'NA',
        name: 'Nabeul',
        nameAr: 'نابل',
        cities: [
            { name: 'Nabeul', nameAr: 'نابل' },
            { name: 'Hammamet', nameAr: 'الحمامات' },
            { name: 'Grombalia', nameAr: 'قرمبالية' },
            { name: 'Menzel Temime', nameAr: 'منزل تميم' },
            { name: 'Korba', nameAr: 'قربة' },
            { name: 'Kelibia', nameAr: 'قليبية' },
            { name: 'Dar Chaabane', nameAr: 'دار شعبان' },
            { name: 'Soliman', nameAr: 'سليمان' },
            { name: 'Menzel Bouzelfa', nameAr: 'منزل بوزلفة' },
            { name: 'Beni Khiar', nameAr: 'بني خيار' },
            { name: 'El Haouaria', nameAr: 'الهوارية' }
        ]
    },
    {
        code: 'ZA',
        name: 'Zaghouan',
        nameAr: 'زغوان',
        cities: [
            { name: 'Zaghouan', nameAr: 'زغوان' },
            { name: 'El Fahs', nameAr: 'الفحص' },
            { name: 'Bir Mcherga', nameAr: 'بئر مشارقة' },
            { name: 'Zriba', nameAr: 'الزريبة' },
            { name: 'Nadhour', nameAr: 'الناظور' },
            { name: 'Saouaf', nameAr: 'صواف' }
        ]
    },
    {
        code: 'BI',
        name: 'Bizerte',
        nameAr: 'بنزرت',
        cities: [
            { name: 'Bizerte', nameAr: 'بنزرت' },
            { name: 'Menzel Bourguiba', nameAr: 'منزل بورقيبة' },
            { name: 'Mateur', nameAr: 'ماطر' },
            { name: 'Sejnane', nameAr: 'سجنان' },
            { name: 'Joumine', nameAr: 'جومين' },
            { name: 'Tinja', nameAr: 'تينجة' },
            { name: 'Ghar El Melh', nameAr: 'غار الملح' },
            { name: 'Menzel Jemil', nameAr: 'منزل جميل' },
            { name: 'Ras Jebel', nameAr: 'رأس الجبل' },
            { name: 'Utique', nameAr: 'أوتيك' },
            { name: 'El Alia', nameAr: 'العالية' }
        ]
    },
    {
        code: 'BE',
        name: 'Béja',
        nameAr: 'باجة',
        cities: [
            { name: 'Béja', nameAr: 'باجة' },
            { name: 'Medjez el-Bab', nameAr: 'مجاز الباب' },
            { name: 'Testour', nameAr: 'تستور' },
            { name: 'Goubellat', nameAr: 'قبلاط' },
            { name: 'Nefza', nameAr: 'نفزة' },
            { name: 'Amdoun', nameAr: 'عمدون' },
            { name: 'Téboursouk', nameAr: 'تبرسق' },
            { name: 'Thibar', nameAr: 'طيبار' }
        ]
    },
    {
        code: 'JE',
        name: 'Jendouba',
        nameAr: 'جندوبة',
        cities: [
            { name: 'Jendouba', nameAr: 'جندوبة' },
            { name: 'Tabarka', nameAr: 'طبرقة' },
            { name: 'Aïn Draham', nameAr: 'عين دراهم' },
            { name: 'Fernana', nameAr: 'فرنانة' },
            { name: 'Bou Salem', nameAr: 'بوسالم' },
            { name: 'Ghardimaou', nameAr: 'غار الدماء' },
            { name: 'Oued Meliz', nameAr: 'وادي مليز' },
            { name: 'Balta-Bou Aouane', nameAr: 'بلطة بوعوان' }
        ]
    },
    {
        code: 'KE',
        name: 'Le Kef',
        nameAr: 'الكاف',
        cities: [
            { name: 'Le Kef', nameAr: 'الكاف' },
            { name: 'Dahmani', nameAr: 'الدهماني' },
            { name: 'El Ksour', nameAr: 'القصور' },
            { name: 'Nebeur', nameAr: 'نبر' },
            { name: 'Sakiet Sidi Youssef', nameAr: 'الساقية سيدي يوسف' },
            { name: 'Tajerouine', nameAr: 'تاجروين' },
            { name: 'Kalaat Senan', nameAr: 'قلعة سنان' },
            { name: 'Kalâat Khasba', nameAr: 'قلعة خصبة' },
            { name: 'Jérissa', nameAr: 'جريصة' },
            { name: 'El Ksour', nameAr: 'القصور' }
        ]
    },
    {
        code: 'SI',
        name: 'Siliana',
        nameAr: 'سليانة',
        cities: [
            { name: 'Siliana', nameAr: 'سليانة' },
            { name: 'Makthar', nameAr: 'مكثر' },
            { name: 'Bou Arada', nameAr: 'بوعرادة' },
            { name: 'Bargou', nameAr: 'برقو' },
            { name: 'El Krib', nameAr: 'الكريب' },
            { name: 'Kesra', nameAr: 'كسرى' },
            { name: 'Rouhia', nameAr: 'الروحية' },
            { name: 'Gaâfour', nameAr: 'قعفور' }
        ]
    },
    {
        code: 'SO',
        name: 'Sousse',
        nameAr: 'سوسة',
        cities: [
            { name: 'Sousse', nameAr: 'سوسة' },
            { name: 'M\'saken', nameAr: 'مساكن' },
            { name: 'Kalâa Kebira', nameAr: 'قلعة الكبرى' },
            { name: 'Kalâa Seghira', nameAr: 'قلعة الصغرى' },
            { name: 'Hammam Sousse', nameAr: 'حمام سوسة' },
            { name: 'Akouda', nameAr: 'أكودة' },
            { name: 'Enfidha', nameAr: 'النفيضة' },
            { name: 'Sidi Bou Ali', nameAr: 'سيدي بوعلي' },
            { name: 'Sidi El Hani', nameAr: 'سيدي الهاني' },
            { name: 'Hergla', nameAr: 'هرقلة' },
            { name: 'Kondar', nameAr: 'قندار' }
        ]
    },
    {
        code: 'MO',
        name: 'Monastir',
        nameAr: 'المنستير',
        cities: [
            { name: 'Monastir', nameAr: 'المنستير' },
            { name: 'Moknine', nameAr: 'المكنين' },
            { name: 'Jammal', nameAr: 'جمال' },
            { name: 'Ksar Hellal', nameAr: 'قصر هلال' },
            { name: 'Téboulba', nameAr: 'طبلبة' },
            { name: 'Bekalta', nameAr: 'بقلطة' },
            { name: 'Bembla', nameAr: 'بنبلة' },
            { name: 'Zeramdine', nameAr: 'زرمدين' },
            { name: 'Sahline', nameAr: 'ساحلين' },
            { name: 'Ksibet el-Médiouni', nameAr: 'قصيبة المديوني' }
        ]
    },
    {
        code: 'MH',
        name: 'Mahdia',
        nameAr: 'المهدية',
        cities: [
            { name: 'Mahdia', nameAr: 'المهدية' },
            { name: 'Ksour Essef', nameAr: 'قصور الساف' },
            { name: 'El Jem', nameAr: 'الجم' },
            { name: 'Chebba', nameAr: 'الشابة' },
            { name: 'Salakta', nameAr: 'سلقطة' },
            { name: 'Sidi Alouane', nameAr: 'سيدي علوان' },
            { name: 'Chorbane', nameAr: 'الشربان' },
            { name: 'Ouled Chamekh', nameAr: 'أولاد الشامخ' },
            { name: 'Melloulech', nameAr: 'ملولش' },
            { name: 'Boumerdès', nameAr: 'بومرداس' }
        ]
    },
    {
        code: 'SF',
        name: 'Sfax',
        nameAr: 'صفاقس',
        cities: [
            { name: 'Sfax', nameAr: 'صفاقس' },
            { name: 'Sakiet Ezzit', nameAr: 'ساقية الزيت' },
            { name: 'Sakiet Eddaïer', nameAr: 'ساقية الدائر' },
            { name: 'El Hencha', nameAr: 'الحنشة' },
            { name: 'Bir Ali Ben Khalifa', nameAr: 'بئر علي بن خليفة' },
            { name: 'Agareb', nameAr: 'عقارب' },
            { name: 'Jebiniana', nameAr: 'جبنيانة' },
            { name: 'Menzel Chaker', nameAr: 'منزل شاكر' },
            { name: 'El Amra', nameAr: 'العامرة' },
            { name: 'Mahres', nameAr: 'المحرس' },
            { name: 'Skhira', nameAr: 'الصخيرة' },
            { name: 'Kerkennah', nameAr: 'قرقنة' }
        ]
    },
    {
        code: 'KR',
        name: 'Kairouan',
        nameAr: 'القيروان',
        cities: [
            { name: 'Kairouan', nameAr: 'القيروان' },
            { name: 'Haffouz', nameAr: 'حفوز' },
            { name: 'Sbikha', nameAr: 'السبيخة' },
            { name: 'Oueslatia', nameAr: 'الوسلاتية' },
            { name: 'Aïn Jloula', nameAr: 'عين جلولة' },
            { name: 'Nasrallah', nameAr: 'نصر الله' },
            { name: 'Chebika', nameAr: 'الشبيكة' },
            { name: 'Echrarda', nameAr: 'الشراردة' },
            { name: 'Bouhajla', nameAr: 'بوحجلة' },
            { name: 'El Ala', nameAr: 'العلا' }
        ]
    },
    {
        code: 'KS',
        name: 'Kasserine',
        nameAr: 'القصرين',
        cities: [
            { name: 'Kasserine', nameAr: 'القصرين' },
            { name: 'Sbeitla', nameAr: 'سبيطلة' },
            { name: 'Thala', nameAr: 'تالة' },
            { name: 'Foussana', nameAr: 'فوسانة' },
            { name: 'Fériana', nameAr: 'فريانة' },
            { name: 'Sbiba', nameAr: 'سبيبة' },
            { name: 'Hidra', nameAr: 'حيدرة' },
            { name: 'Mejel Bel Abbès', nameAr: 'ماجل بالعباس' },
            { name: 'El Ayoun', nameAr: 'العيون' },
            { name: 'Hassi El Ferid', nameAr: 'حاسي الفريد' }
        ]
    },
    {
        code: 'SB',
        name: 'Sidi Bouzid',
        nameAr: 'سيدي بوزيد',
        cities: [
            { name: 'Sidi Bouzid', nameAr: 'سيدي بوزيد' },
            { name: 'Regueb', nameAr: 'الرقاب' },
            { name: 'Jilma', nameAr: 'جلمة' },
            { name: 'Meknassi', nameAr: 'مكناسي' },
            { name: 'Mezzouna', nameAr: 'المزونة' },
            { name: 'Bir El Hafey', nameAr: 'بئر الحفي' },
            { name: 'Sidi Ali Ben Aoun', nameAr: 'سيدي علي بن عون' },
            { name: 'Menzel Bouzaiene', nameAr: 'منزل بوزيان' },
            { name: 'Ouled Haffouz', nameAr: 'أولاد حفوز' },
            { name: 'Souk Jedid', nameAr: 'السوق الجديد' }
        ]
    },
    {
        code: 'GA',
        name: 'Gabès',
        nameAr: 'قابس',
        cities: [
            { name: 'Gabès', nameAr: 'قابس' },
            { name: 'El Hamma', nameAr: 'الحامة' },
            { name: 'Mareth', nameAr: 'مارث' },
            { name: 'Métouia', nameAr: 'المتوية' },
            { name: 'Menzel El Habib', nameAr: 'منزل الحبيب' },
            { name: 'Ghannouche', nameAr: 'الغنوش' },
            { name: 'El Matmata', nameAr: 'مطماطة' },
            { name: 'Nouvelle Matmata', nameAr: 'مطماطة الجديدة' },
            { name: 'Oudhref', nameAr: 'وذرف' }
        ]
    },
    {
        code: 'ME',
        name: 'Médenine',
        nameAr: 'مدنين',
        cities: [
            { name: 'Médenine', nameAr: 'مدنين' },
            { name: 'Zarzis', nameAr: 'جرجيس' },
            { name: 'Ben Gardane', nameAr: 'بن قردان' },
            { name: 'Djerba - Houmt Souk', nameAr: 'جربة حومة السوق' },
            { name: 'Djerba - Midoun', nameAr: 'جربة ميدون' },
            { name: 'Djerba - Ajim', nameAr: 'جربة أجيم' },
            { name: 'Beni Khedache', nameAr: 'بني خداش' },
            { name: 'Sidi Makhlouf', nameAr: 'سيدي مخلوف' }
        ]
    },
    {
        code: 'TA',
        name: 'Tataouine',
        nameAr: 'تطاوين',
        cities: [
            { name: 'Tataouine', nameAr: 'تطاوين' },
            { name: 'Ghomrassen', nameAr: 'غمراسن' },
            { name: 'Bir Lahmar', nameAr: 'بئر الأحمر' },
            { name: 'Remada', nameAr: 'رمادة' },
            { name: 'Dehiba', nameAr: 'ذهيبة' },
            { name: 'Smâr', nameAr: 'سمار' }
        ]
    },
    {
        code: 'GF',
        name: 'Gafsa',
        nameAr: 'قفصة',
        cities: [
            { name: 'Gafsa', nameAr: 'قفصة' },
            { name: 'Métlaoui', nameAr: 'المتلوي' },
            { name: 'Redeyef', nameAr: 'الرديف' },
            { name: 'Mdhilla', nameAr: 'المظيلة' },
            { name: 'El Guettar', nameAr: 'القطار' },
            { name: 'Moularès', nameAr: 'المولارس' },
            { name: 'Sned', nameAr: 'السند' },
            { name: 'El Ksar', nameAr: 'القصر' },
            { name: 'Belkhir', nameAr: 'بالخير' }
        ]
    },
    {
        code: 'TO',
        name: 'Tozeur',
        nameAr: 'توزر',
        cities: [
            { name: 'Tozeur', nameAr: 'توزر' },
            { name: 'Nefta', nameAr: 'نفطة' },
            { name: 'Degache', nameAr: 'دقاش' },
            { name: 'Tamerza', nameAr: 'تمغزة' },
            { name: 'Hazoua', nameAr: 'حزوة' }
        ]
    },
    {
        code: 'KB',
        name: 'Kébili',
        nameAr: 'قبلي',
        cities: [
            { name: 'Kébili', nameAr: 'قبلي' },
            { name: 'Douz', nameAr: 'دوز' },
            { name: 'Souk Lahad', nameAr: 'سوق الأحد' },
            { name: 'El Faouar', nameAr: 'الفوار' },
            { name: 'Zaafrane', nameAr: 'زعفران' }
        ]
    }
];

/**
 * Get cities for a given governorate code
 * @param governorateCode - Governorate code (e.g., 'TU', 'SF')
 * @returns Array of cities or empty array
 */
export function getCitiesByGovernorate(governorateCode: string): TunisiaCity[] {
    const gov = TUNISIA_GOVERNORATES.find(g => g.code === governorateCode);
    return gov ? gov.cities : [];
}

/**
 * Get governorate name by code
 * @param governorateCode - Governorate code
 * @param locale - Language locale ('fr' or 'ar')
 * @returns Governorate name or empty string
 */
export function getGovernorateNameByCode(governorateCode: string, locale: 'fr' | 'ar' = 'fr'): string {
    const gov = TUNISIA_GOVERNORATES.find(g => g.code === governorateCode);
    if (!gov) return '';
    return locale === 'ar' ? gov.nameAr : gov.name;
}
