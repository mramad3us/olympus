// OLYMPUS data: the name pools, by culture and sex, and the blocklist (SETTING §12; PEOPLE §3.5; TECH correction 11).
//
// Copied from LONGHAUL (`js/sim/names.js`: GIVEN 344, FAMILY 387, MARS_FOUNDER 83, the system-wide
// melting pot and the old Martian families; `js/sim/careers.js` lines 93 to 107: the given names by
// home, Earth, Mars, Belt, Luna, Jovian), with SETTING §12.1's changes: the Mars list loses "Bobbie"
// and gains ten dome names (45 in all), the Belt list loses "Naomi", "Camina", "Sadavir" and "Diogo"
// and gains twenty-two, and the valley's own lists are new (44 given, 48 family). SETTING §12.2 asks
// for given names split by sex "where a name is conventionally one (a sex tag per entry, any for names
// worn by both)": LONGHAUL's lists carry no tags, so the split below is mine, by each name's usual use
// (Kai, Wren, Quinn, Jun, Kiran and the like are `any`). A pool is three word lists, f, m and any; a
// woman draws from f and any, a man from m and any, evenly (personName in src/sim/people/names.js).
//
// CULTURES (SETTING §12.1) say which pools a culture draws from and how often: `mars-valley` draws
// its given name from the valley list at 60%, the dome list at 15% and GIVEN at 25%, its family name
// from the valley list at 45%, FAMILY at 50% and MARS_FOUNDER at 5%; `mars-dome` from the dome list
// and MARS_FOUNDER at 20% (40% for a Londres Nova home: `founderLondres`), else FAMILY; `jovian`,
// `belter` and `earther` from their LONGHAUL lists (Earth's with GIVEN beside it) and FAMILY.
// BLOCKED_FULL are SETTING §12.6's canon full names, never generated; BLOCKED_FAMILY_T12 the family
// names never given to tier 1 or 2. NICKS are SETTING §12.3's pools (keyed by surname pun, home, body
// and irony; deeds come later, when a squad coins one after an event). Data only: nothing here draws.

const words = (s) => Object.freeze([...new Set(s.split(',').map(w => w.trim()).filter(Boolean))]);
const pool = (f, m, any) => Object.freeze({ f: words(f), m: words(m), any: words(any) });

