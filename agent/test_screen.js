import screenshot from 'screenshot-desktop';

screenshot().then((img) => {
  console.log("Screenshot tirada com sucesso! Tamanho:", img.length);
}).catch((err) => {
  console.error("Erro ao tirar screenshot:", err);
});
