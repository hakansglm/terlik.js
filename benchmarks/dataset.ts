/**
 * Labeled test corpus for accuracy benchmarking.
 * ~395 examples across 4 languages (TR, EN, ES, DE).
 *
 * Each sample has a ground-truth label (`profane`) and a category tag
 * so we can compute per-category precision / recall / F1.
 */

export interface Sample {
  text: string;
  profane: boolean;
  category:
    | "plain"
    | "variant"
    | "suffixed"
    | "leet"
    | "separator"
    | "repetition"
    | "mixed_case"
    | "number_word"
    | "combined"
    | "clean"
    | "whitelist"
    | "technical"
    | "place_name"
    | "partial_match"
    | "edge_case";
  expectedRoot?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// TURKISH  (~170 samples)
// ---------------------------------------------------------------------------
export const TR_SAMPLES: Sample[] = [
  // --- plain roots (25) ---
  { text: "siktir git buradan", profane: true, category: "plain", expectedRoot: "sik" },
  { text: "orospu cocugu", profane: true, category: "plain", expectedRoot: "orospu" },
  { text: "amk ya", profane: true, category: "plain", expectedRoot: "amk" },
  { text: "pic kurusu", profane: true, category: "plain", expectedRoot: "piç" },
  { text: "yarrak kafa", profane: true, category: "plain", expectedRoot: "yarrak" },
  { text: "got veren", profane: true, category: "plain", expectedRoot: "göt" },
  { text: "amcik herif", profane: true, category: "plain", expectedRoot: "am" },
  { text: "tasak gecme", profane: true, category: "plain", expectedRoot: "taşak" },
  { text: "ibne misin", profane: true, category: "plain", expectedRoot: "ibne" },
  { text: "gavat herif", profane: true, category: "plain", expectedRoot: "gavat" },
  { text: "pezevenk seni", profane: true, category: "plain", expectedRoot: "pezevenk" },
  { text: "boktan bir is", profane: true, category: "plain", expectedRoot: "bok" },
  { text: "salak misin", profane: true, category: "plain", expectedRoot: "salak" },
  { text: "aptal herif", profane: true, category: "plain", expectedRoot: "aptal" },
  { text: "gerizekali adam", profane: true, category: "plain", expectedRoot: "gerizekalı" },
  { text: "mal misin sen", profane: true, category: "plain", expectedRoot: "mal" },
  { text: "dangalak seni", profane: true, category: "plain", expectedRoot: "dangalak" },
  { text: "ezik herif", profane: true, category: "plain", expectedRoot: "ezik" },
  { text: "pust seni", profane: true, category: "plain", expectedRoot: "puşt" },
  { text: "serefsiz adam", profane: true, category: "plain", expectedRoot: "şerefsiz" },
  { text: "yavsak herif", profane: true, category: "plain", expectedRoot: "yavşak" },
  { text: "dol istemiyorum", profane: true, category: "plain", expectedRoot: "döl" },
  { text: "kahpe kadin", profane: true, category: "plain", expectedRoot: "kahpe" },
  { text: "haysiyetsiz adam", profane: true, category: "plain", expectedRoot: "haysiyetsiz" },
  { text: "meme dedi bana", profane: true, category: "plain", expectedRoot: "meme" },

  // --- variants (15) ---
  { text: "orospucocugu seni", profane: true, category: "variant", expectedRoot: "orospu" },
  { text: "aminakoyim ya", profane: true, category: "variant", expectedRoot: "amk" },
  { text: "dalyarak herif", profane: true, category: "variant", expectedRoot: "yarrak" },
  { text: "gotlek adam", profane: true, category: "variant", expectedRoot: "göt" },
  { text: "sikimsonik laf", profane: true, category: "variant", expectedRoot: "sik" },
  { text: "tassak gecme", profane: true, category: "variant", expectedRoot: "taşak" },
  { text: "piclik yapma", profane: true, category: "variant", expectedRoot: "piç" },
  { text: "gavatlik bu", profane: true, category: "variant", expectedRoot: "gavat" },
  { text: "salaklik etme", profane: true, category: "variant", expectedRoot: "salak" },
  { text: "aptallik yapma", profane: true, category: "variant", expectedRoot: "aptal" },
  { text: "kahpelik bu", profane: true, category: "variant", expectedRoot: "kahpe" },
  { text: "gotveren seni", profane: true, category: "variant", expectedRoot: "göt" },
  { text: "oruspu musun", profane: true, category: "variant", expectedRoot: "orospu" },
  { text: "amcuk lafini", profane: true, category: "variant", expectedRoot: "am" },
  { text: "serefsizler hepsi", profane: true, category: "variant", expectedRoot: "şerefsiz" },

  // --- suffixed forms (18) ---
  { text: "siktiler hepsini", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "sikerim seni", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "orospuluk yapma", profane: true, category: "suffixed", expectedRoot: "orospu" },
  { text: "gotune sokayim", profane: true, category: "suffixed", expectedRoot: "göt" },
  { text: "ibnelik etme", profane: true, category: "suffixed", expectedRoot: "ibne" },
  { text: "kahpeler toplandi", profane: true, category: "suffixed", expectedRoot: "kahpe" },
  { text: "yavsaklik yapiyorsun", profane: true, category: "suffixed", expectedRoot: "yavşak" },
  { text: "aptallarin isi", profane: true, category: "suffixed", expectedRoot: "aptal" },
  { text: "siktirler gitsin", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "pezevenkleri kov", profane: true, category: "suffixed", expectedRoot: "pezevenk" },
  { text: "salaksin sen", profane: true, category: "suffixed", expectedRoot: "salak" },
  { text: "ezikler hepsi", profane: true, category: "suffixed", expectedRoot: "ezik" },
  { text: "dangalaklar geldi", profane: true, category: "suffixed", expectedRoot: "dangalak" },
  { text: "sikeyim hayati", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "sikiyor musun", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "sikmis adam", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "sikecek misin", profane: true, category: "suffixed", expectedRoot: "sik" },
  { text: "gerizekalilar burda", profane: true, category: "suffixed", expectedRoot: "gerizekalı" },

  // --- leet speak (12) ---
  { text: "$1kt1r git", profane: true, category: "leet", expectedRoot: "sik" },
  { text: "@pt@l herif", profane: true, category: "leet", expectedRoot: "aptal" },
  { text: "0r0spu cocugu", profane: true, category: "leet", expectedRoot: "orospu" },
  { text: "b0kt@n bir gun", profane: true, category: "leet", expectedRoot: "bok" },
  { text: "p1c kurusu", profane: true, category: "leet", expectedRoot: "piç" },
  { text: "y@rr@k kafa", profane: true, category: "leet", expectedRoot: "yarrak" },
  { text: "g0t veren", profane: true, category: "leet", expectedRoot: "göt" },
  { text: "1bn3 misin", profane: true, category: "leet", expectedRoot: "ibne" },
  { text: "pu$t seni", profane: true, category: "leet", expectedRoot: "puşt" },
  { text: "$3r3f$1z adam", profane: true, category: "leet", expectedRoot: "şerefsiz" },
  { text: "pez3v3nk seni", profane: true, category: "leet", expectedRoot: "pezevenk" },
  { text: "k@hp3 kadin", profane: true, category: "leet", expectedRoot: "kahpe" },

  // --- separator evasion (8) ---
  { text: "s.i.k.t.i.r git", profane: true, category: "separator", expectedRoot: "sik" },
  { text: "o r o s p u cocugu", profane: true, category: "separator", expectedRoot: "orospu" },
  { text: "s_i_k lan", profane: true, category: "separator", expectedRoot: "sik" },
  { text: "a.p.t.a.l herif", profane: true, category: "separator", expectedRoot: "aptal" },
  { text: "y-a-r-r-a-k kafa", profane: true, category: "separator", expectedRoot: "yarrak" },
  { text: "g.o.t veren", profane: true, category: "separator", expectedRoot: "göt" },
  { text: "b_o_k_t_a_n is", profane: true, category: "separator", expectedRoot: "bok" },
  { text: "p.i.c kurusu", profane: true, category: "separator", expectedRoot: "piç" },

  // --- repetition (6) ---
  { text: "siiiiiktir git", profane: true, category: "repetition", expectedRoot: "sik" },
  { text: "orooospu cocugu", profane: true, category: "repetition", expectedRoot: "orospu" },
  { text: "pu$ttt seni", profane: true, category: "repetition", expectedRoot: "puşt" },
  { text: "bokkktan gun", profane: true, category: "repetition", expectedRoot: "bok" },
  { text: "aptttal herif", profane: true, category: "repetition", expectedRoot: "aptal" },
  { text: "salaaak misin", profane: true, category: "repetition", expectedRoot: "salak" },

  // --- mixed case (6) ---
  { text: "SiKtIr GiT", profane: true, category: "mixed_case", expectedRoot: "sik" },
  { text: "OROSPU COCUGU", profane: true, category: "mixed_case", expectedRoot: "orospu" },
  { text: "ApTaL hErIf", profane: true, category: "mixed_case", expectedRoot: "aptal" },
  { text: "BOKTAN gun", profane: true, category: "mixed_case", expectedRoot: "bok" },
  { text: "Kahpe KADIN", profane: true, category: "mixed_case", expectedRoot: "kahpe" },
  { text: "YAVSAK herif", profane: true, category: "mixed_case", expectedRoot: "yavşak" },

  // --- number word (5) ---
  { text: "s2mle yuzles", profane: true, category: "number_word", expectedRoot: "sik", note: "s+iki+mle via number expansion" },
  { text: "s2k lan", profane: true, category: "number_word", expectedRoot: "sik", note: "s+iki+k" },
  { text: "i8ne misin", profane: true, category: "number_word", expectedRoot: "ibne", note: "i+sekiz+ne" },
  { text: "6öt veren", profane: true, category: "number_word", expectedRoot: "göt", note: "alti+öt" },
  { text: "8ok gibi", profane: true, category: "number_word", expectedRoot: "bok", note: "sekiz+ok" },

  // --- combined evasion (8) ---
  { text: "$1kt1r g0t_v3r3n", profane: true, category: "combined", expectedRoot: "sik", note: "leet + separator" },
  { text: "S.İ.K.T.İ.R.L.E.R", profane: true, category: "combined", expectedRoot: "sik", note: "separator + mixed case" },
  { text: "0r*spu cocugu", profane: true, category: "combined", expectedRoot: "orospu", note: "leet + separator" },
  { text: "B.O.K.T.A.N gun", profane: true, category: "combined", expectedRoot: "bok", note: "separator + mixed case" },
  { text: "@pT@L herif", profane: true, category: "combined", expectedRoot: "aptal", note: "leet + mixed case" },
  { text: "s_1_k_t_1_r git", profane: true, category: "combined", expectedRoot: "sik", note: "separator + leet" },
  { text: "ORRROSPU cocugu", profane: true, category: "combined", expectedRoot: "orospu", note: "repetition + mixed case" },
  { text: "pu$$ttt seni", profane: true, category: "combined", expectedRoot: "puşt", note: "leet + repetition" },

  // --- clean sentences (20) ---
  { text: "merhaba dunya nasilsin", profane: false, category: "clean" },
  { text: "bugun hava cok guzel", profane: false, category: "clean" },
  { text: "istanbul guzel sehir", profane: false, category: "clean" },
  { text: "yarin toplanti var", profane: false, category: "clean" },
  { text: "kahvalti hazirliyorum", profane: false, category: "clean" },
  { text: "ders calisiyorum simdiki", profane: false, category: "clean" },
  { text: "tatile cikacagiz", profane: false, category: "clean" },
  { text: "bu kitap cok guzel", profane: false, category: "clean" },
  { text: "annem yemek yapiyor", profane: false, category: "clean" },
  { text: "okula gidiyorum", profane: false, category: "clean" },
  { text: "araba cok hizli gidiyor", profane: false, category: "clean" },
  { text: "futbol macini izliyoruz", profane: false, category: "clean" },
  { text: "bilgisayar programi yaziyorum", profane: false, category: "clean" },
  { text: "telefon caliyor", profane: false, category: "clean" },
  { text: "aksam yemegi hazir", profane: false, category: "clean" },
  { text: "sinav sonuclari aciklandi", profane: false, category: "clean" },
  { text: "havaalani cok kalabalik", profane: false, category: "clean" },
  { text: "kutuphaneye gidelim", profane: false, category: "clean" },
  { text: "muzik dinliyorum simdi", profane: false, category: "clean" },
  { text: "bos vakit geciriyoruz", profane: false, category: "clean" },

  // --- whitelist (25) ---
  { text: "amsterdam guzel sehir", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "sikke koleksiyonu", profane: false, category: "whitelist", note: "contains 'sik'" },
  { text: "ambulans geldi hemen", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "siklet sinifi agir", profane: false, category: "whitelist", note: "contains 'sik'" },
  { text: "memur bey gelin", profane: false, category: "whitelist", note: "contains 'meme'" },
  { text: "malzeme deposu dolu", profane: false, category: "whitelist", note: "contains 'mal'" },
  { text: "ameliyat basarili gecti", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "ampul patladi evde", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "boksör ringte kazandi", profane: false, category: "whitelist", note: "contains 'bok'" },
  { text: "ambalaj kagidi lazim", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "amonyak kokuyor burasi", profane: false, category: "whitelist", note: "contains 'am'" },
  { text: "dolunay bu gece var", profane: false, category: "whitelist", note: "contains 'döl'" },
  { text: "gotik mimari cok guzel", profane: false, category: "whitelist", note: "contains 'göt'" },
  { text: "piknik yapacagiz yarin", profane: false, category: "whitelist", note: "contains 'piç'" },
  { text: "maliyet analizi yaptik", profane: false, category: "whitelist", note: "contains 'mal'" },
  { text: "malta adasi guzel", profane: false, category: "whitelist", note: "contains 'mal'" },
  { text: "kasim ayinda gidelim", profane: false, category: "whitelist", note: "starts with 'kas'" },
  { text: "yarasa gece ucuyor", profane: false, category: "whitelist", note: "contains 'yar'" },
  { text: "memento filmi izledim", profane: false, category: "whitelist", note: "contains 'meme'" },
  { text: "memleket hasreti var", profane: false, category: "whitelist", note: "contains 'meme'" },
  { text: "ama ben istemedim ki", profane: false, category: "whitelist", note: "'ama' conjunction" },
  { text: "amir bey burada mi", profane: false, category: "whitelist", note: "'amir'" },
  { text: "dolmen taslarindan biri", profane: false, category: "whitelist", note: "'dolmen'" },
  { text: "amper degeri olcuyoruz", profane: false, category: "whitelist", note: "'amper'" },
  { text: "malikane cok buyuk", profane: false, category: "whitelist", note: "'malikane'" },

  // --- technical terms (8) ---
  { text: "sikilasmak lazim burada", profane: false, category: "technical", note: "sikilasma whitelisted" },
  { text: "masikler hakkinda bilgi", profane: false, category: "technical", note: "masikler whitelisted" },
  { text: "dolum islemi tamamlandi", profane: false, category: "technical", note: "dolum whitelisted" },
  { text: "doluluk orani yuzde elli", profane: false, category: "technical", note: "doluluk whitelisted" },
  { text: "amateur fotografci", profane: false, category: "technical", note: "amateur whitelisted" },
  { text: "amino asit iceriyor", profane: false, category: "technical", note: "amino whitelisted" },
  { text: "amele isciler calisiyor", profane: false, category: "technical", note: "amele whitelisted" },
  { text: "amerika seyahati planla", profane: false, category: "technical", note: "amerika whitelisted" },

  // --- place names (4) ---
  { text: "gotham sehrine gidecegiz", profane: false, category: "place_name", note: "gotham whitelisted" },
  { text: "mallorca tatili planla", profane: false, category: "place_name", note: "mallorca whitelisted" },
  { text: "gotan muzigi dinle", profane: false, category: "place_name", note: "gotan whitelisted" },
  { text: "ambassador otelde kalacagiz", profane: false, category: "place_name", note: "ambassador whitelisted" },

  // --- edge cases (8) ---
  { text: "", profane: false, category: "edge_case", note: "empty string" },
  { text: "   ", profane: false, category: "edge_case", note: "whitespace only" },
  { text: "a", profane: false, category: "edge_case", note: "single char" },
  { text: "12345", profane: false, category: "edge_case", note: "numbers only" },
  { text: "!@#$%^&*()", profane: false, category: "edge_case", note: "symbols only" },
  { text: "normal cumle sik yazi", profane: true, category: "edge_case", expectedRoot: "sik", note: "profanity embedded in normal text" },
  { text: "bu bir test cumlesidir ve cok uzun bir cumle olabilir ama icerisinde hicbir kufur yoktur sadece normal kelimeler vardir", profane: false, category: "edge_case", note: "long clean text" },
  { text: "sik sik sik sik sik", profane: true, category: "edge_case", expectedRoot: "sik", note: "repeated profanity" },
];

// ---------------------------------------------------------------------------
// ENGLISH  (~120 samples)
// ---------------------------------------------------------------------------
export const EN_SAMPLES: Sample[] = [
  // --- plain roots (18) ---
  { text: "fuck you man", profane: true, category: "plain", expectedRoot: "fuck" },
  { text: "this is bullshit", profane: true, category: "plain", expectedRoot: "shit" },
  { text: "what an asshole", profane: true, category: "plain", expectedRoot: "asshole" },
  { text: "you stupid bitch", profane: true, category: "plain", expectedRoot: "bitch" },
  { text: "dirty bastard", profane: true, category: "plain", expectedRoot: "bastard" },
  { text: "suck my dick", profane: true, category: "plain", expectedRoot: "dick" },
  { text: "nice cock bro", profane: true, category: "plain", expectedRoot: "cock" },
  { text: "stupid cunt", profane: true, category: "plain", expectedRoot: "cunt" },
  { text: "she is a whore", profane: true, category: "plain", expectedRoot: "whore" },
  { text: "what a slut", profane: true, category: "plain", expectedRoot: "slut" },
  { text: "piss off mate", profane: true, category: "plain", expectedRoot: "piss" },
  { text: "wank off loser", profane: true, category: "plain", expectedRoot: "wank" },
  { text: "shut up twat", profane: true, category: "plain", expectedRoot: "twat" },
  { text: "what a load of crap", profane: true, category: "plain", expectedRoot: "crap" },
  { text: "damn this thing", profane: true, category: "plain", expectedRoot: "damn" },
  { text: "you retard", profane: true, category: "plain", expectedRoot: "retard" },
  { text: "that douchebag", profane: true, category: "plain", expectedRoot: "douche" },
  { text: "bollocks to that", profane: true, category: "plain", expectedRoot: "bollocks" },

  // --- variants (15) ---
  { text: "what the fucking hell", profane: true, category: "variant", expectedRoot: "fuck" },
  { text: "motherfucker listen", profane: true, category: "variant", expectedRoot: "fuck" },
  { text: "shitty day today", profane: true, category: "variant", expectedRoot: "shit" },
  { text: "dipshit over there", profane: true, category: "variant", expectedRoot: "shit" },
  { text: "stupid bitches everywhere", profane: true, category: "variant", expectedRoot: "bitch" },
  { text: "cocksucker alert", profane: true, category: "variant", expectedRoot: "cock" },
  { text: "dickhead move bro", profane: true, category: "variant", expectedRoot: "dick" },
  { text: "retarded idea", profane: true, category: "variant", expectedRoot: "retard" },
  { text: "shut up faggot", profane: true, category: "variant", expectedRoot: "faggot" },
  { text: "pissed off again", profane: true, category: "variant", expectedRoot: "piss" },
  { text: "wanker thinks he is smart", profane: true, category: "variant", expectedRoot: "wanker" },
  { text: "slutty outfit", profane: true, category: "variant", expectedRoot: "slut" },
  { text: "dammit all", profane: true, category: "variant", expectedRoot: "damn" },
  { text: "clusterfuck situation", profane: true, category: "variant", expectedRoot: "fuck" },
  { text: "horseshit excuse", profane: true, category: "variant", expectedRoot: "shit" },

  // --- suffixed (8) ---
  { text: "fucking awesome dude", profane: true, category: "suffixed", expectedRoot: "fuck" },
  { text: "shitting bricks here", profane: true, category: "suffixed", expectedRoot: "shit" },
  { text: "bitching about it", profane: true, category: "suffixed", expectedRoot: "bitch" },
  { text: "pissing me off", profane: true, category: "suffixed", expectedRoot: "piss" },
  { text: "wanking material", profane: true, category: "suffixed", expectedRoot: "wank" },
  { text: "whoring around town", profane: true, category: "suffixed", expectedRoot: "whore" },
  { text: "cunts everywhere", profane: true, category: "suffixed", expectedRoot: "cunt" },
  { text: "crappy performance", profane: true, category: "suffixed", expectedRoot: "crap" },

  // --- leet speak (8) ---
  { text: "fvck you buddy", profane: true, category: "leet", expectedRoot: "fuck" },
  { text: "sh1t happens dude", profane: true, category: "leet", expectedRoot: "shit" },
  { text: "b1tch please", profane: true, category: "leet", expectedRoot: "bitch" },
  { text: "d1ck move bro", profane: true, category: "leet", expectedRoot: "dick" },
  { text: "@sshole right there", profane: true, category: "leet", expectedRoot: "asshole" },
  { text: "fuk this thing", profane: true, category: "leet", expectedRoot: "fuck" },
  { text: "sht happens", profane: true, category: "leet", expectedRoot: "shit" },
  { text: "c0ck blocker", profane: true, category: "leet", expectedRoot: "cock" },

  // --- separator (5) ---
  { text: "f.u.c.k you", profane: true, category: "separator", expectedRoot: "fuck" },
  { text: "s_h_i_t happens", profane: true, category: "separator", expectedRoot: "shit" },
  { text: "b i t c h please", profane: true, category: "separator", expectedRoot: "bitch" },
  { text: "c.u.n.t alert", profane: true, category: "separator", expectedRoot: "cunt" },
  { text: "d-i-c-k move", profane: true, category: "separator", expectedRoot: "dick" },

  // --- repetition (4) ---
  { text: "fuuuuck this", profane: true, category: "repetition", expectedRoot: "fuck" },
  { text: "shiiiit man", profane: true, category: "repetition", expectedRoot: "shit" },
  { text: "biiiitch please", profane: true, category: "repetition", expectedRoot: "bitch" },
  { text: "daaaamn son", profane: true, category: "repetition", expectedRoot: "damn" },

  // --- mixed case (4) ---
  { text: "FuCk YoU", profane: true, category: "mixed_case", expectedRoot: "fuck" },
  { text: "SHIT happens", profane: true, category: "mixed_case", expectedRoot: "shit" },
  { text: "BiTcH please", profane: true, category: "mixed_case", expectedRoot: "bitch" },
  { text: "AsShoLe move", profane: true, category: "mixed_case", expectedRoot: "asshole" },

  // --- combined (3) ---
  { text: "F.U.C.K.I.N.G hell", profane: true, category: "combined", expectedRoot: "fuck", note: "separator + mixed case" },
  { text: "SH1T happens bro", profane: true, category: "combined", expectedRoot: "shit", note: "leet + mixed case" },
  { text: "fuuuucking hell", profane: true, category: "combined", expectedRoot: "fuck", note: "repetition + suffixed" },

  // --- clean (20) ---
  { text: "hello world how are you", profane: false, category: "clean" },
  { text: "the weather is nice today", profane: false, category: "clean" },
  { text: "i love programming", profane: false, category: "clean" },
  { text: "lets go to the movies", profane: false, category: "clean" },
  { text: "dinner is almost ready", profane: false, category: "clean" },
  { text: "the project deadline is tomorrow", profane: false, category: "clean" },
  { text: "can you help me with this", profane: false, category: "clean" },
  { text: "great job on the presentation", profane: false, category: "clean" },
  { text: "we need to schedule a meeting", profane: false, category: "clean" },
  { text: "the report looks good", profane: false, category: "clean" },
  { text: "happy birthday to you", profane: false, category: "clean" },
  { text: "the concert was amazing", profane: false, category: "clean" },
  { text: "lets grab some coffee", profane: false, category: "clean" },
  { text: "the kids are playing outside", profane: false, category: "clean" },
  { text: "traffic is terrible today", profane: false, category: "clean" },
  { text: "i finished reading the book", profane: false, category: "clean" },
  { text: "the garden needs watering", profane: false, category: "clean" },
  { text: "she passed the exam with honors", profane: false, category: "clean" },
  { text: "the flight was delayed", profane: false, category: "clean" },
  { text: "have a wonderful weekend", profane: false, category: "clean" },

  // --- whitelist (20) ---
  { text: "the assassin creed game", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "first class ticket please", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "cut the grass today", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "massive earthquake hit", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "the passport expired", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "bass guitar solo", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "passionate about music", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "dickens novel collection", profane: false, category: "whitelist", note: "contains 'dick'" },
  { text: "cocktail party tonight", profane: false, category: "whitelist", note: "contains 'cock'" },
  { text: "peacock feathers are beautiful", profane: false, category: "whitelist", note: "contains 'cock'" },
  { text: "assume nothing in code", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "the assignment is due", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "scrap metal recycling", profane: false, category: "whitelist", note: "contains 'crap'" },
  { text: "embassy called back", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "cassette player vintage", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "hassle free returns", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "compass points north", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "massage feels great", profane: false, category: "whitelist", note: "contains 'ass'" },
  { text: "cockatoo bird species", profane: false, category: "whitelist", note: "contains 'cock'" },
  { text: "assembly line production", profane: false, category: "whitelist", note: "contains 'ass'" },

  // --- technical (6) ---
  { text: "hancock signed the document", profane: false, category: "technical", note: "hancock whitelisted" },
  { text: "piston engine mechanics", profane: false, category: "technical", note: "piston whitelisted" },
  { text: "bassist in the band", profane: false, category: "technical", note: "bassist whitelisted" },
  { text: "trespass warning sign", profane: false, category: "technical", note: "trespass whitelisted" },
  { text: "document classification system", profane: false, category: "technical", note: "document whitelisted" },
  { text: "lasso the variables in R", profane: false, category: "technical", note: "lasso whitelisted" },

  // --- edge cases (4) ---
  { text: "", profane: false, category: "edge_case", note: "empty string" },
  { text: "   ", profane: false, category: "edge_case", note: "whitespace only" },
  { text: "this is a normal sentence with fuck in the middle", profane: true, category: "edge_case", expectedRoot: "fuck", note: "profanity embedded" },
  { text: "absolutely fantastic work on the project presentation", profane: false, category: "edge_case", note: "long clean text" },
];

// ---------------------------------------------------------------------------
// SPANISH  (~55 samples)
// ---------------------------------------------------------------------------
export const ES_SAMPLES: Sample[] = [
  // --- profane (30) ---
  { text: "vete a la mierda", profane: true, category: "plain", expectedRoot: "mierda" },
  { text: "hijo de puta", profane: true, category: "plain", expectedRoot: "puta" },
  { text: "eres un cabron", profane: true, category: "plain", expectedRoot: "cabron" },
  { text: "joder tio", profane: true, category: "plain", expectedRoot: "joder" },
  { text: "que coño haces", profane: true, category: "plain", expectedRoot: "coño" },
  { text: "chupa la verga", profane: true, category: "plain", expectedRoot: "verga" },
  { text: "no me chingues", profane: true, category: "plain", expectedRoot: "chingar" },
  { text: "pinche idiota", profane: true, category: "plain", expectedRoot: "pinche" },
  { text: "pendejo estupido", profane: true, category: "plain", expectedRoot: "pendejo" },
  { text: "marica de mierda", profane: true, category: "plain", expectedRoot: "marica" },
  { text: "carajo otra vez", profane: true, category: "plain", expectedRoot: "carajo" },
  { text: "culo gordo", profane: true, category: "plain", expectedRoot: "culo" },
  { text: "zorra maldita", profane: true, category: "plain", expectedRoot: "zorra" },
  { text: "eres un imbecil", profane: true, category: "plain", expectedRoot: "imbecil" },
  { text: "gilipollas total", profane: true, category: "plain", expectedRoot: "gilipollas" },
  { text: "huevon de mierda", profane: true, category: "plain", expectedRoot: "huevon" },
  { text: "que mamada es esa", profane: true, category: "plain", expectedRoot: "mamada" },
  { text: "chingado asunto", profane: true, category: "variant", expectedRoot: "chingar" },
  { text: "putada enorme", profane: true, category: "variant", expectedRoot: "puta" },
  { text: "jodido problema", profane: true, category: "variant", expectedRoot: "joder" },
  { text: "cabronada total", profane: true, category: "variant", expectedRoot: "cabron" },
  { text: "mierdoso lugar", profane: true, category: "variant", expectedRoot: "mierda" },
  { text: "pendejada pura", profane: true, category: "variant", expectedRoot: "pendejo" },
  { text: "maricon cobarde", profane: true, category: "variant", expectedRoot: "marica" },
  { text: "hijoputa descarado", profane: true, category: "variant", expectedRoot: "puta" },
  { text: "estupida decision", profane: true, category: "variant", expectedRoot: "estupido" },
  { text: "chingona actitud", profane: true, category: "variant", expectedRoot: "chingar" },
  { text: "MIERDA total", profane: true, category: "mixed_case", expectedRoot: "mierda" },
  { text: "PUTA madre", profane: true, category: "mixed_case", expectedRoot: "puta" },
  { text: "vete al CARAJO", profane: true, category: "mixed_case", expectedRoot: "carajo" },

  // --- clean (25) ---
  { text: "hola como estas", profane: false, category: "clean" },
  { text: "buenos dias amigo", profane: false, category: "clean" },
  { text: "el tiempo esta bonito", profane: false, category: "clean" },
  { text: "vamos al cine esta noche", profane: false, category: "clean" },
  { text: "la comida esta deliciosa", profane: false, category: "clean" },
  { text: "me gusta la musica", profane: false, category: "clean" },
  { text: "el libro es interesante", profane: false, category: "clean" },
  { text: "necesito estudiar mas", profane: false, category: "clean" },
  { text: "que tengas buen dia", profane: false, category: "clean" },
  { text: "la casa es grande", profane: false, category: "clean" },
  { text: "computadora nueva funciona bien", profane: false, category: "whitelist", note: "computadora whitelisted" },
  { text: "disputar el resultado", profane: false, category: "whitelist", note: "disputar whitelisted" },
  { text: "la reputacion es importante", profane: false, category: "whitelist", note: "reputacion whitelisted" },
  { text: "imputar cargos al acusado", profane: false, category: "whitelist", note: "imputar whitelisted" },
  { text: "calcular el presupuesto", profane: false, category: "whitelist", note: "calcular whitelisted" },
  { text: "vehicular trafico pesado", profane: false, category: "whitelist", note: "vehicular whitelisted" },
  { text: "particular situacion aqui", profane: false, category: "whitelist", note: "particular whitelisted" },
  { text: "articulo de prensa reciente", profane: false, category: "whitelist", note: "articulo whitelisted" },
  { text: "maricopa condado arizona", profane: false, category: "whitelist", note: "maricopa whitelisted" },
  { text: "putamen cerebral importante", profane: false, category: "whitelist", note: "putamen whitelisted" },
  { text: "trabajando en el proyecto", profane: false, category: "clean" },
  { text: "el perro esta jugando", profane: false, category: "clean" },
  { text: "tenemos reunion manana", profane: false, category: "clean" },
  { text: "hace calor hoy afuera", profane: false, category: "clean" },
  { text: "la playa esta hermosa", profane: false, category: "clean" },
];

// ---------------------------------------------------------------------------
// GERMAN  (~50 samples)
// ---------------------------------------------------------------------------
export const DE_SAMPLES: Sample[] = [
  // --- profane (27) ---
  { text: "scheiße nochmal", profane: true, category: "plain", expectedRoot: "scheiße" },
  { text: "fick dich", profane: true, category: "plain", expectedRoot: "fick" },
  { text: "du arschloch", profane: true, category: "plain", expectedRoot: "arsch" },
  { text: "hurensohn elender", profane: true, category: "plain", expectedRoot: "hurensohn" },
  { text: "du hure", profane: true, category: "plain", expectedRoot: "hure" },
  { text: "fotze dreckige", profane: true, category: "plain", expectedRoot: "fotze" },
  { text: "wichser armer", profane: true, category: "plain", expectedRoot: "wichser" },
  { text: "schwanz lutscher", profane: true, category: "plain", expectedRoot: "schwanz" },
  { text: "du schlampe", profane: true, category: "plain", expectedRoot: "schlampe" },
  { text: "mistkerl gemeiner", profane: true, category: "plain", expectedRoot: "mistkerl" },
  { text: "du idiot", profane: true, category: "plain", expectedRoot: "idiot" },
  { text: "dumm wie brot", profane: true, category: "plain", expectedRoot: "dumm" },
  { text: "du depp", profane: true, category: "plain", expectedRoot: "depp" },
  { text: "vollidiot sag ich", profane: true, category: "plain", expectedRoot: "vollidiot" },
  { text: "missgeburt elende", profane: true, category: "plain", expectedRoot: "missgeburt" },
  { text: "drecksau hier", profane: true, category: "plain", expectedRoot: "drecksau" },
  { text: "dreckig und gemein", profane: true, category: "plain", expectedRoot: "dreck" },
  { text: "trottel bist du", profane: true, category: "plain", expectedRoot: "trottel" },
  { text: "scheiss drauf", profane: true, category: "variant", expectedRoot: "scheiße" },
  { text: "gefickt worden", profane: true, category: "variant", expectedRoot: "fick" },
  { text: "beschissen gelaufen", profane: true, category: "variant", expectedRoot: "scheiße" },
  { text: "arschgeige spielst du", profane: true, category: "variant", expectedRoot: "arsch" },
  { text: "dummkopf bist du", profane: true, category: "variant", expectedRoot: "dumm" },
  { text: "gewichst heute morgen", profane: true, category: "variant", expectedRoot: "wichser" },
  { text: "SCHEISSE verdammt", profane: true, category: "mixed_case", expectedRoot: "scheiße" },
  { text: "FICK dich weg", profane: true, category: "mixed_case", expectedRoot: "fick" },
  { text: "schlampig gemacht", profane: true, category: "variant", expectedRoot: "schlampe" },

  // --- clean (23) ---
  { text: "guten morgen zusammen", profane: false, category: "clean" },
  { text: "wie geht es dir", profane: false, category: "clean" },
  { text: "das wetter ist schon", profane: false, category: "clean" },
  { text: "ich gehe einkaufen", profane: false, category: "clean" },
  { text: "der film war toll", profane: false, category: "clean" },
  { text: "wir treffen uns morgen", profane: false, category: "clean" },
  { text: "das essen schmeckt gut", profane: false, category: "clean" },
  { text: "die arbeit ist fertig", profane: false, category: "clean" },
  { text: "heute ist ein guter tag", profane: false, category: "clean" },
  { text: "die kinder spielen draussen", profane: false, category: "clean" },
  { text: "ich lese ein buch", profane: false, category: "clean" },
  { text: "der zug kommt bald", profane: false, category: "clean" },
  { text: "schule beginnt um acht", profane: false, category: "clean" },
  { text: "die blumen sind schon", profane: false, category: "clean" },
  { text: "wir fahren in den urlaub", profane: false, category: "clean" },
  { text: "das konzert war super", profane: false, category: "clean" },
  { text: "ich brauche einen kaffee", profane: false, category: "clean" },
  { text: "der berg ist hoch", profane: false, category: "clean" },
  { text: "ficktion literarisches werk", profane: false, category: "whitelist", note: "ficktion whitelisted" },
  { text: "schwanzen wir die schule", profane: false, category: "whitelist", note: "schwanzen whitelisted" },
  { text: "programmierung macht spass", profane: false, category: "clean" },
  { text: "die katze schläft ruhig", profane: false, category: "clean" },
  { text: "wandern in den alpen", profane: false, category: "clean" },
];

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

export interface LangDataset {
  lang: string;
  samples: Sample[];
}

export const ALL_DATASETS: LangDataset[] = [
  { lang: "tr", samples: TR_SAMPLES },
  { lang: "en", samples: EN_SAMPLES },
  { lang: "es", samples: ES_SAMPLES },
  { lang: "de", samples: DE_SAMPLES },
];

export function totalSamples(): number {
  return ALL_DATASETS.reduce((sum, d) => sum + d.samples.length, 0);
}
