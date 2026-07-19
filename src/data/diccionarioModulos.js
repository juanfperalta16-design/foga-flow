// =====================================================
// FOGA — Diccionario maestro de bautizo de módulos
// Copiado de "FOGA_02_DASHBOARD_DISENO_CONCEPTUAL_4(DICCIONARIO).csv"
// (hoja de Arquitectura). Agregar valores nuevos al final de cada
// lista — igual que indica el propio diccionario, no insertar en medio.
// =====================================================

export const LINEA = [
  { valor: 'Element',   abrev: 'ELE' },
  { valor: 'Santa Ana', abrev: 'SAN' },
  { valor: 'Equifrigo', abrev: 'EQF' },
];

export const TIPO_MODULO = [
  { valor: 'Lateral',                       abrev: 'LAT' },
  { valor: 'Central',                       abrev: 'CEN' },
  { valor: 'Isla',                          abrev: 'ISL' },
  { valor: 'Mesón',                         abrev: 'MES' },
  { valor: 'Campana',                       abrev: 'CAM' },
  { valor: 'Línea caliente',                abrev: 'LCA' },
  { valor: 'Mueble bajo línea caliente',    abrev: 'MBJ' },
  { valor: 'Recubrimiento',                 abrev: 'REC' },
  { valor: 'Torre',                         abrev: 'TOR' },
  { valor: 'Especial',                      abrev: 'ESP' },
  { valor: 'Linea de lavado',               abrev: 'LILAV' },
  { valor: 'Mesa de Trabajo',               abrev: 'MESTRA' },
  { valor: 'AÉREO',                         abrev: 'AER' },
  { valor: 'Módulo',                        abrev: 'MODL' },
  { valor: 'Equipo',                        abrev: 'EQUP' },
  { valor: 'Mesa de desperdicios',          abrev: 'MESD' },
];

export const LADO = [
  { valor: 'Izquierdo',          abrev: 'IZQ' },
  { valor: 'Derecho',            abrev: 'DER' },
  { valor: 'Central',            abrev: 'CEN' },
  { valor: 'ISLA',                abrev: 'ISL' },
  { valor: 'ESQUINERO',          abrev: 'ESQ' },
  { valor: 'NO APLICA',          abrev: 'NA' },
  { valor: 'LATERAL DERECHO',    abrev: 'LAT.DER' },
  { valor: 'LATERAL IZQUIERDO',  abrev: 'LAT.IZQ' },
];

export const AEREO = [
  { valor: 'Vitrina aérea',           abrev: 'VIT' },
  { valor: 'CUBICA',                  abrev: 'CUB' },
  { valor: 'PIRAMIDAL',               abrev: 'PIR' },
  { valor: 'SEMIPIRAMIDAL',           abrev: 'SEPIR' },
  { valor: 'CURBA',                   abrev: 'CUR' },
  { valor: 'CUBICA+FORRO',            abrev: 'CUBFORR' },
  { valor: 'PIRAMIDAL+FORRO',         abrev: 'PIRFORR' },
  { valor: 'SEMIPIRAMIDAL+FORRO',     abrev: 'SEPIRFORR' },
  { valor: 'CURBA+FORRO',             abrev: 'CURFORR' },
  { valor: 'MODULO AEREO',            abrev: 'MODAER' },
  { valor: '7 PUERTAS',               abrev: '7PUE' },
  { valor: '4 PUERTAS',               abrev: '4PUE' },
  { valor: '2 REPISAS',               abrev: '2REPS' },
];

export const SUPERIOR = [
  { valor: 'Hielera',              abrev: 'HIE' },
  { valor: 'Pozo de lavado',       abrev: 'POZ' },
  { valor: 'Fregadero doble',      abrev: 'FRE' },
  { valor: 'Lavador 45cm',         abrev: 'LAV45' },
  { valor: 'Lavador 40cm',         abrev: 'LAV40' },
  { valor: '1 Repisa superior',    abrev: '1REPSUP' },
  { valor: '2 Repisa superior',    abrev: '1REPSUP' },
  { valor: '3 Repisa superior',    abrev: '1REPSUP' },
  { valor: 'Orificio para Desperdicios', abrev: 'ORFDES' },
  { valor: 'SAMOVAR',              abrev: 'SAM' },
  { valor: 'Lavador 2 pozos',      abrev: 'LV2P' },
  { valor: 'TRAMPA GRASA',         abrev: 'TRG' },
  { valor: 'ESCURRIDERA',          abrev: 'ESCS' },
  { valor: 'Paellera',             abrev: 'PAE' },
];

