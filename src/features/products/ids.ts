/**
 * Membuat id (UUID v4) di sisi app.
 * Dipakai saat menyimpan varian & topping: grup dan pilihannya dikirim sekaligus,
 * jadi id grup harus sudah diketahui sebelum pilihan disimpan.
 */
export function newId(): string {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) id += "-";
    else if (i === 14) id += "4";
    else if (i === 19) id += hex[(Math.random() * 4) | 8];
    else id += hex[(Math.random() * 16) | 0];
  }
  return id;
}