/** LONGHAUL's GIVEN, the melting pot (344), split by sex (my call). */
export const GIVEN = pool(`
  Amara, Ngozi, Ama, Abena, Folake, Adaeze, Zainab, Amina, Fatima, Aisha, Halima, Layla, Samira, Nadia, Leila, Shirin, Parisa, Farah,
  Selin, Elif, Aylin, Agnieszka, Kasia, Irina, Natalia, Olga, Yelena, Anya, Mirela, Vesna, Jana, Petra, Greta, Ingrid, Sigrid, Astrid,
  Freya, Aino, Saara, Niamh, Siobhan, Aoife, Bronwyn, Isla, Fiona, Elodie, Margaux, Aurelie, Giulia, Chiara, Bianca, Sofia, Paola, Ines,
  Beatriz, Rafaela, Luana, Camila, Valentina, Ximena, Lucia, Esperanza, Marisol, Quilla, Nayeli, Citlali, Itzel, Mabel, Agnes, Edith,
  Harriet, Winifred, Rosalind, Beatrix, Cordelia, Josephine, Theodora, Hazel, Ruth, Martha, Clara, Eleanor, Frances, Violet, June, Mae,
  Hattie, Abigail, Mei, Xiu, Jing, Haruka, Sakura, Emiko, Noriko, Seoyeon, Hyejin, Priya, Anjali, Meera, Lakshmi, Deepa, Kavya, Aditi,
  Sunita, Tahmina, Nusrat, Linh, Huong, Malee, Dewi, Putri, Sari, Marisa, Ligaya, Mahina, Leilani, Aroha, Mere, Losa, Malia, Talia,
  Thandiwe, Nomvula, Zodwa, Lindiwe, Lerato, Rudo, Wanjiru, Njeri, Achieng, Zawadi, Neema, Asha, Makena, Selam, Tsehay, Mekdes, Hanna,
  Ilse, Anke, Dagny, Hedda, Solveig, Ottilie, Oona, Maeve, Rosa, Pilar, Carmen, Dolores, Consuelo, Fernanda, Lourdes, Ofelia, Josefina,
  Anouk, Femke, Katya, Oksana, Branka, Eleni, Dimitra, Ariadne, Yael, Tamar, Mira, Esme, Ottoline, Ragnhild, Thora, Dunya, Zarina,
  Aigerim, Oyuun, Lhamo`, `
  Chidi, Kwame, Kofi, Yaw, Tunde, Emeka, Nnamdi, Musa, Ibrahim, Yusuf, Omar, Karim, Tariq, Rashid, Dariush, Reza, Emre, Kerem, Tomasz,
  Pavel, Dmitri, Sergei, Mikhail, Bogdan, Goran, Lukas, Matthias, Bjorn, Leif, Sven, Halvard, Torvald, Eero, Ciaran, Declan, Eamon,
  Rhys, Gareth, Callum, Hamish, Lucien, Remy, Thibault, Matteo, Lorenzo, Alessandro, Joao, Tiago, Caio, Diego, Mateo, Santiago,
  Alejandro, Inti, Amaru, Samuel, Elijah, Jonah, Ezra, Silas, Amos, Gideon, Tobias, Ansel, Wendell, Otis, Calvin, Rufus, Jasper, Felix,
  Hugo, Oscar, Emil, Arthur, Walter, Harold, Cornelius, Augustus, Barnaby, Ignatius, Percival, Hao, Hiroshi, Kenji, Takeshi, Daisuke,
  Kaito, Minjun, Daeho, Sungmin, Arjun, Vikram, Sanjay, Rohan, Nikhil, Farhan, Rahim, Imran, Duc, Somchai, Arief, Budi, Joko, Rizal,
  Jomari, Teodoro, Keoni, Tane, Wiremu, Ihaia, Sione, Tavita, Sipho, Themba, Bongani, Baraka, Juma, Abebe, Dawit, Yonas, Bram, Joost,
  Pieter, Willem, Taras, Zoran, Dragan, Nikos, Yiannis, Stavros, Eitan, Bartholomew, Ezekiel, Lazarus, Magnus, Bakhyt, Temujin,
  Batbayar, Dorje`, `
  Femi, Deniz, Wayra, Lin, Wei, Jun, Ming, Bao, Lei, Yan, Zhen, Qing, Hui, Yuki, Akira, Ren, Jiwoo, Kiran, Thanh, Minh, Anh, Kai,
  Kagiso, Tendai, Tatenda, Imani, Noa, Tenzin, Pema`);

/** The dome list: LONGHAUL's Mars given names less "Bobbie", plus SETTING §12.1's ten (45). */
export const DOME_GIVEN = pool(`
  Solveig, Ilse, Noor, Vesna, Mira, Thea, Calla, Juno, Maren, Petra, Signe, Una, Zora, Elin, Eira, Ingeborg, Sigrun, Yasmin, Leontine`, `
  Ares, Tariq, Cyrus, Anders, Lucan, Orin, Desmond, Lars, Nils, Reza, Teodor, Vidar, Yusuf, Bram, Ansgar, Darius, Farid, Torin`, `
  Dara, Kai, Rook, Hollis, Kestrel, Quinn, Wren, Roshan`);

/** The valley's given names (SETTING §12.1, 44). */
export const VALLEY_GIVEN = pool(`
  Adina, Cira, Dahlia, Ebba, Esra, Gwen, Keturah, Lumi, Marisol, Nasrin, Odalys, Roza, Saskia, Yasmin, Zuri`, `
  Abel, Amir, Aurelio, Beni, Cade, Calder, Dmitar, Ekon, Faro, Halim, Idris, Iker, Jalen, Janek, Kaveh, Leander, Mads, Nico, Omari,
  Rafe, Sabin, Tobin, Ulises, Wendell, Zeno, Hollin`, `
  Ash, Bryn, Vanja`);

