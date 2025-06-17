function generarPalabraAleatoria(longitud = 5, opciones = {}) {
  const {       // Incluir la Ñ (español)
    mayusculas = false,    // Si es false, será minúscula
    permitirRepeticiones = true // Si false, todas las letras serán únicas
  } = opciones;

  // Alfabeto base (sin Ñ)
  let alfabeto = 'abcdefghijklmnopqrstuvwxyz';

  // Convertir a mayúsculas si se requiere
  if (mayusculas) alfabeto = alfabeto.toUpperCase();

  let palabra = '';
  let letrasDisponibles = alfabeto;

  for (let i = 0; i < longitud; i++) {
    const indice = Math.floor(Math.random() * letrasDisponibles.length);
    const letra = letrasDisponibles[indice];
    palabra += letra;

    // Si no se permiten repeticiones, removemos la letra usada
    if (!permitirRepeticiones) {
      letrasDisponibles = letrasDisponibles.replace(letra, '');
    }
  }

  return palabra;
}
function generarNumeroAleatorio(min = 1, max = 7) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ejemplo de uso
//console.log(generarNumeroAleatorio()); // Número entre 6-15
//console.log(generarNumeroAleatorio(10, 20)); // Número entre 10-20

// Ejemplo de uso:

module.exports = {
  generarPalabraAleatoria,
  generarNumeroAleatorio
};