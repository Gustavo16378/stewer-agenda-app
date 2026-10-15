/// <reference types="nativewind/types" />

// O import de efeito colateral do global.css e processado pelo Metro (nativewind/metro),
// nao pelo tsc — esta declaracao so existe para o typecheck nao reclamar dele.
declare module '*.css' {}