/** LONGHAUL's Belt given names less "Naomi", "Camina", "Sadavir", "Diogo", plus SETTING §12.1's twenty-two. */
export const BELT_GIVEN = pool(`
  Kima, Oksana, Tilly, Ashaki, Chiku, Hiroko, Ilsa, Lacey, Rilka, Chava, Xola, Yeni`, `
  Anton, Marco, Bastien, Dawit, Esai, Filip, Galo, Tovo, Akin, Bertil, Dusan, Ilan, Jiro, Lual, Rafi, Uri, Vasu, Zev`, `
  Bez, Fen, Pash, Lio, Yanz, Ochi, Ren, Jabbe, Koto, Mika, Nen, Ozi, Pell, Sabe, Weng, Eko, Gaudi, Hasi, Kamu, Mosi, Nkem, Oyo, Paz, Tavi`);

/** LONGHAUL's Earth given names (with GIVEN beside them for `earther`). */
export const EARTH_GIVEN = pool(`
  Amara, Priya, Sofia, Hana, Elena, Aiko, Leila, Nia, Ines, Mei, Chioma, Yara, Zainab, Ana, Ingrid, Lucia, Asha, Freya, Esther, Rosa`, `
  Mateo, Kwame, Omar, Jonas, Diego, Tomas, Ravi, Kofi, Arjun, Luca, Felix, Hiro, Samir, Tunde, Dmitri, Pedro, Malik, Viktor`, `
  Wei, Jun`);

/** LONGHAUL's Jovian given names. */
export const JOVIAN_GIVEN = pool(`
  Io, Europa, Ama, Sela, Anya, Dalia, Hesper, Liora, Nyx, Odile, Saoirse, Ulla, Yael`, `
  Callum, Gan, Bram, Dov, Cato, Elio, Galen, Kael, Maxim, Rasmus, Taavi, Varis`, `
  Bodhi, Ira, Jory, Pax, Xan`);

/** LONGHAUL's Luna given names (no home of the Corps draws them yet: SETTING §4.7 has no lunar home). */
export const LUNA_GIVEN = pool(`
  Selene, Rhea, Bea, Della, Faye, Hester, Jessa, Mabel, Opal, Romy, Tamsin`, `
  Yuri, Hal, Ezra, Corin, Emil, Gideon, Ivo, Noah, Piers, Silas, Zeke`, `
  Imani, Lin, Cass, Arden, Kit, Lark, Vale, Wynn`);