// Línea caliente · equipo (código combina esto + combustible, ej. "GR.90.G")
export const LCA_EQUIPO = [
  { valor: 'Parrilla',                                    abrev: 'PAR' },
  { valor: 'Plancha de 40',                                abrev: 'PLA.40' },
  { valor: 'Plancha de 50',                                abrev: 'PLA.50' },
  { valor: 'Grill 90',                                     abrev: 'GR.90' },
  { valor: 'Grill 75',                                     abrev: 'GR.75' },
  { valor: 'Gril 1,09',                                    abrev: 'GR.109' },
  { valor: 'Asador 1,20',                                  abrev: 'ASA.120' },
  { valor: 'Asador 1,20 con infiernillo',                  abrev: 'ASA.120+INFRN' },
  { valor: 'Cocina de 1 quemador',                         abrev: 'COC.1.QUE' },
  { valor: 'Cocina de 2 quemadores',                       abrev: 'COC.2.QUE' },
  { valor: 'Cocina de 4 quemadores',                       abrev: 'COC.4.QUE' },
  { valor: 'Camado',                                       abrev: 'CAM' },
  { valor: 'Wok',                                          abrev: 'WOK' },
  { valor: 'Cocina',                                       abrev: 'COCI' },
  { valor: 'Plancha Teppanyaki de 1,20 para Isla',         abrev: 'PLATEPY.120' },
  { valor: 'Asador 1',                                     abrev: 'ASA.1' },
  { valor: 'Horno Domo',                                   abrev: 'HORDO' },
  { valor: 'PLANCHA 61',                                   abrev: 'PLA.61' },
];

export const COMBUSTIBLE = [
  { valor: 'Gas',      abrev: 'G' },
  { valor: 'Carbón',   abrev: 'C' },
  { valor: 'Híbrida',  abrev: 'H' },
];

// Inferior (bajo mesón) — máx. 3 por módulo, según el diccionario
export const INFERIOR = [
  { valor: 'Refrigerador 1p',                           abrev: 'R1P' },
  { valor: 'Refrigerador 2p',                           abrev: 'R2P' },
  { valor: 'Congelador 1p',                             abrev: 'G1P' },
  { valor: 'Congelador 2p',                             abrev: 'G2P' },
  { valor: 'Ice Maker',                                 abrev: 'ICE' },
  { valor: 'Vinera',                                    abrev: 'VIN' },
  { valor: 'Lavavajillas',                              abrev: 'LAV' },
  { valor: 'Horno eléctrico',                           abrev: 'HOR' },
  { valor: 'Cajón Basurero',                            abrev: 'CBAS' },
  { valor: 'Cajón para leña',                           abrev: 'CAJLEN' },
  { valor: '1 Puerta',                                  abrev: '1PUE' },
  { valor: '2 Puerta',                                  abrev: '2PUE' },
  { valor: '3 Puerta',                                  abrev: '3PUE' },
  { valor: '7 Puerta',                                  abrev: '7PUE' },
  { valor: '2 Cajones',                                 abrev: '2CAJ' },
  { valor: '3 Cajones',                                 abrev: '3CAJ' },
  { valor: '4 Cajones',                                 abrev: '4CAJ' },
  { valor: '6 Cajones',                                 abrev: '6CAJ' },
  { valor: '2 Quemadores',                              abrev: '2QUE' },
  { valor: 'Puerta+Repisa',                             abrev: 'PUER+REP' },
  { valor: 'Repisa',                                    abrev: 'REP' },
  { valor: '2 Cajones refrigerantes',                   abrev: '2CREF' },
  { valor: '3 Cajones refrigerantes',                   abrev: '2CREF' },
  { valor: '1 Cajón',                                   abrev: '1CAJ' },
  { valor: 'Ice Maker + Minibar Refrigerante',          abrev: 'ICE/MIREF' },
  { valor: 'Minibar refrigerante',                      abrev: 'MINREF' },
  { valor: 'Puerta para Gas',                           abrev: 'PUEG' },
  { valor: '1 Puerta+Repisa',                           abrev: '1PUE+REP' },
  { valor: '2 Puerta+Repisa',                           abrev: '2PUE+REP' },
  { valor: '1 Entrepaño',                               abrev: 'ETRPA' },
  { valor: 'Puerta con 3 cajones escondidos',           abrev: 'PUE+3CAJ.ESCND' },
  { valor: 'Puerta con 2 cajones escondidos',           abrev: 'PUE+2CAJ.ESCND' },
  { valor: 'Puerta con condimentero + cajón',           abrev: 'PUE+CONDIM+1CAJ.ESCND' },
  { valor: '2 Entrepaño',                               abrev: '2ETRPA' },
  { valor: 'Puerta perforada',                          abrev: 'PUERPERF' },
  { valor: 'Ruedas',                                    abrev: 'RUE' },
  { valor: 'Base de línea caliente',                    abrev: 'BASLINCAL' },
  { valor: '3 Puertas+repisa',                          abrev: '3PUE+REP' },
];

// Alto estándar (cm) — según el diccionario, si el módulo mide esto NO
// se agrega "-ALT###" al código, solo cuando es distinto.
export const ALTO_ESTANDAR_CM = 90;
