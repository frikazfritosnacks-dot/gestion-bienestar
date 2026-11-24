import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, HeartHandshake, Smile, Sparkles, Sun } from 'lucide-react';
import { FrikazPiggyMascot } from '../mascot/FrikazPiggyMascot';
import { PiggyHoofPrintSvg } from '../mascot/WalkingPiggyCompanion';
import { ChipHeaderAccent, ChipSvg } from '../ui/ChipGraphics';

interface CoverPortadaProps {
  empresa: string;
  onStart: () => void;
}

const FRIKAZ_LOGO_URL = '/assets/aistudio/image_44eb546f.png';

/**
 * Portada inicial independiente que ocupa el 100 % de la pantalla.
 * Libre de tarjetas administrativas, estadísticas o textos técnicos;
 * centrada en la identidad visual de Frikaz S.A.S., el Plan de Bienestar
 * y el cerdito corporativo listo para iniciar el recorrido.
 */
export function CoverPortada({ empresa, onStart }: CoverPortadaProps) {
  const [entering, setEntering] = useState(false);

  const handleStartClick = () => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => {
      onStart();
    }, 1850);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-[#0F294A] flex flex-col justify-between">
      {/* Franja superior institucional */}
      <div className="flex h-2.5 w-full shrink-0">
        <div className="w-2/3 bg-[#D61F26]" />
        <div className="w-1/3 bg-[#FACC15]" />
      </div>

      {/* Formas de fondo cálidas y luminosas */}
      <div
        className="pointer-events-none absolute -right-28 -top-24 h-[520px] w-[520px] rounded-full bg-[#FEF9C3]/75"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#FEF2F2]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#EFF6FF]/60 blur-2xl"
        aria-hidden="true"
      />

      {/* Encabezado limpio con logo oficial */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-3.5">
          <img
            src={FRIKAZ_LOGO_URL}
            alt={`Logo oficial ${empresa}`}
            className="h-16 w-auto object-contain sm:h-20"
            referrerPolicy="no-referrer"
          />
          <div className="border-l-2 border-[#FACC15] pl-3.5">
            <p className="text-base font-extrabold tracking-tight text-[#D61F26] sm:text-lg">
              {empresa}
            </p>
            <p className="text-xs font-semibold text-[#0F294A]/75">
              Cultura Humana y Cuidado Integral
            </p>
          </div>
        </div>

        <ChipHeaderAccent className="hidden sm:inline-flex" />
      </header>

      {/* Escena central 100 % enfocada en la bienvenida */}
      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-6 py-8 sm:px-10 lg:grid-cols-12">
        {/* Columna izquierda: Título protagonista y botón ¡EMPEZAR! */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-7 lg:col-span-6"
        >
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#D61F26]">
            <Sparkles className="h-4 w-4 text-[#D97706]" />
            <span>{empresa}</span>
          </div>

          <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#0F294A] sm:text-6xl lg:text-7xl text-balance leading-[1.03]">
            PLAN DE{' '}
            <span className="block sm:inline text-[#D61F26] underline decoration-[#FACC15] decoration-[6px] underline-offset-[10px]">
              BIENESTAR
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#0F294A]/85 sm:text-xl font-medium">
            Un espacio diseñado para impulsar la alegría, la integración, la salud y el crecimiento
            de todas las personas que hacen posible{' '}
            <strong className="font-extrabold text-[#D61F26]">{empresa}</strong>.
          </p>

          {/* Motivos visuales humanos de bienestar (sin métricas ni tablas) */}
          <div className="flex flex-wrap items-center gap-6 pt-1 text-sm font-semibold text-[#0F294A]/80">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#D61F26]">
                <HeartHandshake className="h-4 w-4" />
              </span>
              Integración y Cercanía
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF9C3] text-[#0F294A]">
                <Sun className="h-4 w-4 text-[#D97706]" />
              </span>
              Equilibrio y Vitalidad
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0F294A]">
                <Smile className="h-4 w-4" />
              </span>
              Cultura Frikaz
            </span>
          </div>

          {/* Botón protagónico ¡EMPEZAR! */}
          <div className="pt-3">
            <motion.button
              type="button"
              onClick={handleStartClick}
              disabled={entering}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3.5 rounded-2xl bg-[#D61F26] border-b-[5px] border-[#FACC15] px-10 py-5 text-lg font-extrabold tracking-wide text-white shadow-xl transition-colors hover:bg-[#B3161C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{entering ? 'CAMINANDO...' : '¡EMPEZAR!'}</span>
              <ArrowRight className="h-6 w-6 text-[#FACC15] transition-transform duration-150 group-hover:translate-x-1.5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Columna derecha: Escenario protagonista del cerdito corporativo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center justify-center lg:col-span-6"
        >
          <div className="relative flex w-full max-w-lg flex-col items-center justify-center rounded-[2rem] border-2 border-[#FDE047] bg-[#FFFBEB] px-8 py-10 shadow-md overflow-hidden">
            {/* Acentos de papitas Frikaz */}
            <ChipSvg
              variant="ondulada"
              className="pointer-events-none absolute left-6 top-6 h-10 w-10 -rotate-12 opacity-90"
            />
            <ChipSvg
              variant="redonda"
              className="pointer-events-none absolute right-7 top-7 h-9 w-9 rotate-12 opacity-90"
            />
            <ChipSvg
              variant="lisa"
              className="pointer-events-none absolute left-8 bottom-9 h-9 w-9 rotate-6 opacity-85"
            />
            <ChipSvg
              variant="chip"
              className="pointer-events-none absolute right-8 bottom-8 h-9 w-9 -rotate-12 opacity-85"
            />

            {/* Huellas progresivas cuando el cerdito empieza a caminar pausadamente al presionar ¡EMPEZAR! */}
            {entering && (
              <div className="pointer-events-none absolute bottom-14 left-1/2 flex -translate-x-24 items-center gap-6">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: [0, 0.65, 0.35], scale: 1 }}
                    transition={{ delay: idx * 0.32, duration: 0.65 }}
                    style={{
                      transform: `translateY(${idx % 2 === 0 ? -5 : 5}px) rotate(90deg)`,
                    }}
                  >
                    <PiggyHoofPrintSvg />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Cerdito oficial de Frikaz S.A.S. caminando con calma al iniciar */}
            <motion.div
              animate={
                entering
                  ? { x: 240, opacity: 0 }
                  : { x: 0, opacity: 1 }
              }
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="relative z-10 py-2"
            >
              <FrikazPiggyMascot isWalking={entering} facing="right" size="hero" />
            </motion.div>

            {/* Sendero visual */}
            <div className="mt-1 h-2 w-56 rounded-full bg-[#FACC15]" />
            <p className="mt-4 text-sm font-extrabold tracking-tight text-[#0F294A]">
              {empresa}
            </p>
          </div>
        </motion.div>
      </main>

      {/* Pie limpio de portada */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/85 py-3.5 px-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-medium text-slate-500">
          <span>{empresa} · Plan de Bienestar</span>
          <span className="text-[#D61F26] font-bold">Personas en el centro</span>
        </div>
      </footer>
    </div>
  );
}