/** LONGHAUL's FAMILY, the system-wide melting pot (387). */
export const FAMILY = words(`
  Okafor, Adeyemi, Okonkwo, Mensah, Asante, Boateng, Owusu, Nwosu, Obi, Balogun, Danjuma, Abubakar, Diallo, Traore, Keita, Coulibaly, Toure, Ndiaye,
  Sow, Diop, Ndlovu, Dlamini, Khumalo, Mokoena, Nkosi, Mahlangu, Moyo, Chikwanha, Mutasa, Banda, Phiri, Mwangi, Kamau, Otieno, Odhiambo, Wambui,
  Kiprop, Chebet, Haile, Tesfaye, Bekele, Girma, Alemu, Abdi, Warsame, Haddad, Khoury, Nasser, Mansour, Saleh, Hakimi, Benali, Amrani, Ziani, Tazi,
  Rahmani, Karimi, Hosseini, Tehrani, Farahani, Sadeghi, Yilmaz, Demir, Kaya, Celik, Aydin, Ozturk, Arslan, Petrov, Volkov, Sokolov, Morozov,
  Lebedev, Kuznetsov, Orlov, Belov, Zaitsev, Novak, Kowalski, Wisniewski, Zielinski, Lewandowski, Horvat, Kovac, Babic, Petrovic, Jovanovic,
  Popescu, Ionescu, Dumitru, Kovacs, Nagy, Szabo, Toth, Dvorak, Novotny, Svoboda, Halvorsen, Lindqvist, Johansson, Nyberg, Bergstrom, Sandvik,
  Haugen, Solberg, Virtanen, Lahtinen, Koskinen, Jensen, Thorsen, Magnusson, Sigurdsson, O'Brien, Gallagher, Byrne, Doyle, Kavanagh, Quinn, MacLeod,
  Campbell, Fraser, Morgan, Pryce, Llewellyn, Trevelyan, Penhaligon, Ashworth, Whitlock, Fairweather, Hargreaves, Pemberton, Thornbury, Kettering,
  Blackwood, Holloway, Merriweather, Beaumont, Delacroix, Moreau, Laurent, Fontaine, Girard, Lefebvre, Marchand, Rousseau, Duval, Aubert, Bertrand,
  Rossi, Romano, Esposito, Bianchi, Ricci, Moretti, Ferraro, Conti, Galli, Marino, Lombardi, Ferreira, Pereira, Almeida, Carvalho, Ribeiro, Rocha,
  Barbosa, Cardoso, Teixeira, Moura, Garcia, Fernandez, Lopez, Martinez, Sanchez, Romero, Navarro, Torres, Ramirez, Vargas, Castillo, Herrera,
  Medina, Aguilar, Mendoza, Rojas, Quispe, Mamani, Huaman, Condori, Cruz, Reyes, Santos, Bautista, Villanueva, Aquino, Dizon, Mercado, Pangilinan,
  Nguyen, Tran, Pham, Hoang, Vu, Dang, Bui, Ngo, Sato, Suzuki, Takahashi, Tanaka, Watanabe, Ito, Yamamoto, Nakamura, Kobayashi, Kato, Yoshida,
  Yamada, Sasaki, Matsumoto, Inoue, Kimura, Hayashi, Shimizu, Mori, Ikeda, Hashimoto, Ishikawa, Ogawa, Fujita, Okada, Kim, Lee, Park, Choi, Jung,
  Kang, Cho, Yoon, Jang, Lim, Han, Seo, Shin, Kwon, Hwang, Ahn, Wang, Li, Zhang, Liu, Chen, Yang, Huang, Zhao, Wu, Zhou, Xu, Sun, Zhu, Hu, Guo, Gao,
  Luo, Zheng, Liang, Xie, Song, Tang, Feng, Deng, Cao, Peng, Zeng, Xiao, Tian, Dong, Pan, Yuan, Cai, Jiang, Du, Ye, Cheng, Su, Ding, Shen, Yao,
  Zhong, Cui, Tan, Wen, Fang, Shi, Bai, Kong, Patel, Sharma, Singh, Kumar, Gupta, Reddy, Rao, Iyer, Nair, Menon, Pillai, Chatterjee, Banerjee,
  Mukherjee, Das, Bose, Sen, Ghosh, Desai, Joshi, Kulkarni, Deshpande, Pandey, Mishra, Verma, Chaudhary, Malhotra, Kapoor, Mehta, Shah, Bhatt,
  Krishnan, Subramanian, Venkataraman, Rahman, Hossain, Chowdhury, Siddiqui, Qureshi, Malik, Khan, Hussain, Akhtar, Javed, Wijaya, Santoso, Hartono,
  Kusuma, Gunawan, Setiawan, Pratama, Saputra, Hidayat, Wongsakul, Srisai, Chaiyaporn, Kealoha, Kahananui, Makoa, Ngata, Parata, Tamihana, Fonoti,
  Tuilagi, Faleolo, Tupou, Vaipulu, Fifita, Kowalczyk, Grabowski, Mazur, Krawczyk, Bauer, Fischer, Weber, Schneider, Hoffmann, Richter, Neumann,
  Zimmermann, Hartmann, Lindgren, Ekström, Van der Berg, De Vries, Bakker, Visser, Smit, Mulder, De Jong, Brouwer`);

