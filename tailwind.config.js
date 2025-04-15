/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      screens: {
        '2xs': '375px',
        xs: '475px',
        mds: '799px',
        mdl: '910px',
        '3xl': '1760px',
      },
      colors: {
        mainGray: '#272727',
        lightGray: '#5D5D5D',
        darkGray: '#3C3D42',
        mainOrange: '#FF6000',
        lightOragne: '#FFA559',
        mainCreme: '#FFE6C7',
      },
      backgroundImage: {
        homeImageAI: "url('/images/home/home.jpg')",
        homeImageUser: "url('/images/authors/user.png')",
        homeImageUser0: "url('/images/authors/marcin.jpg')",
        homeImageUser1: "url('/images/authors/pawel.jpg')",
        homeImageUser2: "url('/images/authors/bartek.jpg')",
      },
      height: {
        navbar: '80px',
      },
      padding: {
        navbar: '80px',
      },
      minHeight: {
        all: 'calc(100vh - 72px)', //dla szerokosci >=375px jest 100vh - 80px
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
      },
      lineHeight: {
        '2xs': '0.8125rem',
        '3xs': '0.625rem',
      },
      boxShadow: {
        navbarShadow: '0px 1px 7px 2px rgba(255, 96, 0, 1)',
        userInfoShadow: '-1px 1px 7px 2px rgba(255, 96, 0, 1)',
        footerShadow: 'inset 0px 4px 25px -8px rgba(93, 93, 93, 1)',
        sideMenuShadow: '-5px 7px 25px -7px rgba(93, 93, 93, 1)',
        controlPanelShadow:
          '0 4px 12px rgba(255, 230, 199, 1), 0 -2px 4px rgba(255, 230, 199, 0)',
        menuInfoPanelShadow:
          '0 2px 6px rgba(53, 53, 53, 1), 0 -1px 2px rgba(53, 53, 53, 0)',
      },
      animation: {
        typewriter17: 'typewriter 2s steps(17) forwards',
        caret17:
          'typewriter 2s steps(17) forwards, blink 2s steps(17) infinite 2s',
      },
      keyframes: {
        typewriter: {
          to: { left: '100%' },
        },
        blink: {
          '0%': { opacity: '0' },
          '0.1%': { opacity: '1' },
          '50%': { opacity: '1' },
          '50.1%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.custom-input': {
          '@apply border-[1px] border-mainCreme rounded-md px-2 py-1 bg-mainGray selection:bg-lightGray text-sm xs:text-base text-mainCreme transition-all ease-in-out duration-500 focus:outline-none focus:border-mainOrange h-[1.85rem] xs:h-[2.1rem]':
            {},
        },
        '.custom-input-small': {
          '@apply border-[1px] border-mainCreme rounded-md px-2 py-1 bg-mainGray selection:bg-lightGray text-xs xs:text-sm text-mainCreme transition-all ease-in-out duration-500 focus:outline-none focus:border-mainOrange':
            {},
        },
        '.custom-input-green': {
          '@apply border-[1px] border-green-700 rounded-md px-2 py-1 bg-mainGray text-sm xs:text-base text-green-700 transition-all ease-in-out duration-700 focus:outline-none focus:border-mainOrange':
            {},
        },
        '.custom-input-red': {
          '@apply border-[1px] border-red-700 rounded-md px-2 py-1 bg-mainGray text-sm xs:text-base text-red-700 transition-all ease-in-out duration-700 focus:outline-none focus:border-mainOrange':
            {},
        },
        '.side-menu-right-button': {
          '@apply flex flex-col shadow-sideMenuShadow z-20 absolute transition-all ease-in-out duration-700 p-2 items-center justify-center bg-lightGray font-mono font-bold border-r-2 border-mainOrange hover:border-green-500':
            {},
        },
        '.side-menu-left-button': {
          '@apply flex flex-col shadow-sideMenuShadow z-20 absolute transition-all ease-in-out duration-700 p-2 items-center justify-center bg-lightGray font-mono font-bold border-l-2 border-mainOrange hover:border-green-500':
            {},
        },
        '.side-menu-container': {
          '@apply flex flex-col shadow-sideMenuShadow z-20 absolute transition-all ease-in-out duration-700':
            {},
        },
        '.dashboard-button': {
          '@apply flex flex-row items-center justify-center space-x-4 xs:space-x-2 rounded-lg mt-1 sm:mt-2 px-2 sm:px-3 py-1 sm:py-2 bg-mainGray text-sm sm:text-base text-mainOrange border-2 border-mainOrange transition-all ease-in-out hover:bg-mainOrange hover:text-mainGray':
            {},
        },
        '.dashboard-icon': {
          '@apply text-mainOrange group-hover:text-mainGray transition-all ease-in-out min-w-fit size-4 sm:size-5':
            {},
        },
      });
    },
  ],
};
