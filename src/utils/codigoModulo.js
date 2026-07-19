// =====================================================
// Generador de código de módulo — sigue al pie de la letra la fórmula
// escrita al final del diccionario maestro de Arquitectura:
//
//   LÍNEA-TIPO-LADO [-AÉREO] [-SUPERIOR] [-EQUIPO L.CALIENTE(.COMBUSTIBLE)]
//   [-EQUIPOS INFERIORES] -LARGO -Pprofundidad [-ALTalto si≠90]
//
// Los equipos de una misma categoría (superior/línea caliente/inferior)
// se ordenan según su posición en el diccionario, NO según el orden en
// que la arquitecta los fue marcando — así dos módulos con los mismos
// equipos elegidos en distinto orden generan el MISMO código.
// =====================================================
import { LINEA, TIPO_MODULO, LADO, AEREO, SUPERIOR, LCA_EQUIPO, COMBUSTIBLE, INFERIOR, ALTO_ESTANDAR_CM } from '../data/diccionarioModulos';

const abrevDe = (lista, valor) => lista.find(x => x.valor === valor)?.abrev || '';

// Devuelve las abreviaciones de `valores` en el orden en que aparecen en
// `lista` (el orden "oficial" del diccionario), no en el orden de selección.
const ordenarPorDiccionario = (valores, lista) =>
  lista.filter(item => (valores || []).includes(item.valor)).map(item => item.abrev);

const pad3 = (n) => String(Math.round(Number(n))).padStart(3, '0');

export function generarCodigoModulo({
  linea, tipoModulo, lado, aereo, superior, lcaEquipo, combustible, inferior,
  largo, profundidad, alto,
} = {}) {
  const abrevLinea = abrevDe(LINEA, linea);
  const abrevTipo  = abrevDe(TIPO_MODULO, tipoModulo);
  const abrevLado  = abrevDe(LADO, lado);
  if (!abrevLinea || !abrevTipo || !abrevLado) return '';

  const seg = [abrevLinea, abrevTipo, abrevLado];

  const abrevAereo = abrevDe(AEREO, aereo);
  if (abrevAereo) seg.push(abrevAereo);

  const abrevsSuperior = ordenarPorDiccionario(superior, SUPERIOR);
  if (abrevsSuperior.length) seg.push(abrevsSuperior.join('.'));

  const abrevsLca  = ordenarPorDiccionario(lcaEquipo, LCA_EQUIPO);
  const abrevComb  = abrevDe(COMBUSTIBLE, combustible);
  if (abrevsLca.length) seg.push(abrevComb ? [...abrevsLca, abrevComb].join('.') : abrevsLca.join('.'));

  const abrevsInferior = ordenarPorDiccionario(inferior, INFERIOR);
  if (abrevsInferior.length) seg.push(abrevsInferior.join('.'));

  if (largo)       seg.push(pad3(largo));
  if (profundidad) seg.push('P' + pad3(profundidad));
  if (alto && Number(alto) !== ALTO_ESTANDAR_CM) seg.push('ALT' + pad3(alto));

  return seg.join('-');
}