/** LONGHAUL's MARS_FOUNDER, the old Martian families (83). */
export const MARS_FOUNDER = words(`
  Xuesen, Barkeith, Gelan, Dewalt, Okonjo, Halloran, Abernathy, Dzhamilov, Ostrovsky, Achterberg, Mbatha, Quintero, Kessler, Arkwright, Brennan,
  Castellanos, Delacorte, Ekwueme, Falconer, Gaskell, Hakimian, Imbert, Jovanovich, Laszlo, Nakashima, Oyelaran, Pradhan, Qiao, Rostova, Sandoval,
  Takeda, Umarov, Valcourt, Wexley, Yamazaki, Zharkov, Ashgrove, Brightwater, Coldwell, Dunmore, Everhart, Fairbank, Greenhalgh, Holbrook, Ironside,
  Jessup, Kingsley, Lockhart, Marlow, Northcott, Oakhurst, Pennington, Redfield, Stonebridge, Thorne, Underhill, Vance, Whitcombe, Yardley, Bello,
  Chukwu, Danso, Eze, Fofana, Gakuru, Hamid, Idowu, Jalloh, Kamara, Lungu, Tsiolkova, Varga, Szilard, Oberth, Zubrin, Von Braun, Tsander,
  Kondratyuk, Esnault, Goddard, Valier, Noordung, Ley`);

/** The valley's family names (SETTING §12.1, 48). */
export const VALLEY_FAMILY = words(`
  Abara, Acevedo, Amadi, Arce, Baptiste, Barros, Bekov, Brannigan, Cardenas, Castell, Dagher, Darko, Eskandari, Esteban, Farouk, Fennick,
  Galvan, Grieve, Hale, Ibarra, Iwu, Jarrah, Kader, Kask, Loera, Madsen, Marangoni, Mendel, Navid, Ochoa, Okeke, Pasko, Quarles, Rahimi,
  Rask, Salo, Serrat, Tamez, Ugarte, Vasquez, Vey, Wallin, Yanez, Zamora, Redfern, Coldwater, Stonefield, Ashby`);

/** The given and family pools by key, as CULTURES names them. */
export const GIVEN_POOLS = Object.freeze({ given: GIVEN, dome: DOME_GIVEN, valley: VALLEY_GIVEN, belt: BELT_GIVEN, earth: EARTH_GIVEN, jovian: JOVIAN_GIVEN, luna: LUNA_GIVEN });
export const FAMILY_POOLS = Object.freeze({ family: FAMILY, founder: MARS_FOUNDER, valley: VALLEY_FAMILY });

/**
 * The name cultures (SETTING §12.1): for each, [pool key, weight] pairs for the given and the family
 * name. founderLondres: the founders' weight for a Londres Nova home (twice the dome's).
 */
export const CULTURES = Object.freeze({
  'mars-valley': Object.freeze({ given: [['valley', 60], ['dome', 15], ['given', 25]], family: [['valley', 45], ['family', 50], ['founder', 5]] }),
  'mars-dome': Object.freeze({ given: [['dome', 100]], family: [['founder', 20], ['family', 80]], founderLondres: 40 }),
  jovian: Object.freeze({ given: [['jovian', 100]], family: [['family', 100]] }),
  belter: Object.freeze({ given: [['belt', 100]], family: [['family', 100]] }),
  earther: Object.freeze({ given: [['earth', 50], ['given', 50]], family: [['family', 100]] }),
  lunar: Object.freeze({ given: [['luna', 100]], family: [['family', 100]] }),
});

/** SETTING §12.6: canon full names, never generated. */
export const BLOCKED_FULL = words(`
  James Holden, Naomi Nagata, Amos Burton, Alex Kamal, Roberta Draper, Bobbie Draper, Chrisjen Avasarala, Fred Johnson, Josephus Miller,
  Joe Miller, Julie Mao, Jules-Pierre Mao, Clarissa Mao, Camina Drummer, Klaes Ashford, Anderson Dawes, Praxidike Meng, Elvi Okoye,
  Marco Inaros, Filip Inaros, Anna Volovodov, Sadavir Errinwright, Michio Pa, Winston Duarte, Dimitri Havelock, Octavia Muss,
  Diogo Harari, Basia Merton, Carlos Baca`);

