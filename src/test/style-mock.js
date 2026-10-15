// O global.css e processado pelo nativewind/metro, que nao roda no Jest.
// Nos testes ele vira um modulo vazio; o que importa nos testes de componente e a
// arvore e o texto, nao a cor resolvida (essa e verificada no bundle, nao aqui).
module.exports = {};
