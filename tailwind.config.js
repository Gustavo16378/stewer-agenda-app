/**
 * Tokens do design do Stewer Gabriel, definidos uma vez.
 * Os VALORES moram em src/styles/global.css (variaveis CSS, par dark/light);
 * aqui so os NOMES das utilidades. Nenhum valor de cor literal do tema entra neste arquivo.
 *
 * As escalas (fontSize, letterSpacing, spacing, radius) sao os valores EXATOS medidos
 * no design, inclusive os fracionarios (8.5px, 10.5px, 13.5px).
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // 'class' e o que faz o seletor `.dark:root` do global.css valer; o NativeWind
  // acrescenta a classe conforme o colorScheme (sistema ou escolha manual).
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // --- pares dark/light, resolvidos pela variavel CSS ---
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        wash: 'var(--color-wash)',
        sunken: 'var(--color-sunken)',
        'ink-inverse': 'var(--color-ink-inverse)',
        gold: 'var(--color-gold)',
        'gold-border': 'var(--color-gold-border)',

        divider: 'var(--color-divider)',
        'divider-card': 'var(--color-divider-card)',
        'card-border': 'var(--color-card-border)',
        'field-border': 'var(--color-field-border)',
        'ghost-border': 'var(--color-ghost-border)',
        indicator: 'var(--color-indicator)',

        'text-strong': 'var(--color-text-strong)',
        'text-body': 'var(--color-text-body)',
        'text-meta': 'var(--color-text-meta)',
        'text-label': 'var(--color-text-label)',
        'text-muted': 'var(--color-text-muted)',
        'text-dim': 'var(--color-text-dim)',
        'text-faint': 'var(--color-text-faint)',
        'text-disabled': 'var(--color-text-disabled)',
        day: 'var(--color-day)',
        'nav-arrow': 'var(--color-nav-arrow)',
        'accent-line': 'var(--color-accent-line)',
        'status-dim': 'var(--color-status-dim)',
        battery: 'var(--color-battery)',
        'slot-off': 'var(--color-slot-off)',

        // --- canais crus: habilitam text-ink/48, border-ink/16, bg-ink/20 ---
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        'on-ink': 'rgb(var(--canvas-rgb) / <alpha-value>)',

        // --- literais da marca: NAO trocam com o tema ---
        brand: {
          gold: '#C9A96A',
          goldLight: '#A8894F',
          ink: '#F1EBE0',
          black: '#0A0A0A',
          elevated: '#121110',
          sunken: '#0E0E0D',
        },
      },

      // A escala EXATA de alfa do design, para `text-ink/48` reproduzir o literal do CSS.
      opacity: {
        4: '0.04',
        10: '0.1',
        12: '0.12',
        14: '0.14',
        16: '0.16',
        18: '0.18',
        20: '0.2',
        22: '0.22',
        25: '0.25',
        28: '0.28',
        30: '0.3',
        32: '0.32',
        35: '0.35',
        38: '0.38',
        40: '0.4',
        42: '0.42',
        45: '0.45',
        48: '0.48',
        50: '0.5',
        55: '0.55',
        60: '0.6',
        62: '0.62',
        65: '0.65',
        70: '0.7',
        72: '0.72',
        75: '0.75',
        78: '0.78',
        80: '0.8',
        85: '0.85',
        88: '0.88',
        90: '0.9',
        92: '0.92',
      },

      fontFamily: {
        // os nomes tem de bater com o que o expo-font registra (src/theme/fonts.ts)
        display: ['PlayfairDisplay_400Regular'],
        'display-medium': ['PlayfairDisplay_500Medium'],
        'display-semibold': ['PlayfairDisplay_600SemiBold'],
        'display-italic': ['PlayfairDisplay_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
      },

      fontSize: {
        // --- escala Inter (UI) ---
        micro: '7.5px',
        '2xs': '8px',
        'caps-xs': '8.5px', // micro-caps (67 usos)
        caps: '9px', // CAPS PADRAO (108 usos)
        'caps-sm': '9.5px',
        'caps-md': '10px',
        'caps-lg': '10.5px', // label de botao primario
        help: '11px',
        'help-lg': '11.5px',
        chip: '12px',
        meta: '12.5px',
        body: '13px',
        'body-lg': '13.5px',
        row: '14px',
        'row-lg': '14.5px',
        'icon-sm': '15px',
        icon: '16px',
        'icon-lg': '19px', // seta de voltar

        // --- escala Playfair (display) ---
        'd-xs': '13px',
        'd-sm': '14px',
        'd-17': '17px',
        'd-18': '18px',
        'd-19': '19px',
        'd-20': '20px',
        'd-21': '21px',
        'd-22': '22px',
        'd-23': '23px',
        'd-24': '24px',
        'd-25': '25px',
        'd-26': '26px',
        'd-27': '27px',
        'd-29': '29px',
        'd-30': '30px',
        'd-31': '31px',
        'd-42': '42px',
      },

      letterSpacing: {
        // o design so usa `em`; o NativeWind converte para o equivalente em px por tamanho
        brand: '0.08em',
        tightest: '0.1em',
        tighter: '0.12em',
        tab: '0.14em', // label de tab bar
        chip: '0.16em',
        row: '0.18em', // micro-caps de status
        wide: '0.2em', // metadado em caps
        button: '0.22em', // label de botao primario
        section: '0.24em', // eyebrow / label de secao
        screen: '0.26em', // eyebrow de topo de tela
        cover: '0.28em',
        widest: '0.3em',
        logo: '0.32em', // "STEWER GABRIEL" da splash
      },

      borderRadius: {
        // `--r` do design e 2px; o resto sao casos pontuais
        DEFAULT: '2px',
        token: '2px',
        hair: '1px',
        chip: '3px',
        pill: '99px',
      },

      spacing: {
        // o ritmo do layout medido no design
        'screen-x': '28px', // padding lateral padrao da tela
        'screen-x-lg': '30px',
        'screen-x-sm': '24px',
        statusbar: '50px',
        tabbar: '62px',
        'home-indicator': '4px',
      },
    },
  },
  plugins: [],
};