/** SETTING §12.6: family names never given to tier 1 or 2 (the squad and the chain, where a player would notice). */
export const BLOCKED_FAMILY_T12 = words(`Holden, Nagata, Kamal, Draper, Avasarala, Errinwright, Inaros, Drummer, Ashford, Dawes, Duarte, Volovodov`);

/**
 * SETTING §12.3's nickname pools. pun: a surname's pun where it has one (the family name → the nick);
 * home: by home id; body: by height or build (tall, short, slight, broad); ironic: anyone's.
 */
export const NICKS = Object.freeze({
  pun: Object.freeze({
    Okafor: 'Oak', Brannigan: 'Bricks', Salo: 'Salt', Tamez: 'Tamer', Iwu: 'Ice', Okeke: 'Okie', Ibarra: 'Bear', Stonefield: 'Stones',
    Coldwater: 'Cold Brew', Redfern: 'Red', Ashby: 'Ash', Hale: 'Hail', Grieve: 'Grief', Vey: 'Oy Vey', Kask: 'Cask', Rask: 'Rascal',
    Darko: 'Dark', Madsen: 'Mad Dog', Wallin: 'Wall', Barros: 'Barrels', Castell: 'Castle', Mendel: 'Peas', Fennick: 'Fox',
    Holloway: 'Hollow', Blackwood: 'Timber', Fairweather: 'Sunny', Merriweather: 'Merry', Whitlock: 'Lock', Lockhart: 'Lock',
    Ironside: 'Irons', Stonebridge: 'Bridge', Brightwater: 'Sparkle', Coldwell: 'Chill', Underhill: 'Hobbit', Thorne: 'Thorn',
    Kingsley: 'King', Goddard: 'Rocket', Oberth: 'Burn', Zubrin: 'Direct', Marlow: 'Marlin', Vance: 'Van', Falconer: 'Bird',
    Kessler: 'Cascade', Pennington: 'Penny', Fischer: 'Fish', Bauer: 'Farmer', Weber: 'Web', Richter: 'Quake', Fontaine: 'Fountain',
    Moreau: 'Moe', Nagy: 'Nags', Toth: 'Tooth', Kim: 'Kimbo', Park: 'Parks', Cruz: 'Cruise', Santos: 'Saint', Reyes: 'Kings',
    Rossi: 'Red', Moretti: 'Mo', Ricci: 'Rich', Bianchi: 'Whitey', Lopez: 'Lopes', Torres: 'Towers', Navarro: 'Navy', Medina: 'Dina',
    Patel: 'Petal', Singh: 'Sing', Khan: 'Kahn', Malik: 'Mack', Petrov: 'Petrol', Volkov: 'Wolf', Orlov: 'Eagle', Novak: 'Nova',
    Haddad: 'Smith', Diallo: 'Dial', Banda: 'Bandit', Moyo: 'Mojo', Sato: 'Sugar', Tanaka: 'Tank', Mori: 'Morrie', Ito: 'Ditto',
  }),
  home: Object.freeze({
    redwater: ['Valley', 'Redwater', 'Canal'], tharsis: ['Domes', 'Tharsis', 'Highrim'], londres: ['Domes', 'Capital', 'Londres'],
    hellas: ['Hellas', 'Lake', 'Fish'], seacoast: ['Coast', 'Ochre', 'Sailor'], farms: ['Farmer', 'Valley', 'Haystack'],
    callisto: ['Callisto', 'Jupiter', 'Low-G'], aboard: ['Spacer', 'Navy', 'Phobos'], ceres: ['Belt', 'Ceres', 'Rock'], earth: ['Earth', 'Gravity', 'Blue'],
  }),
  body: Object.freeze({ tall: ['Tall', 'Spin', 'Stilts'], short: ['Shorty', 'Pocket', 'Half Pint'], slight: ['Thin', 'Bones', 'Twig'], broad: ['Heavy', 'Lungs', 'Tank'] }),
  ironic: words(`Sunshine, Lucky, Professor, Quiet, Speedy, Tiny, Smiley, Chatty, Genius, Ace`),
});
